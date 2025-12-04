import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Image, Sparkles, Download, RefreshCw, Upload, X } from 'lucide-react'
import { generateCover, uploadCover, downloadFile } from '../lib/api'
import { toast } from 'react-hot-toast'
import type { CoverGenerationOptions } from '../types'

interface CoverGeneratorProps {
  projectId: string
  title: string
  author: string
  subtitle?: string
  onCoverGenerated?: (coverUrl: string) => void
}

const COVER_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Minimalist design with clean typography' },
  { value: 'classic', label: 'Classic', description: 'Elegant traditional design' },
  { value: 'fantasy', label: 'Fantasy', description: 'Epic fantasy art style' },
  { value: 'mystery', label: 'Mystery', description: 'Dark, moody atmosphere' },
  { value: 'romance', label: 'Romance', description: 'Romantic, warm colors' },
  { value: 'sci-fi', label: 'Sci-Fi', description: 'Futuristic, high-tech design' },
  { value: 'non-fiction', label: 'Non-Fiction', description: 'Professional, informative design' },
  { value: 'thriller', label: 'Thriller', description: 'High-tension, gripping design' },
  { value: 'historical', label: 'Historical', description: 'Vintage, period-appropriate design' },
  { value: 'horror', label: 'Horror', description: 'Chilling, dark atmosphere' },
  { value: 'business', label: 'Business', description: 'Professional corporate design' },
  { value: 'self-help', label: 'Self-Help', description: 'Inspiring, uplifting design' },
] as const

const COLOR_PALETTES = [
  { value: 'auto', label: 'Auto', description: 'Style-appropriate colors' },
  { value: 'warm', label: 'Warm', description: 'Oranges, reds, yellows' },
  { value: 'cool', label: 'Cool', description: 'Blues, greens, purples' },
  { value: 'monochrome', label: 'Monochrome', description: 'Black, white, grays' },
  { value: 'bold', label: 'Bold', description: 'Vibrant, high contrast' },
  { value: 'pastel', label: 'Pastel', description: 'Soft, gentle tones' },
  { value: 'dark', label: 'Dark', description: 'Moody, deep shadows' },
  { value: 'bright', label: 'Bright', description: 'Cheerful, high energy' },
] as const

const VISUAL_STYLES = [
  { value: 'illustrated', label: 'Illustrated', description: 'Hand-drawn or digital art' },
  { value: 'photographic', label: 'Photographic', description: 'High-quality photography' },
  { value: 'mixed', label: 'Mixed Media', description: 'Combination of photo and illustration' },
  { value: 'graphic', label: 'Graphic Design', description: 'Abstract shapes, typography-focused' },
  { value: 'painterly', label: 'Painterly', description: 'Artistic brushstroke style' },
] as const

const MOODS = [
  { value: 'neutral', label: 'Neutral', description: 'Balanced atmosphere' },
  { value: 'energetic', label: 'Energetic', description: 'Dynamic with movement' },
  { value: 'calm', label: 'Calm', description: 'Peaceful and serene' },
  { value: 'dramatic', label: 'Dramatic', description: 'Intense emotional impact' },
  { value: 'mysterious', label: 'Mysterious', description: 'Enigmatic and intriguing' },
  { value: 'warm', label: 'Warm', description: 'Inviting and friendly' },
] as const

