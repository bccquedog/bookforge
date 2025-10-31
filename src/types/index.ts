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
  coverStyle?: string
  coverDescription?: string
  coverTheme?: string
}

export interface BookProject {
  id: string
  title: string
  author: string
  status: 'created' | 'uploaded' | 'processing' | 'completed' | 'error'
  createdAt: string
  created_at?: string
  manuscript_path?: string
  manuscript_content?: string
  formats: string[]
  pageCount?: number
  cover_path?: string
  cover_url?: string
}

export interface CoverGenerationOptions {
  style: 'modern' | 'classic' | 'fantasy' | 'mystery' | 'romance' | 'sci-fi' | 'non-fiction'
  description: string
  theme?: string
}

export interface CoverGenerationResponse {
  message: string
  cover_url: string
  cover_path: string
}

export interface TrimPreset {
  width: number
  height: number
  target: string
}

export interface PaperStock {
  kdp: boolean
  ingram: boolean
  pagesPerInch: number
}

