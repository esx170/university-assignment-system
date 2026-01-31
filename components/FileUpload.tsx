'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string[]
  maxSize?: number // in MB
  currentFile?: File | null
  onRemoveFile?: () => void
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ['pdf', 'doc', 'docx', 'zip'],
  maxSize = 10,
  currentFile,
  onRemoveFile
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxSize}MB.`)
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`)
      } else {
        setError('File upload failed. Please try again.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (!acceptedTypes.includes(fileExtension || '')) {
        setError(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`)
        return
      }

      onFileSelect(file)
    }
  }, [onFileSelect, acceptedTypes, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    accept: acceptedTypes.reduce((acc, type) => {
      const mimeTypes: { [key: string]: string[] } = {
        pdf: ['application/pdf'],
        doc: ['application/msword'],
        docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        zip: ['application/zip', 'application/x-zip-compressed'],
        txt: ['text/plain'],
        jpg: ['image/jpeg'],
        jpeg: ['image/jpeg'],
        png: ['image/png']
      }
      if (mimeTypes[type]) {
        acc[mimeTypes[type][0]] = mimeTypes[type]
      }
      return acc
    }, {} as { [key: string]: string[] })
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (currentFile) {
    return (
      <div className="border-2 border-gray-300 border-dashed rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <File className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(currentFile.size)}</p>
            </div>
          </div>
          {onRemoveFile && (
            <button
              onClick={onRemoveFile}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-primary-600">Drop the file here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Drag and drop a file here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Accepted formats: {acceptedTypes.join(', ')} (max {maxSize}MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}