export function CoverGenerator({ 
  projectId, 
  title, 
  author, 
  subtitle,
  onCoverGenerated 
}: CoverGeneratorProps) {
  const [mode, setMode] = useState<'generate' | 'upload'>('generate')
  const [selectedStyle, setSelectedStyle] = useState<string>('modern')
  const [colorPalette, setColorPalette] = useState<string>('auto')
  const [visualStyle, setVisualStyle] = useState<string>('illustrated')
  const [mood, setMood] = useState<string>('neutral')
  const [description, setDescription] = useState('')
  const [generatedCover, setGeneratedCover] = useState<string | null>(null)
  const [uploadedCoverFile, setUploadedCoverFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedCoverFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleGenerate = async () => {
    if (!title || !author) {
      toast.error('Please provide title and author information first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await generateCover(projectId, {
        style: selectedStyle,
        colorPalette: colorPalette,
        visualStyle: visualStyle,
        mood: mood,
        description: description.trim(),                                                          
      })

      setGeneratedCover(response.cover_url)
      onCoverGenerated?.(response.cover_url)
      toast.success('Cover generated successfully!')
    } catch (error: any) {
      console.error('Failed to generate cover:', error)
      toast.error(error.message || 'Failed to generate cover')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadedCoverFile) {
      toast.error('Please select a cover image to upload')
      return
    }

    setIsUploading(true)
    try {
      const response = await uploadCover(projectId, uploadedCoverFile)
      setGeneratedCover(response.cover_url)
      onCoverGenerated?.(response.cover_url)
      toast.success('Cover uploaded successfully!')
    } catch (error: any) {
      console.error('Failed to upload cover:', error)
      toast.error(error.message || 'Failed to upload cover')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedCover) return

    try {
      // Convert data URL to blob
      const response = await fetch(generatedCover)
      const blob = await response.blob()
      downloadFile(blob, `${title}_cover.png`)
      toast.success('Cover downloaded!')
    } catch (error: any) {
      console.error('Failed to download cover:', error)
      toast.error('Failed to download cover')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Cover</h3>
        <p className="text-gray-600">
          Generate a professional book cover using AI or upload your own custom cover image.
        </p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setMode('generate')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'generate'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </div>
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'upload'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Your Own</span>
          </div>
        </button>
      </div>

      {/* Book Info Preview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Book Details</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Title:</strong> {title || 'Not set'}</p>
          {subtitle && <p><strong>Subtitle:</strong> {subtitle}</p>}
          <p><strong>Author:</strong> {author || 'Not set'}</p>
        </div>
      </div>

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Cover Image
            </label>
            {uploadedCoverFile ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Image className="w-8 h-8 text-green-500" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800">{uploadedCoverFile.name}</h4>
                      <p className="text-xs text-green-600">
                        {(uploadedCoverFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedCoverFile(null)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {uploadedCoverFile.type.startsWith('image/') && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(uploadedCoverFile)}
                      alt="Cover preview"
                      className="max-w-full max-h-64 rounded-lg border border-green-200"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-primary-600 font-medium">Drop your cover image here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 font-medium mb-2">
                      Drop your cover image here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports: PNG, JPG, JPEG, GIF, WEBP (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading || !uploadedCoverFile}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading Cover...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Cover</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Generate Mode */}
      {mode === 'generate' && (
        <>
            {/* Style Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Cover Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {COVER_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => setSelectedStyle(style.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedStyle === style.value
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{style.label}</div>
              <div className="text-xs text-gray-500 mt-1">{style.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
        >
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
          <span>{showAdvanced ? '−' : '+'}</span>
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 border-t pt-4">
          {/* Visual Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visual Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setVisualStyle(style.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    visualStyle === style.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{style.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Palette
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.value}
                  onClick={() => setColorPalette(palette.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    colorPalette === palette.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{palette.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{palette.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mood / Atmosphere
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MOODS.map((moodOption) => (
                <button
                  key={moodOption.value}
                  onClick={() => setMood(moodOption.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    mood === moodOption.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{moodOption.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{moodOption.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Description Input */}
      <div>
        <label htmlFor="cover-description" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Description (Optional)
        </label>
                <textarea
          id="cover-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field w-full min-h-[100px]"
          placeholder="Describe specific visual elements, scenes, or details you'd like in your cover (e.g., 'a mysterious forest at night with fog', 'bright modern cityscape at sunset', 'vintage illustration of a ship', 'abstract geometric patterns'). Leave empty for AI-generated suggestions based on your book details."
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional: Add specific details about imagery, composition, or visual elements you want included
        </p>
      </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !title || !author}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Cover...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Cover</span>
              </>
            )}
          </button>
        </>
      )}

      {/* Generated Cover Preview */}
      {generatedCover && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Image className="w-4 h-4 mr-2" />
            Generated Cover
          </h4>
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={generatedCover}
              alt={`Cover for ${title}`}
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="btn-outline flex items-center space-x-2 flex-1"
            >
              <Download className="w-4 h-4" />
              <span>Download Cover</span>
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-outline flex items-center space-x-2 flex-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      )}

      {/* Info Note */}
      {mode === 'generate' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This feature uses OpenAI's DALL-E API to generate covers. 
            Make sure you have set your <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> environment variable 
            in your backend server for production use.
          </p>
        </div>
      )}
    </div>
  )
}


