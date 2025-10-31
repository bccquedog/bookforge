import { Sparkles, BookOpen, Lightbulb, CheckCircle } from 'lucide-react'
import { BookSuggestions } from '../lib/suggestions'

interface SuggestionsPanelProps {
  suggestions: BookSuggestions
  onApplyTitle: (title: string) => void
  onApplySubtitle: (subtitle: string) => void
  onApplyTrim: (trim: string) => void
  onClose: () => void
}

export function SuggestionsPanel({
  suggestions,
  onApplyTitle,
  onApplySubtitle,
  onApplyTrim,
  onClose
}: SuggestionsPanelProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Dismiss
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Title Suggestions */}
        {suggestions.title && suggestions.title.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Title Suggestions</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.title.map((title, index) => (
                <button
                  key={index}
                  onClick={() => onApplyTitle(title)}
                  className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Subtitle Suggestions */}
        {suggestions.subtitle && suggestions.subtitle.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">Subtitle Suggestions</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.subtitle.map((subtitle, index) => (
                <button
                  key={index}
                  onClick={() => onApplySubtitle(subtitle)}
                  className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {subtitle}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Trim Size Recommendation */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <label className="text-sm font-medium text-gray-700">Recommended Trim Size</label>
            </div>
            <button
              onClick={() => onApplyTrim(suggestions.trimSize)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Apply
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-lg font-semibold text-gray-900">{suggestions.trimSize}</span>
            <span className="text-sm text-gray-600">{suggestions.trimSizeReason}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Estimated: {suggestions.estimatedPages} pages ({suggestions.estimatedWordCount.toLocaleString()} words)
          </div>
        </div>
      </div>
    </div>
  )
}

