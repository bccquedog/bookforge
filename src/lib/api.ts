import axios from 'axios'
import type { CoverGenerationOptions, CoverGenerationResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for file uploads
})

export interface BookProject {
  id: string
  title: string
  author: string
  status: 'created' | 'uploaded' | 'processing' | 'completed' | 'error'
  created_at: string
  formats: string[]
  manuscript_path?: string
  output_paths?: Record<string, string>
  page_count?: number
}

export interface BookConfig {
  title: string
  subtitle: string
  author: string
  imprint: string
  isbn: string
  trim: string
  paper: string
  fontFamily: string
  fontSize: number
  lineHeight: number
  outerMargin: number
  topMargin: number
  bottomMargin: number
  gutter: number
  chapterStartsRight: boolean
  hyphenate: boolean
  headerStyle: string
  includeToc: boolean
  includeDedication: boolean
  dedicationText: string
  includeCopyright: boolean
  copyrightYear: string
  copyrightHolder: string
  includeAck: boolean
  ackText: string
  includeAboutAuthor: boolean
  aboutAuthorText: string
  sceneBreak: string
}

// API functions
export const createProject = async (config: Partial<BookConfig>): Promise<BookProject> => {
  try {
    const response = await api.post('/api/projects', {
      title: config.title || 'Untitled Book',
      author: config.author || '',
      created_at: new Date().toISOString(),
      config: config
    })
    return response.data
  } catch (error: any) {
    console.error('Failed to create project:', error)
    throw new Error(`Failed to create project: ${error.response?.data?.message || error.message}`)
  }
}

export const uploadManuscript = async (projectId: string, file: File): Promise<void> => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    await api.post(`/api/projects/${projectId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  } catch (error: any) {
    console.error('Failed to upload manuscript:', error)
    throw new Error(`Failed to upload manuscript: ${error.response?.data?.message || error.message}`)
  }
}

export const buildBook = async (projectId: string): Promise<{ formats: string[] }> => {
  try {
    const response = await api.post(`/api/projects/${projectId}/build`, {})
    return response.data
  } catch (error: any) {
    console.error('Failed to build book:', error)
    throw new Error(`Failed to build book: ${error.response?.data?.message || error.message}`)
  }
}

export const getProject = async (projectId: string): Promise<BookProject> => {
  try {
    const response = await api.get(`/api/projects/${projectId}`)
    return response.data
  } catch (error: any) {
    console.error('Failed to get project:', error)
    throw new Error(`Failed to get project: ${error.response?.data?.message || error.message}`)
  }
}

export const getProjects = async (): Promise<BookProject[]> => {
  try {
    const response = await api.get('/api/projects')
    return response.data
  } catch (error: any) {
    console.error('Failed to get projects:', error)
    throw new Error(`Failed to get projects: ${error.response?.data?.message || error.message}`)
  }
}

export const downloadBook = async (projectId: string, format: string): Promise<Blob> => {
  try {
    const response = await api.get(`/api/projects/${projectId}/download/${format}`, {
      responseType: 'blob'
    })
    return response.data
  } catch (error: any) {
    console.error('Failed to download book:', error)
    throw new Error(`Failed to download book: ${error.response?.data?.message || error.message}`)
  }
}

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    await api.delete(`/api/projects/${projectId}`)
  } catch (error: any) {
    console.error('Failed to delete project:', error)
    throw new Error(`Failed to delete project: ${error.response?.data?.message || error.message}`)
  }
}

export const generateCover = async (
  projectId: string,
  options: CoverGenerationOptions
): Promise<CoverGenerationResponse> => {
  try {
    // DALL-E 3 can take up to 60 seconds to generate an image
    const response = await api.post(`/api/projects/${projectId}/generate-cover`, options, {
      timeout: 90000, // 90 seconds for AI image generation
    })
    return response.data
  } catch (error: any) {
    console.error('Failed to generate cover:', error)
    throw new Error(`Failed to generate cover: ${error.response?.data?.message || error.message}`)
  }
}

export const getCover = async (projectId: string): Promise<string> => {
  try {
    const response = await api.get(`/api/projects/${projectId}/cover`, {
      responseType: 'blob'
    })
    const blob = response.data
    return URL.createObjectURL(blob)
  } catch (error: any) {
    console.error('Failed to get cover:', error)
    throw new Error(`Failed to get cover: ${error.response?.data?.message || error.message}`)
  }
}

export const debugProject = async (projectId: string): Promise<any> => {
  try {
    const response = await api.get(`/api/projects/${projectId}/debug`)
    return response.data
  } catch (error: any) {
    console.error('Failed to get debug info:', error)
    throw new Error(`Failed to get debug info: ${error.response?.data?.message || error.message}`)
  }
}

export const previewBook = async (projectId: string, config?: Partial<BookConfig>): Promise<Blob> => {
  try {
    // PDF generation can take longer for large manuscripts
    const response = config
      ? await api.post(`/api/projects/${projectId}/preview`, { config }, {
          responseType: 'blob',
          timeout: 120000, // 2 minutes for PDF generation
        })
      : await api.get(`/api/projects/${projectId}/preview`, {
          responseType: 'blob',
          timeout: 120000, // 2 minutes for PDF generation
        })
    return response.data
  } catch (error: any) {
    console.error('Failed to get preview:', error)
    throw new Error(`Failed to get preview: ${error.response?.data?.message || error.message}`)
  }
}

// Utility function to download blob as file
export const downloadFile = (blob: Blob, filename: string): void => {
  try {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // Add proper attributes for better compatibility
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    console.log(`File downloaded: ${filename} (${blob.size} bytes, ${blob.type})`)
  } catch (error) {
    console.error('Error downloading file:', error)
    // Fallback: try to open in new window
    try {
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError)
    }
  }
}
