import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Settings, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  CheckCircle,
  Image,
  Eye
} from 'lucide-react'
import { FileUpload } from '../components/FileUpload'
import { CoverGenerator } from '../components/CoverGenerator'
import { SuggestionsPanel } from '../components/SuggestionsPanel'
import { ManuscriptReview } from '../components/ManuscriptReview'
import { ProcessingStatus } from '../components/ProcessingStatus'
import { PDFViewer } from '../components/PDFViewer'
import { toast } from 'react-hot-toast'
import { 
  createProject, 
  uploadManuscript, 
  buildBook, 
  getProject,
  downloadBook,
  downloadFile,
  debugProject,
  previewBook,
  type BookConfig,
  type BookProject
} from '../lib/api'
import { generateBookSuggestions, type BookSuggestions } from '../lib/suggestions'

const TRIM_PRESETS = {
  '5x8': { width: 5.0, height: 8.0, target: 'trade' },
  '5.5x8.5': { width: 5.5, height: 8.5, target: 'trade' },
  '6x9': { width: 6.0, height: 9.0, target: 'trade' },
  '8.5x11': { width: 8.5, height: 11.0, target: 'workbook' },
}

const PAPER_STOCKS = {
  'cream_55lb': { kdp: true, ingram: true, pagesPerInch: 444 },
  'white_50lb': { kdp: true, ingram: true, pagesPerInch: 512 },
}

