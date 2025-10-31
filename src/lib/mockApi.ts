// Mock API for demonstration when backend is not available
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
  cover_path?: string
  cover_url?: string
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

// Mock storage
let projects: BookProject[] = []
let nextId = 1

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createProject = async (config: Partial<BookConfig>): Promise<BookProject> => {
  await delay(500)
  
  const project: BookProject = {
    id: `project_${nextId++}`,
    title: config.title || 'Untitled Book',
    author: config.author || '',
    status: 'created',
    created_at: new Date().toISOString(),
    formats: []
  }
  
  projects.push(project)
  return project
}

// Helper function to extract content from different file types
const extractContentFromFile = async (file: File): Promise<string> => {
  const fileName = file.name.toLowerCase()
  const fileType = file.type
  
  // For text-based files, use text() method
  if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.text') || fileName.endsWith('.md')) {
    return await file.text()
  }
  
  // For HTML files, extract text content
  if (fileType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    const htmlContent = await file.text()
    // Simple HTML to text conversion (remove tags)
    return htmlContent
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  // For binary formats, simulate content extraction
  if (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return `[DOCX Content from ${file.name}]

Chapter 1: The Beginning

This is a simulated extraction from a Microsoft Word document. In a real implementation, this would use a library like mammoth.js or python-docx to extract the actual text content from the .docx file.

The content would include all the text, formatting, and structure from the original document, properly converted to plain text for processing.

Chapter 2: The Middle

This demonstrates how different file types would be handled. Each format would have its own extraction method:

- .docx files would use XML parsing
- .doc files would use different libraries
- .odt files would use OpenDocument parsing
- .rtf files would use RTF parsing

Chapter 3: The End

This is the end of the simulated content extraction. The actual implementation would preserve the document structure, headings, paragraphs, and other formatting elements.`
  }
  
  if (fileName.endsWith('.doc') || fileType === 'application/msword') {
    return `[DOC Content from ${file.name}]

This is a simulated extraction from a legacy Microsoft Word document (.doc format). 

In a real implementation, this would use specialized libraries to handle the older binary format of .doc files.

The content would be properly extracted and converted to plain text while preserving the document structure.`
  }
  
  if (fileName.endsWith('.odt') || fileType === 'application/vnd.oasis.opendocument.text') {
    return `[ODT Content from ${file.name}]

This is a simulated extraction from an OpenDocument Text file (.odt format).

OpenDocument files are actually ZIP archives containing XML files, so the extraction would involve:
1. Unzipping the file
2. Parsing the content.xml file
3. Extracting text while preserving formatting

This format is used by LibreOffice, OpenOffice, and other open-source office suites.`
  }
  
  if (fileName.endsWith('.rtf') || fileType === 'application/rtf' || fileType === 'text/rtf') {
    return `[RTF Content from ${file.name}]

This is a simulated extraction from a Rich Text Format file (.rtf).

RTF files contain formatting codes mixed with text, so extraction would involve:
1. Parsing the RTF markup
2. Converting formatting codes to plain text
3. Preserving the document structure

RTF is a cross-platform format that can be opened by most word processors.`
  }
  
  // Fallback for unknown formats
  return `[Content from ${file.name}]

This is a simulated content extraction. The actual implementation would use appropriate libraries to extract text from the specific file format.

File type: ${fileType}
File size: ${(file.size / 1024 / 1024).toFixed(2)} MB

In a production environment, this would be replaced with proper content extraction libraries for each supported format.`
}

