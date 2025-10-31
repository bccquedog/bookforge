import { useState } from 'react'
import { Image, Sparkles, Download, RefreshCw } from 'lucide-react'
import { generateCover, downloadFile } from '../lib/api'
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
] as const

export function CoverGenerator({ 
  projectId, 
  title, 
  author, 
  subtitle,
  onCoverGenerated 
}: CoverGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<CoverGenerationOptions['style']>('modern')
  const [description, setDescription] = useState('')
  const [generatedCover, setGeneratedCover] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!title || !author) {
      toast.error('Please provide title and author information first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await generateCover(projectId, {
        style: selectedStyle,
        description: description.trim() || `${title} by ${author}${subtitle ? ` - ${subtitle}` : ''}`,
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Book Cover</h3>
        <p className="text-gray-600">
          Create a professional book cover using AI. Customize the style and add details about your book.
        </p>
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

      {/* Style Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Cover Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COVER_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => setSelectedStyle(style.value as CoverGenerationOptions['style'])}
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
          placeholder="Describe the mood, theme, or specific elements you'd like in your cover (e.g., 'a mysterious forest at night', 'bright cityscape', 'vintage illustration style')"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use book title and author automatically
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This feature uses OpenAI's DALL-E API to generate covers. 
          Make sure you have set your <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> environment variable 
          in your backend server for production use.
        </p>
      </div>
    </div>
  )
}


