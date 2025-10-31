import { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'

interface TextInputProps {
  onTextSubmit: (text: string) => void
}

export function TextInput({ onTextSubmit }: TextInputProps) {
  const [text, setText] = useState('')
  const [wordCount, setWordCount] = useState(0)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setText(value)
    const words = value.split(/\s+/).filter(w => w.length > 0)
    setWordCount(words.length)
  }

  const handleSubmit = () => {
    if (text.trim().length < 10) {
      alert('Please enter at least 10 words for your manuscript')
      return
    }
    
    // Create a virtual file-like object
    const blob = new Blob([text], { type: 'text/plain' })
    const file = new File([blob], 'manuscript.txt', { type: 'text/plain' })
    
    onTextSubmit(text)
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Type or Paste Your Manuscript</h4>
            <p className="text-sm text-gray-600 mt-1">
              Enter your book content directly below. Great for quick drafts or pasting from other sources.
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste or type your manuscript here...

Example:
Chapter 1: The Beginning

It was a dark and stormy night when Sarah first discovered the secret. The old mansion loomed before her, its windows dark and foreboding. She knew she had to go inside, but something felt wrong...


Chapter 2: Discovery

Inside, the rooms were filled with dust and memories of a time long past. Sarah wandered through the corridors, her footsteps echoing in the silence..."
          className="w-full h-64 px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
        />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{wordCount} words</span>
            </div>
            <div className="text-xs">
              ~{Math.ceil(wordCount / 250)} pages estimated
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={text.trim().length < 10}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use This Text
          </button>
        </div>

        {text.trim().length > 0 && text.trim().length < 10 && (
          <p className="text-sm text-red-600 mt-2">
            Please enter at least 10 words to proceed
          </p>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-900 mb-1">Pro Tip</h5>
        <p className="text-xs text-blue-700">
          You can paste content from Word, Google Docs, or any text editor. The system will automatically extract and format your content.
        </p>
      </div>
    </div>
  )
}

