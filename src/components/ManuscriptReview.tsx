import { Lightbulb, TrendingUp, AlertCircle, Info, X } from 'lucide-react'
import type { ManuscriptReview } from '../lib/suggestions'

interface ManuscriptReviewProps {
  review: ManuscriptReview
  onClose?: () => void
}

export function ManuscriptReview({ review, onClose }: ManuscriptReviewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-orange-100'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-primary-600" />
            <span>Manuscript Review</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered analysis of your writing
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Overall Score</h4>
            <p className="text-xs text-gray-600">Based on structure, pacing, and readability</p>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(review.overallScore)}`}>
            {review.overallScore}/100
          </div>
        </div>
      </div>

      {/* Strengths */}
      {review.strengths.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Strengths</span>
          </h4>
          <div className="space-y-2">
            {review.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-3 bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-green-900">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement Areas */}
      {review.improvementAreas.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span>Areas for Improvement</span>
          </h4>
          <div className="space-y-2">
            {review.improvementAreas.map((area, index) => (
              <div key={index} className="flex items-start space-x-3 bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-orange-900">{area}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Analysis */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Genre</h5>
          <p className="text-sm font-semibold text-gray-900">{review.contentAnalysis.genreGuess}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Reading Level</h5>
          <p className="text-sm font-semibold text-gray-900">{review.contentAnalysis.readingLevel}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Pacing</h5>
          <p className="text-sm font-semibold text-gray-900">{review.contentAnalysis.pacing}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Structure</h5>
          <p className="text-sm font-semibold text-gray-900">{review.contentAnalysis.structure}</p>
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{review.statistics.avgSentenceLength}</div>
            <div className="text-xs text-blue-700 mt-1">Avg Words per Sentence</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{review.statistics.dialoguePercentage}%</div>
            <div className="text-xs text-blue-700 mt-1">Dialogue</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{review.statistics.avgParagraphLength}</div>
            <div className="text-xs text-blue-700 mt-1">Avg Words per Paragraph</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{review.statistics.actionPercentage}%</div>
            <div className="text-xs text-blue-700 mt-1">Action Verbs</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {review.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>Recommendations</span>
          </h4>
          <div className="space-y-3">
            {review.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={`rounded-lg p-4 border ${
                  rec.type === 'warning' 
                    ? 'bg-orange-50 border-orange-200' 
                    : rec.type === 'suggestion'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  rec.type === 'warning' 
                    ? 'text-orange-900' 
                    : rec.type === 'suggestion'
                    ? 'text-blue-900'
                    : 'text-gray-900'
                }`}>
                  {rec.title}
                </div>
                <div className={`text-xs ${
                  rec.type === 'warning' 
                    ? 'text-orange-700' 
                    : rec.type === 'suggestion'
                    ? 'text-blue-700'
                    : 'text-gray-700'
                }`}>
                  {rec.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