export function WizardPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProject, setCurrentProject] = useState<BookProject | null>(null)
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<BookSuggestions | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [manuscriptContent, setManuscriptContent] = useState<string>('')
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['pdf', 'epub', 'docx'])
  const [buildResult, setBuildResult] = useState<{ formats: string[], output_paths?: Record<string, string> } | null>(null)
  const [processingSteps, setProcessingSteps] = useState<Array<{id: string, label: string, status: 'pending' | 'processing' | 'completed' | 'error', message?: string}>>([])
  const [currentProcessingStep, setCurrentProcessingStep] = useState<string | undefined>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookConfig>({
    defaultValues: {
      title: '',
      subtitle: '',
      author: '',
      trim: '6x9',
      paper: 'cream_55lb',
      fontFamily: "'EB Garamond','Garamond','Georgia',serif",
      fontSize: 11.0,
      lineHeight: 1.35,
      outerMargin: 0.75,
      topMargin: 0.75,
      bottomMargin: 0.85,
      gutter: 0.7,
      chapterStartsRight: true,
      hyphenate: true,
      headerStyle: 'author_title',
      includeToc: true,
      includeDedication: false,
      includeCopyright: true,
      includeAck: false,
      includeAboutAuthor: false,
      sceneBreak: '⁂',
    }
  })

  const steps = [
    { id: 'upload', title: 'Add Manuscript', icon: Upload },
    { id: 'details', title: 'Book Details', icon: FileText },
    { id: 'cover', title: 'Book Cover', icon: Image },
    { id: 'formatting', title: 'Formatting', icon: Settings },
    { id: 'preview', title: 'Preview', icon: FileText },
    { id: 'output', title: 'Generate', icon: Download },
  ]

    // Generate suggestions when file is uploaded
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file)
    setShowSuggestions(true)
    setIsAnalyzing(true)
    
    // Set up processing steps for file analysis
    const analysisSteps = [
      { id: 'extract', label: 'Extracting content from manuscript', status: 'processing' as const, message: `Reading ${file.name}...` },
      { id: 'analyze', label: 'Analyzing manuscript content', status: 'pending' as const },
      { id: 'suggestions', label: 'Generating book suggestions', status: 'pending' as const },
      { id: 'preview', label: 'Generating preview', status: 'pending' as const },
    ]
    setProcessingSteps(analysisSteps)
    setCurrentProcessingStep('extract')
    
    try {
      // Extract content from file for analysis
      await new Promise(resolve => setTimeout(resolve, 300)) // Small delay for UX
      const content = await extractContentFromFile(file)
      setManuscriptContent(content) // Store content for preview
      
      // Update step
      setProcessingSteps([
        { id: 'extract', label: 'Extracting content from manuscript', status: 'completed' as const },
        { id: 'analyze', label: 'Analyzing manuscript content', status: 'processing' as const, message: 'Reviewing structure and content...' },
        { id: 'suggestions', label: 'Generating book suggestions', status: 'pending' as const },
        { id: 'preview', label: 'Generating preview', status: 'pending' as const },
      ])
      setCurrentProcessingStep('analyze')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      const generatedSuggestions = await generateBookSuggestions(file, content)
      
      // Update step
      setProcessingSteps([
        { id: 'extract', label: 'Extracting content from manuscript', status: 'completed' as const },
        { id: 'analyze', label: 'Analyzing manuscript content', status: 'completed' as const },
        { id: 'suggestions', label: 'Generating book suggestions', status: 'completed' as const },
        { id: 'preview', label: 'Generating preview', status: 'processing' as const, message: 'Creating PDF preview...' },
      ])
      setCurrentProcessingStep('preview')
      
      setSuggestions(generatedSuggestions)
      
      // Auto-apply first title suggestion if form is empty
      const currentTitle = watch('title')
      if (!currentTitle && generatedSuggestions.title.length > 0) {
        setValue('title', generatedSuggestions.title[0])
      }
      
      // Auto-apply trim size suggestion
      setValue('trim', generatedSuggestions.trimSize as any)
      
      // Automatically create project and generate preview
      try {
        const formData = watch()
        const projectData = {
          ...formData,
          title: formData.title || generatedSuggestions.title[0] || file.name.replace(/\.[^/.]+$/, '') || 'Untitled Book',
          author: formData.author || 'Unknown Author'
        }
        
        // Create project
        const project = await createProject(projectData)
        setCurrentProject(project)
        
        // Upload manuscript
        await uploadManuscript(project.id, file)
        
        // Update form with defaults if they were empty
        if (!formData.title) {
          setValue('title', projectData.title)
        }
        if (!formData.author) {
          setValue('author', projectData.author)
        }
        
        // Generate preview automatically
        const previewBlobData = await previewBook(project.id, projectData)
        setPreviewBlob(previewBlobData)
        setIsPreviewOpen(true)
        
        // Complete preview step
        setProcessingSteps([
          { id: 'extract', label: 'Extracting content from manuscript', status: 'completed' as const },
          { id: 'analyze', label: 'Analyzing manuscript content', status: 'completed' as const },
          { id: 'suggestions', label: 'Generating book suggestions', status: 'completed' as const },
          { id: 'preview', label: 'Generating preview', status: 'completed' as const },
        ])
        setCurrentProcessingStep(undefined)
        
        toast.success('Preview generated! Check the preview window.')
      } catch (previewError: any) {
        console.error('Preview generation error:', previewError)
        // Don't fail the whole upload if preview fails
        setProcessingSteps([
          { id: 'extract', label: 'Extracting content from manuscript', status: 'completed' as const },
          { id: 'analyze', label: 'Analyzing manuscript content', status: 'completed' as const },
          { id: 'suggestions', label: 'Generating book suggestions', status: 'completed' as const },
          { id: 'preview', label: 'Generating preview', status: 'error' as const, message: previewError.message || 'Preview generation failed' },
        ])
        toast.error('Preview generation failed, but file uploaded successfully')
      }
      
      toast.success('Suggestions generated! Check the recommendations below.')
    } catch (error) {
      console.error('Error processing file:', error)
      setProcessingSteps((prev) => prev.map(s => s.status === 'processing' ? {...s, status: 'error' as const} : s))
      toast.error('Failed to analyze manuscript')
    } finally {
      setIsAnalyzing(false)
      // Clear processing steps after a delay
      setTimeout(() => {
        setProcessingSteps([])
        setCurrentProcessingStep(undefined)
      }, 3000)
    }
  }

  // Helper function to extract content from file
  const extractContentFromFile = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase()
    const fileType = file.type
    
    // For text-based files, use text() method
    if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.text') || fileName.endsWith('.md')) {
      return await file.text()
    }
    
    // For HTML files, extract text content
    if (fileType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      const htmlContent = await file.text()
      return htmlContent
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    // For binary formats, read as text for basic analysis (will be limited)
    try {
      return await file.text()
    } catch {
      return file.name // Fallback to filename
    }
  }

  const onSubmit = async (data: BookConfig) => {
    console.log('Form submitted with data:', data)
    console.log('Uploaded file:', uploadedFile)
    
    if (!uploadedFile) {
      toast.error('Please upload a manuscript file first')
      return
    }

        setIsProcessing(true)
        
        // Set up processing steps for book generation
        const generationSteps = [
          { id: 'create-project', label: 'Creating your project', status: 'processing' as const, message: 'Setting up book project...' },
          { id: 'upload-manuscript', label: 'Uploading manuscript', status: 'pending' as const },
          { id: 'analyze-content', label: 'Analyzing content with AI', status: 'pending' as const },
          { id: 'build-formats', label: 'Generating book formats', status: 'pending' as const },
          { id: 'finalize', label: 'Finalizing outputs', status: 'pending' as const },
        ]
        setProcessingSteps(generationSteps)
        setCurrentProcessingStep('create-project')
        
    try {
      console.log('Creating project...')
      await new Promise(resolve => setTimeout(resolve, 400)) // Small delay for UX
      // Create project
      const project = await createProject(data)
      setCurrentProject(project)
      console.log('Project created:', project)
      
      // Update step
      setProcessingSteps([
        { id: 'create-project', label: 'Creating your project', status: 'completed' as const },
        { id: 'upload-manuscript', label: 'Uploading manuscript', status: 'processing' as const, message: `Uploading ${uploadedFile?.name}...` },
        { id: 'analyze-content', label: 'Analyzing content with AI', status: 'pending' as const },
        { id: 'build-formats', label: 'Generating book formats', status: 'pending' as const },
        { id: 'finalize', label: 'Finalizing outputs', status: 'pending' as const },
      ])
      setCurrentProcessingStep('upload-manuscript')
      
      // DEBUG: Get preview after project creation
      try {
        const debugAfterCreate = await debugProject(project.id)
        console.log('🔍 DEBUG AFTER CREATE:', JSON.stringify(debugAfterCreate, null, 2))
      } catch (debugError) {
        console.error('Debug after create failed:', debugError)
      }
      
      toast.success('Project created successfully!')

      console.log('Uploading manuscript...')
      // Upload manuscript
      await new Promise(resolve => setTimeout(resolve, 300))
      await uploadManuscript(project.id, uploadedFile)
      
      // Update step
      setProcessingSteps([
        { id: 'create-project', label: 'Creating your project', status: 'completed' as const },
        { id: 'upload-manuscript', label: 'Uploading manuscript', status: 'completed' as const },
        { id: 'analyze-content', label: 'Analyzing content with AI', status: 'processing' as const, message: 'Getting AI-powered insights...' },
        { id: 'build-formats', label: 'Generating book formats', status: 'pending' as const },
        { id: 'finalize', label: 'Finalizing outputs', status: 'pending' as const },
      ])
      setCurrentProcessingStep('analyze-content')
      
      // Analyze manuscript if available
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        // Analysis happens in the background, we'll move to next step
      } catch (error) {
        console.error('Analysis error (non-critical):', error)
      }
      
      toast.success('Manuscript uploaded successfully!')

      // DEBUG: Get preview after upload
      try {
        const debugAfterUpload = await debugProject(project.id)
        console.log('🔍 DEBUG AFTER UPLOAD:', JSON.stringify(debugAfterUpload, null, 2))
      } catch (debugError) {
        console.error('Debug after upload failed:', debugError)
      }

            console.log('Building book...')
      // Build book
      console.log('Building book...')
      
      // Update step for building
      setProcessingSteps([
        { id: 'create-project', label: 'Creating your project', status: 'completed' as const },
        { id: 'upload-manuscript', label: 'Uploading manuscript', status: 'completed' as const },
        { id: 'analyze-content', label: 'Analyzing content with AI', status: 'completed' as const },
        { id: 'build-formats', label: 'Generating book formats', status: 'processing' as const, message: `Generating ${selectedFormats.join(', ').toUpperCase()} files...` },
        { id: 'finalize', label: 'Finalizing outputs', status: 'pending' as const },
      ])
      setCurrentProcessingStep('build-formats')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      const result = await buildBook(project.id)
      console.log('Book built:', result)
      
      // Update step for finalizing
      setProcessingSteps([
        { id: 'create-project', label: 'Creating your project', status: 'completed' as const },
        { id: 'upload-manuscript', label: 'Uploading manuscript', status: 'completed' as const },
        { id: 'analyze-content', label: 'Analyzing content with AI', status: 'completed' as const },
        { id: 'build-formats', label: 'Generating book formats', status: 'completed' as const },
        { id: 'finalize', label: 'Finalizing outputs', status: 'processing' as const, message: 'Preparing download links...' },
      ])
      setCurrentProcessingStep('finalize')
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Store build result for UI
      setBuildResult(result)
      
      // Complete all steps
      setProcessingSteps([
        { id: 'create-project', label: 'Creating your project', status: 'completed' as const },
        { id: 'upload-manuscript', label: 'Uploading manuscript', status: 'completed' as const },
        { id: 'analyze-content', label: 'Analyzing content with AI', status: 'completed' as const },
        { id: 'build-formats', label: 'Generating book formats', status: 'completed' as const },
        { id: 'finalize', label: 'Finalizing outputs', status: 'completed' as const },
      ])
      setCurrentProcessingStep(undefined)
      
      // DEBUG: Get preview after build
      try {
        const debugAfterBuild = await debugProject(project.id)
        console.log('🔍 DEBUG AFTER BUILD:', JSON.stringify(debugAfterBuild, null, 2))                                                                          
      } catch (debugError) {
        console.error('Debug after build failed:', debugError)
      }
      
      toast.success(`Book generated successfully! Available formats: ${result.formats.join(', ').toUpperCase()}`)                                                             

      // Update project status - get fresh project data with output_paths
      const updatedProject = await getProject(project.id)
      setCurrentProject(updatedProject)
      console.log('Final project:', updatedProject)
      
      // Move to completion view automatically
      // (We'll show download options in the same step)

    } catch (error: any) {
      console.error('Error processing book:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      // DEBUG: Get preview on error
      if (currentProject?.id) {
        try {
          const debugOnError = await debugProject(currentProject.id)
          console.log('🔍 DEBUG ON ERROR:', JSON.stringify(debugOnError, null, 2))
        } catch (debugError) {
          console.error('Debug on error failed:', debugError)
        }
      }
      
      toast.error(error.message || 'Failed to generate book')
    } finally {
      setIsProcessing(false)
    }
  }

  const nextStep = async () => {
    // If moving to cover step (step 2) and no project exists, create one
    if (currentStep === 1 && !currentProject) {
      const formData = watch()
      if (!formData.title || !formData.author) {
        toast.error('Please fill in title and author before proceeding')
        return
      }
      
      try {
        setIsProcessing(true)
        const project = await createProject(formData)
        setCurrentProject(project)
        toast.success('Project created')
      } catch (error: any) {
        toast.error('Failed to create project')
        return
      } finally {
        setIsProcessing(false)
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const loadPreview = async () => {
    if (!currentProject?.id) {
      toast.error('Please create a project first')
      return
    }

    if (!uploadedFile) {
      toast.error('Please upload a manuscript first')
      return
    }

    try {
      setIsLoadingPreview(true)
      
      // Get current form values and send to preview endpoint
      // This ensures preview reflects current settings
      const formData = watch()
      
      const blob = await previewBook(currentProject.id, formData)
      setPreviewBlob(blob)
      setIsPreviewOpen(true)
      toast.success('Preview loaded successfully')
    } catch (error: any) {
      console.error('Failed to load preview:', error)
      toast.error(error.message || 'Failed to load preview')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const PreviewButton = () => {
    // Show preview button if manuscript is uploaded
    // If no project exists yet, we'll create one on the fly when preview is clicked
    if (!uploadedFile) {
      return null
    }

    return (
      <button
        onClick={async () => {
          try {
            setIsLoadingPreview(true)
            
            // If no project exists, create one with current form values or defaults
            if (!currentProject) {
              const formData = watch()
              
              // Use defaults if title/author not filled in yet
              const projectData = {
                ...formData,
                title: formData.title || uploadedFile.name.replace(/\.[^/.]+$/, '') || 'Untitled Book',
                author: formData.author || 'Unknown Author'
              }
              
              const project = await createProject(projectData)
              setCurrentProject(project)
              
              // Upload manuscript
              await uploadManuscript(project.id, uploadedFile)
              
              // Update form with defaults if they were empty
              if (!formData.title) {
                setValue('title', projectData.title)
              }
              if (!formData.author) {
                setValue('author', projectData.author)
              }
            }
            
            // Now load preview (will use current form values)
            await loadPreview()
          } catch (error: any) {
            console.error('Preview error:', error)
            toast.error(error.message || 'Failed to generate preview')
            setIsLoadingPreview(false)
          }
        }}
        disabled={isLoadingPreview}
        className="btn-outline flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Eye className="w-4 h-4" />
        <span>{isLoadingPreview ? 'Loading Preview...' : 'Preview PDF'}</span>
      </button>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Your Manuscript</h3>
                <p className="text-gray-600">
                  Upload a file or type/paste your content directly. Supports: .docx, .doc, .odt, .rtf, .md, .txt, .html, .htm
                </p>
              </div>
              <PreviewButton />
            </div>
            <FileUpload 
              onFileSelect={handleFileUpload} 
              onTextSubmit={async (text) => {
                // Create a file from the text
                const blob = new Blob([text], { type: 'text/plain' })
                const file = new File([blob], 'manuscript.txt', { type: 'text/plain' })
                await handleFileUpload(file)
              }}
              selectedFile={uploadedFile} 
            />
            
            {/* Show processing status during analysis */}
            {isAnalyzing && processingSteps.length > 0 && (
              <ProcessingStatus 
                steps={processingSteps}
                currentStep={currentProcessingStep}
                message="Analyzing your manuscript..."
              />
            )}
            
            {/* Test file creation button for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Development: Create a test file</p>
                <button
                  onClick={() => {
                    const testContent = "# Test Book\n\nThis is a test manuscript for BookForge.\n\n## Chapter 1\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n## Chapter 2\n\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                    const blob = new Blob([testContent], { type: 'text/markdown' })
                    const file = new File([blob], 'test-manuscript.md', { type: 'text/markdown' })
                    setUploadedFile(file)
                    console.log('Test file created:', file)
                  }}
                  className="btn-outline text-sm"
                >
                  Create Test File
                </button>
              </div>
            )}
          </div>
        )
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Details</h3>
              <p className="text-gray-600">Tell us about your book</p>
              </div>
              <PreviewButton />
            </div>
            
            {/* Show suggestions if available */}
            {suggestions && showSuggestions && (
              <>
                <SuggestionsPanel
                  suggestions={suggestions}
                  onApplyTitle={(title) => {
                    setValue('title', title)
                    toast.success(`Title set to: "${title}"`)
                  }}
                  onApplySubtitle={(subtitle) => {
                    setValue('subtitle', subtitle)
                    toast.success(`Subtitle set to: "${subtitle}"`)
                  }}
                  onApplyTrim={(trim) => {
                    setValue('trim', trim as any)
                    toast.success(`Trim size set to: ${trim}`)
                  }}
                  onClose={() => setShowSuggestions(false)}
                />
                
                {/* Show detailed manuscript review */}
                {suggestions.manuscriptReview && (
                  <ManuscriptReview review={suggestions.manuscriptReview} />
                )}
              </>
            )}
            
            {/* Show button to regenerate suggestions if dismissed */}
            {uploadedFile && (!suggestions || !showSuggestions) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Want AI suggestions?</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Get intelligent recommendations for title, subtitle, and trim size based on your manuscript
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!uploadedFile) return
                      try {
                        const content = await extractContentFromFile(uploadedFile)
                        const generatedSuggestions = await generateBookSuggestions(uploadedFile, content)
                        setSuggestions(generatedSuggestions)
                        setShowSuggestions(true)
                        toast.success('Suggestions regenerated!')
                      } catch (error) {
                        toast.error('Failed to generate suggestions')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate Suggestions
                  </button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  className="input-field"
                  placeholder="Enter book title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>
              
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  id="subtitle"
                  {...register('subtitle')}
                  className="input-field"
                  placeholder="Enter subtitle (optional)"
                />
              </div>
              
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
                <input
                  id="author"
                  {...register('author', { required: 'Author is required' })}
                  className="input-field"
                  placeholder="Enter author name"
                />
                {errors.author && <p className="text-red-500 text-sm mt-1">{errors.author.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publisher/Imprint</label>
                <input
                  {...register('imprint')}
                  className="input-field"
                  placeholder="Enter publisher (optional)"
                />
              </div>
              
              <div>
                <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                <input
                  id="isbn"
                  {...register('isbn')}
                  className="input-field"
                  placeholder="Enter ISBN (optional)"
                />
              </div>
              
              <div>
                <label htmlFor="trim" className="block text-sm font-medium text-gray-700 mb-2">Trim Size</label>
                <select id="trim" {...register('trim')} className="input-field">
                  {Object.entries(TRIM_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {key} ({preset.width}" × {preset.height}")
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Cover</h3>
                <p className="text-gray-600">Generate a cover for your book</p>
              </div>
              <PreviewButton />
            </div>
            {currentProject ? (
              <CoverGenerator
                projectId={currentProject.id}
                title={watch('title')}
                author={watch('author')}
                subtitle={watch('subtitle')}
                onCoverGenerated={(coverUrl) => {
                  setGeneratedCoverUrl(coverUrl)
                  // Update project with cover URL
                  if (currentProject) {
                    setCurrentProject({ ...currentProject, cover_url: coverUrl })
                  }
                }}
              />
            ) : (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">Setting up cover generation...</p>
              </div>
            )}
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Formatting Options</h3>
              <p className="text-gray-600">Customize the appearance of your book</p>
              </div>
              <PreviewButton />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fontFamily" className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <input
                  id="fontFamily"
                  {...register('fontFamily')}
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-2">Font Size (pt)</label>
                <input
                  id="fontSize"
                  {...register('fontSize', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="lineHeight" className="block text-sm font-medium text-gray-700 mb-2">Line Height</label>
                <input
                  id="lineHeight"
                  {...register('lineHeight', { valueAsNumber: true })}
                  type="number"
                  step="0.05"
                  className="input-field"
                />
              </div>
              
              <div>
                <label htmlFor="paper" className="block text-sm font-medium text-gray-700 mb-2">Paper Stock</label>
                <select id="paper" {...register('paper')} className="input-field">
                  {Object.entries(PAPER_STOCKS).map(([key]) => (
                    <option key={key} value={key}>
                      {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="includeToc"
                  {...register('includeToc')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="includeToc" className="ml-2 block text-sm text-gray-900">Include Table of Contents</label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="chapterStartsRight"
                  {...register('chapterStartsRight')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="chapterStartsRight" className="ml-2 block text-sm text-gray-900">Start chapters on right-hand pages</label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="hyphenate"
                  {...register('hyphenate')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hyphenate" className="ml-2 block text-sm text-gray-900">Enable hyphenation</label>
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Your Book</h3>
              <p className="text-gray-600">Review your book preview before generating the final output</p>
              </div>
              <PreviewButton />
            </div>
            
            {/* Book Information Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200">
              <h4 className="font-bold text-lg text-gray-900 mb-4">{watch('title')}</h4>
              {watch('subtitle') && (
                <p className="text-primary-700 font-medium mb-2">{watch('subtitle')}</p>
              )}
              <p className="text-gray-700 mb-4">by {watch('author')}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="bg-white px-3 py-1 rounded-full">
                  <span className="text-gray-600">Trim:</span> <span className="font-medium">{watch('trim')}</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full">
                  <span className="text-gray-600">Pages:</span> <span className="font-medium">~{suggestions?.estimatedPages || 0}</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full">
                  <span className="text-gray-600">Font:</span> <span className="font-medium">{watch('fontSize')}pt</span>
                </div>
              </div>
            </div>
            
            {/* Manuscript Content Preview */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Manuscript Preview</h4>
                <p className="text-sm text-gray-600">First 500 words of your manuscript</p>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <pre className="font-serif text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {manuscriptContent ? (
                    manuscriptContent.substring(0, 500) + (manuscriptContent.length > 500 ? '...' : '')
                  ) : (
                    'No manuscript content available'
                  )}
                </pre>
              </div>
            </div>
            
            {/* Formatting Options Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-xs font-medium text-blue-700 mb-2">FORMATTING</h5>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-600">Font:</span> {watch('fontFamily')}</p>
                  <p><span className="text-blue-600">Size:</span> {watch('fontSize')}pt</p>
                  <p><span className="text-blue-600">Line Height:</span> {watch('lineHeight')}</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="text-xs font-medium text-green-700 mb-2">OPTIONS</h5>
                <div className="space-y-1 text-sm">
                  <p className="text-green-800">
                    <input type="checkbox" checked={watch('includeToc')} readOnly className="mr-2" />
                    Table of Contents
                  </p>
                  <p className="text-green-800">
                    <input type="checkbox" checked={watch('hyphenate')} readOnly className="mr-2" />
                    Hyphenation
                  </p>
                  <p className="text-green-800">
                    <input type="checkbox" checked={watch('chapterStartsRight')} readOnly className="mr-2" />
                    Chapters Start Right
                  </p>
                </div>
              </div>
            </div>
            
            {/* Output Formats */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-purple-900 mb-3">Available Output Formats</h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">PDF</div>
                  <div className="text-xs text-gray-600 mt-1">Print-ready</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">EPUB</div>
                  <div className="text-xs text-gray-600 mt-1">E-reader</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">DOCX</div>
                  <div className="text-xs text-gray-600 mt-1">Editable</div>
                </div>
              </div>
            </div>
            
            {generatedCoverUrl && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-900 mb-3">Cover Design</h5>
                <img 
                  src={generatedCoverUrl} 
                  alt="Book cover preview" 
                  className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        )
      
            case 5:
        // Check if build is complete (either from buildResult or project output_paths)
        const isComplete = buildResult?.formats && buildResult.formats.length > 0
        const availableFormats = buildResult?.formats || currentProject?.formats || []
        
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                        <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Your Book</h3>
              <p className="text-gray-600">
                {isComplete ? 'Your book has been generated! Download your files below.' : 'Review your settings and generate the final book'}
              </p>
              </div>
              <PreviewButton />
            </div>
            
            {/* Show processing status during generation */}
            {isProcessing && processingSteps.length > 0 && (
              <ProcessingStatus 
                steps={processingSteps}
                currentStep={currentProcessingStep}
                message="Generating your book... This may take a minute."
              />
            )}
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Summary</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Title:</strong> {watch('title')}</p>
                <p><strong>Author:</strong> {watch('author')}</p>
                <p><strong>Trim Size:</strong> {watch('trim')}</p>
                <p><strong>Paper:</strong> {watch('paper')}</p>
                <p><strong>File:</strong> {uploadedFile?.name}</p>
                {generatedCoverUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p><strong>Cover:</strong> Generated ✓</p>
                    <img 
                      src={generatedCoverUrl} 
                      alt="Book cover" 
                      className="mt-2 max-w-xs rounded-lg shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Completion/Download Section */}
            {isComplete && availableFormats.length > 0 && currentProject && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center text-lg">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Book Generated Successfully!
                </h4>
                <p className="text-green-700 mb-6">
                  Your book has been formatted and is ready for download. Click any format below to download:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {availableFormats.map((format) => (
                    <button
                      key={format}
                      onClick={async () => {
                        try {
                          console.log(`Downloading ${format} for project ${currentProject.id}`)
                          const blob = await downloadBook(currentProject.id, format)
                          console.log(`Received blob:`, blob.type, blob.size, 'bytes')
                          downloadFile(blob, `${currentProject.title || 'book'}.${format}`)
                          toast.success(`${format.toUpperCase()} downloaded successfully!`)
                        } catch (error: any) {
                          console.error(`Failed to download ${format}:`, error)
                          toast.error(`Failed to download ${format.toUpperCase()}: ${error.message || 'Unknown error'}`)
                        }
                      }}
                      className="bg-white hover:bg-green-100 border-2 border-green-400 hover:border-green-600 rounded-lg p-6 flex items-center space-x-4 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Download className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-green-900 text-lg">
                          Download {format.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format === 'pdf' ? 'Print-ready PDF for KDP/IngramSpark' :
                           format === 'epub' ? 'E-reader format for Kindle/iBooks' :
                           format === 'docx' ? 'Editable Microsoft Word document' :
                           format === 'html' ? 'Web-ready HTML file' : 'Ready to download'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Next Steps:</h5>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">1.</span>
                      <span>Download your preferred format(s) above</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">2.</span>
                      <span>Review the PDF to ensure everything looks correct</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">3.</span>
                      <span>Upload to KDP, IngramSpark, or your publishing platform</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">4.</span>
                      <span>Optional: Generate a cover or create another book</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-green-200">
                  <button
                    onClick={() => {
                      setBuildResult(null)
                      setCurrentStep(0)
                      setCurrentProject(null)
                      setUploadedFile(null)
                    }}
                    className="text-sm text-green-700 hover:text-green-900 font-medium underline"
                  >
                    Create Another Book
                  </button>
                </div>
              </div>
            )}
            
            {/* Format Selection & Generate Button */}
            {!isProcessing && !isComplete && uploadedFile && currentProject && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">                                                                          
                <h4 className="font-semibold text-primary-900 mb-4">Select Output Formats</h4>
                <p className="text-sm text-primary-700 mb-4">
                  Choose which formats you'd like to generate. All formats are recommended for maximum compatibility.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {['pdf', 'epub', 'docx'].map((format) => (
                    <label
                      key={format}
                      className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-colors ${
                        selectedFormats.includes(format)
                          ? 'border-primary-600 bg-primary-100'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFormats.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFormats([...selectedFormats, format])
                          } else {
                            setSelectedFormats(selectedFormats.filter(f => f !== format))
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="font-bold text-lg mb-1">{format.toUpperCase()}</div>
                      <div className="text-xs text-gray-600">
                        {format === 'pdf' ? 'Print-ready' : format === 'epub' ? 'E-reader' : 'Editable'}
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isProcessing || !uploadedFile || selectedFormats.length === 0}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"                                                           
                >
                  <Download className="w-5 h-5" />
                  <span>Generate Book{selectedFormats.length > 0 ? ` (${selectedFormats.length} format${selectedFormats.length > 1 ? 's' : ''})` : ''}</span>
                </button>
              </div>
            )}
            
            {isProcessing && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>                                            
                <p className="text-lg font-medium text-gray-900">Processing your book...</p>
                <p className="text-sm text-gray-600 mt-2">This may take a minute. Please don't close this page.</p>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Formatting Wizard</h1>
        <p className="text-gray-600">Follow these steps to transform your manuscript into a professional book</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        {/* Mobile: Show current step number */}
        <div className="block sm:hidden mb-4">
          <p className="text-sm text-gray-600">
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
          </p>
        </div>
        
        {/* Desktop: Show all steps */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentStep 
                  ? 'border-primary-600 bg-primary-600 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  index <= currentStep ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-3">
            <PreviewButton />
          {currentStep === steps.length - 1 ? (
            !isComplete && (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isProcessing || !uploadedFile}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'Generate Book'}</span>
              </button>
            )
          ) : (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      </div>

      {/* PDF Preview Modal */}
      {previewBlob && (
        <PDFViewer
          blob={previewBlob}
          filename={`${watch('title') || 'Book'}_preview.pdf`}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            // Clean up blob after a delay
            setTimeout(() => {
              setPreviewBlob(null)
            }, 300)
          }}
        />
      )}
    </div>
  )
}

