import { useState, useEffect } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PDFViewerProps {
  blob: Blob
  filename: string
  isOpen: boolean
  onClose: () => void
}

export function PDFViewer({ blob, filename, isOpen, onClose }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create PDF URL when component mounts or blob changes
  useEffect(() => {
    if (blob && isOpen) {
      try {
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
        setError(null)
        
        return () => {
          URL.revokeObjectURL(url)
        }
      } catch (err) {
        setError('Failed to create PDF URL')
        console.error('PDF URL creation error:', err)
      }
    } else {
      // Clean up URL when closing
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
    }
  }, [blob, isOpen])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl || ''
    link.download = filename
    link.click()
  }

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{filename}</h3>
              <p className="text-sm text-gray-600">PDF Preview</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenInNewTab}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-hidden">
            {error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-red-500 text-lg mb-2">⚠️</div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <p className="text-gray-600 text-sm mt-1">
                    The PDF file may be corrupted or in an unsupported format.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 btn-primary"
                  >
                    Download File
                  </button>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-lg"
                title={`PDF Preview: ${filename}`}
                onError={() => setError('Failed to load PDF document')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


