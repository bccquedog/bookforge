import axios from 'axios'
import * as mockApi from './mockApi'
import type { CoverGenerationOptions, CoverGenerationResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' // Use mock API only in development

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

// API functions with fallback to mock
export const createProject = async (config: Partial<BookConfig>): Promise<BookProject> => {
  if (USE_MOCK_API) {
    return mockApi.createProject(config)
  }
  
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
  if (USE_MOCK_API) {
    return mockApi.uploadManuscript(projectId, file)
  }
  
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
  if (USE_MOCK_API) {
    return mockApi.buildBook(projectId)
  }
  
  try {
    const response = await api.post(`/api/projects/${projectId}/build`)
    return response.data
  } catch (error: any) {
    console.error('Failed to build book:', error)
    throw new Error(`Failed to build book: ${error.response?.data?.message || error.message}`)
  }
}

export const getProject = async (projectId: string): Promise<BookProject> => {
  if (USE_MOCK_API) {
    return mockApi.getProject(projectId)
  }
  
  try {
    const response = await api.get(`/api/projects/${projectId}`)
    return response.data
  } catch (error: any) {
    console.error('Failed to get project:', error)
    throw new Error(`Failed to get project: ${error.response?.data?.message || error.message}`)
  }
}

export const getProjects = async (): Promise<BookProject[]> => {
  if (USE_MOCK_API) {
    return mockApi.getProjects()
  }
  
  try {
    const response = await api.get('/api/projects')
    return response.data
  } catch (error: any) {
    console.error('Failed to get projects:', error)
    throw new Error(`Failed to get projects: ${error.response?.data?.message || error.message}`)
  }
}

export const downloadBook = async (projectId: string, format: string): Promise<Blob> => {
  if (USE_MOCK_API) {
    return mockApi.downloadBook(projectId, format)
  }
  
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
  if (USE_MOCK_API) {
    return mockApi.deleteProject(projectId)
  }
  
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
  if (USE_MOCK_API) {
    return mockApi.generateCover(projectId, options)
  }
  
  try {
    const response = await api.post(`/api/projects/${projectId}/generate-cover`, options)
    return response.data
  } catch (error: any) {
    console.error('Failed to generate cover:', error)
    throw new Error(`Failed to generate cover: ${error.response?.data?.message || error.message}`)
  }
}

export const getCover = async (projectId: string): Promise<string> => {
  if (USE_MOCK_API) {
    return mockApi.getCover(projectId)
  }
  
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
