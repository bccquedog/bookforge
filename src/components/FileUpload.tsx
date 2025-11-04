import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, AlertCircle, CheckCircle, FileText, Type } from 'lucide-react'
import { TextInput } from './TextInput'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onTextSubmit?: (text: string) => void
  selectedFile?: File | null
}

export function FileUpload({ onFileSelect, onTextSubmit, selectedFile }: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'type'>('upload')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setUploadedFile(file)
      onFileSelect(file)
      console.log('File uploaded:', file.name, file.size, file.type)
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      // Microsoft Word formats
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      // OpenDocument formats
      'application/vnd.oasis.opendocument.text': ['.odt'],
      // Rich Text Format
      'application/rtf': ['.rtf'],
      'text/rtf': ['.rtf'],
      // Text formats
      'text/markdown': ['.md'],
      'text/plain': ['.txt', '.text'],
      // HTML formats
      'text/html': ['.html', '.htm']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const currentFile = selectedFile || uploadedFile

  const handleTextSubmit = (text: string) => {
    // Create a virtual file from the pasted text
    const blob = new Blob([text], { type: 'text/plain' })
    const file = new File([blob], 'manuscript.txt', { type: 'text/plain' })
    setUploadedFile(file)
    onFileSelect(file)
    if (onTextSubmit) {
      onTextSubmit(text)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      {!currentFile && (
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'type'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4" />
              <span>Type or Paste</span>
            </div>
          </button>
        </div>
      )}

      {/* Content based on tab */}
      {currentFile ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">File uploaded successfully!</h4>
              <div className="mt-1 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">{currentFile.name}</span>
                <span className="text-xs text-green-600">
                  ({currentFile.size < 1024 * 1024
                    ? `${(currentFile.size / 1024).toFixed(1)} KB`
                    : `${(currentFile.size / 1024 / 1024).toFixed(1)} MB`})
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setUploadedFile(null)
                onFileSelect(null as any)
                setActiveTab('upload')
              }}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      ) : activeTab === 'upload' ? (
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
            <p className="text-primary-600 font-medium">Drop your manuscript here...</p>
          ) : (
            <div>
              <p className="text-gray-600 font-medium mb-2">Drop your manuscript here, or click to browse</p>
              <p className="text-sm text-gray-500">
                Supports: .docx, .doc, .odt, .rtf, .md, .txt, .html, .htm (max 50MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        onTextSubmit ? (
          <TextInput onTextSubmit={handleTextSubmit} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Text input not available</p>
          </div>
        )
      )}

      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">File rejected</h4>
              <ul className="text-sm text-red-700 mt-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    {file.name}: {errors.map(e => e.message).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