export const uploadManuscript = async (projectId: string, file: File): Promise<void> => {
  await delay(1000)
  
  const project = projects.find(p => p.id === projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  // Extract content based on file type
  const content = await extractContentFromFile(file)
  project.manuscript_content = content
  project.status = 'uploaded'
  project.manuscript_path = file.name
  
  console.log(`Extracted content from ${file.name} (${file.type}):`, content.substring(0, 200) + '...')
}

export const buildBook = async (projectId: string): Promise<{ formats: string[] }> => {
  await delay(3000) // Simulate processing time
  
  const project = projects.find(p => p.id === projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  project.status = 'completed'
  project.formats = ['pdf', 'epub', 'docx']
  project.output_paths = {
    pdf: `/outputs/${project.title}.pdf`,
    epub: `/outputs/${project.title}.epub`,
    docx: `/outputs/${project.title}.docx`
  }
  
  return { formats: project.formats }
}

export const getProject = async (projectId: string): Promise<BookProject> => {
  await delay(200)
  
  const project = projects.find(p => p.id === projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  return project
}

export const getProjects = async (): Promise<BookProject[]> => {
  await delay(200)
  return [...projects]
}

export const downloadBook = async (projectId: string, format: string): Promise<Blob> => {
  await delay(500)
  
  const project = projects.find(p => p.id === projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  // Create a proper mock file blob with appropriate MIME types
  let content: string
  let mimeType: string
  
  switch (format.toLowerCase()) {
    case 'pdf':
      // Extract and format the manuscript content
      const manuscriptContent = project.manuscript_content || 'No manuscript content available'
      const formattedContent = manuscriptContent
        .replace(/[\(\)\\]/g, '\\$&') // Escape PDF special characters
        .replace(/\n\s*\n/g, '\\n\\n') // Preserve paragraph breaks
        .substring(0, 2000) // Increased content length for demo
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\\n')
      
      // Create a simple PDF-like content with the actual manuscript
      content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${50 + formattedContent.length}
>>
stream
BT
/F1 12 Tf
100 700 Td
(${project.title} by ${project.author}) Tj
0 -30 Td
/F1 10 Tf
(${formattedContent}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${395 + formattedContent.length}
%%EOF`
      mimeType = 'application/pdf'
      break
    case 'epub':
      const epubContent = project.manuscript_content || 'No manuscript content available'
      const htmlContent = epubContent
        .replace(/\n\n/g, '</p><p>') // Convert double newlines to paragraph breaks
        .replace(/\n/g, '<br/>') // Convert single newlines to line breaks
        .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Escape HTML
      
      content = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${project.title}</dc:title>
    <dc:creator opf:file-as="${project.author}" opf:role="aut">${project.author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId" opf:scheme="UUID">urn:uuid:12345678-1234-1234-1234-123456789012</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="html" href="content.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="html"/>
  </spine>
</package>

<!-- Content.html -->
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${project.title}</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 2em; }
    h1 { color: #333; border-bottom: 2px solid #ccc; }
    h2 { color: #666; margin-top: 2em; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  <h2>by ${project.author}</h2>
  <div>
    <p>${htmlContent}</p>
  </div>
</body>
</html>`
      mimeType = 'application/epub+zip'
      break
    case 'docx':
      const docxContent = project.manuscript_content || 'No manuscript content available'
      content = `DOCX Content for "${project.title}" by ${project.author}

${docxContent}

---
Generated by BookForge
This is a demonstration file showing the content that would be generated.`
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      break
    default:
      content = `Mock ${format.toUpperCase()} file for "${project.title}" by ${project.author}`
      mimeType = `application/${format}`
  }
  
  return new Blob([content], { type: mimeType })
}

export const deleteProject = async (projectId: string): Promise<void> => {
  await delay(200)
  
  const index = projects.findIndex(p => p.id === projectId)
  if (index === -1) {
    throw new Error('Project not found')
  }
  
  projects.splice(index, 1)
}

export const generateCover = async (
  projectId: string,
  options: { style: string; description: string; theme?: string }
): Promise<{ message: string; cover_url: string; cover_path: string }> => {
  await delay(3000) // Simulate generation time
  
  const project = projects.find(p => p.id === projectId)
  if (!project) {
    throw new Error('Project not found')
  }
  
  // Create a mock cover image as a data URL (simple colored square with text)
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // Generate a gradient background based on style
    const gradients = {
      modern: ['#667eea', '#764ba2'],
      classic: ['#f093fb', '#f5576c'],
      fantasy: ['#fa709a', '#fee140'],
      mystery: ['#2c3e50', '#34495e'],
      romance: ['#ff9a9e', '#fecfef'],
      'sci-fi': ['#00c9ff', '#92fe9d'],
      'non-fiction': ['#4facfe', '#00f2fe']
    }
    
    const gradient = gradients[options.style as keyof typeof gradients] || gradients.modern
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grd.addColorStop(0, gradient[0])
    grd.addColorStop(1, gradient[1])
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add title
    ctx.fillStyle = 'white'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(project.title, canvas.width / 2, canvas.height / 2 - 50)
    
    // Add author
    ctx.font = '32px Arial'
    ctx.fillText(`by ${project.author}`, canvas.width / 2, canvas.height / 2 + 50)
  }
  
  const coverUrl = canvas.toDataURL('image/png')
  
  project.cover_url = coverUrl
  project.cover_path = `/covers/${projectId}.png`
  
  return {
    message: 'Cover generated successfully',
    cover_url: coverUrl,
    cover_path: `/covers/${projectId}.png`
  }
}

export const getCover = async (projectId: string): Promise<string> => {
  await delay(200)
  
  const project = projects.find(p => p.id === projectId)
  if (!project || !project.cover_url) {
    throw new Error('Cover not found')
  }
  
  return project.cover_url
}

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
