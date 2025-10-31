export interface BookSuggestions {
  title: string[]
  subtitle?: string[]
  author?: string
  trimSize: string
  trimSizeReason: string
  estimatedPages: number
  estimatedWordCount: number
  manuscriptReview?: ManuscriptReview
}

export interface ManuscriptReview {
  overallScore: number
  strengths: string[]
  improvementAreas: string[]
  contentAnalysis: {
    genreGuess: string
    readingLevel: string
    pacing: string
    structure: string
  }
  statistics: {
    avgSentenceLength: number
    avgParagraphLength: number
    dialoguePercentage: number
    actionPercentage: number
  }
  recommendations: {
    title: string
    description: string
    type: 'info' | 'warning' | 'suggestion'
  }[]
}

// Analyze manuscript content and generate suggestions
export const generateBookSuggestions = async (file: File, content: string): Promise<BookSuggestions> => {
  // Basic content analysis
  const words = content.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const estimatedPages = Math.ceil(wordCount / 250) // Rough estimate: 250 words per page
  const lines = content.split('\n').filter(l => l.trim().length > 0)
  
  // Extract potential title from first line or filename
  const filename = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
  const firstLine = lines[0]?.trim() || ''
  const secondLine = lines[1]?.trim() || ''
  
  // Generate title suggestions
  const titleSuggestions: string[] = []
  
  // Suggestion 1: Filename-based
  if (filename.length > 3 && filename.length < 60) {
    titleSuggestions.push(
      filename.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    )
  }
  
  // Suggestion 2: First line if it looks like a title
  if (firstLine.length > 5 && firstLine.length < 80 && !firstLine.includes('Chapter') && !firstLine.includes('Copyright')) {
    titleSuggestions.push(firstLine)
  }
  
  // Suggestion 3: Extract key phrases from content
  const contentWords = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const wordFreq: Record<string, number> = {}
  contentWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  
  const commonWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
  
  if (commonWords.length >= 2) {
    titleSuggestions.push(`${commonWords[0]} ${commonWords[1]}`)
  }
  
  // Suggestion 4: If we have a subtitle-like second line
  if (secondLine.length > 5 && secondLine.length < 100 && secondLine !== firstLine) {
    titleSuggestions.push(`${firstLine}: ${secondLine}`)
  }
  
  // Remove duplicates and limit to 3 suggestions
  const uniqueTitles = Array.from(new Set(titleSuggestions)).slice(0, 3)
  
  // Generate subtitle suggestions
  const subtitleSuggestions: string[] = []
  if (secondLine.length > 10 && secondLine.length < 100 && secondLine !== firstLine) {
    subtitleSuggestions.push(secondLine)
  }
  
  // Determine trim size based on estimated pages
  let recommendedTrim: string
  let trimReason: string
  
  if (estimatedPages < 100) {
    recommendedTrim = '5x8'
    trimReason = 'Ideal for shorter books (under 100 pages)'
  } else if (estimatedPages < 250) {
    recommendedTrim = '5.5x8.5'
    trimReason = 'Great for medium-length books (100-250 pages)'
  } else if (estimatedPages < 400) {
    recommendedTrim = '6x9'
    trimReason = 'Perfect for standard novels (250-400 pages)'
  } else {
    recommendedTrim = '6x9'
    trimReason = 'Standard size for longer works (400+ pages)'
  }
  
  // Detect if it might be a workbook or non-fiction based on content patterns
  const hasNumbers = /\d+/.test(content)
  const hasChapterNumbers = /chapter\s+\d+/i.test(content)
  const hasExercises = /exercise|question|problem|worksheet/i.test(content)
  
  if (hasExercises || (hasNumbers && !hasChapterNumbers && estimatedPages > 200)) {
    recommendedTrim = '8.5x11'
    trimReason = 'Recommended for workbooks and educational materials'
  }
  
  // Generate detailed manuscript review
  const manuscriptReview = analyzeManuscript(content, wordCount)
  
  return {
    title: uniqueTitles.length > 0 ? uniqueTitles : [filename || 'Untitled Book'],
    subtitle: subtitleSuggestions.length > 0 ? subtitleSuggestions : undefined,
    trimSize: recommendedTrim,
    trimSizeReason: trimReason,
    estimatedPages,
    estimatedWordCount: wordCount,
    manuscriptReview
  }
}

// Detailed manuscript analysis function
function analyzeManuscript(content: string, wordCount: number): ManuscriptReview {
  const sentences = content.match(/[.!?]+/g) || []
  const paragraphs = content.split(/\n\s*\n/)
  
  // Calculate statistics
  const avgSentenceLength = wordCount / (sentences.length || 1)
  const avgParagraphLength = paragraphs.length > 0 ? wordCount / paragraphs.length : 0
  
  // Detect dialogue
  const dialoguePattern = /"[^"]*"/g
  const dialogueMatches = content.match(dialoguePattern) || []
  const dialogueWords = dialogueMatches.join(' ').split(/\s+/).filter(w => w.length > 0).length
  const dialoguePercentage = (dialogueWords / wordCount) * 100
  
  // Detect action verbs
  const actionVerbs = /(ran|jumped|fell|struck|hit|moved|grabbed|threw|pushed|pulled|fought|struck|attacked|defended)/gi
  const actionMatches = content.match(actionVerbs) || []
  const actionPercentage = (actionMatches.length / wordCount) * 100
  
  // Genre detection
  const genreGuess = detectGenre(content)
  
  // Reading level (simple Flesch-like approximation)
  const readingLevel = calculateReadingLevel(avgSentenceLength, dialoguePercentage)
  
  // Pacing analysis
  const pacing = analyzePacing(content)
  
  // Structure analysis
  const structure = analyzeStructure(content)
  
  // Generate strengths
  const strengths = generateStrengths(wordCount, avgSentenceLength, dialoguePercentage, paragraphs.length)
  
  // Generate improvement areas
  const improvementAreas = generateImprovementAreas(avgSentenceLength, dialoguePercentage, actionPercentage, paragraphs.length)
  
  // Generate specific recommendations
  const recommendations = generateRecommendations(wordCount, avgSentenceLength, dialoguePercentage, actionPercentage, paragraphs.length, pacing)
  
  // Calculate overall score
  let score = 70 // Base score
  if (wordCount > 50000 && wordCount < 100000) score += 10 // Good length
  if (avgSentenceLength > 12 && avgSentenceLength < 20) score += 5 // Good sentence length
  if (dialoguePercentage > 15 && dialoguePercentage < 40) score += 10 // Good dialogue balance
  if (paragraphs.length > 20) score += 5 // Good structure
  
  return {
    overallScore: Math.min(100, score),
    strengths,
    improvementAreas,
    contentAnalysis: {
      genreGuess,
      readingLevel,
      pacing,
      structure
    },
    statistics: {
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgParagraphLength: Math.round(avgParagraphLength),
      dialoguePercentage: Math.round(dialoguePercentage * 10) / 10,
      actionPercentage: Math.round(actionPercentage * 100) / 100
    },
    recommendations
  }
}

function detectGenre(content: string): string {
  const lowerContent = content.toLowerCase()
  
  if (/mystery|detective|murder|crime|investigation|cop/.test(lowerContent)) {
    return 'Mystery/Thriller'
  }
  if (/love|romance|kiss|heart|passion|soulmate/.test(lowerContent)) {
    return 'Romance'
  }
  if (/magic|wizard|witch|spell|fantasy|dragon|castle/.test(lowerContent)) {
    return 'Fantasy'
  }
  if (/space|alien|planet|starship|future|technology|robot/.test(lowerContent)) {
    return 'Science Fiction'
  }
  if (/exercise|worksheet|chapter\s+\d+|question|problem|answer/.test(lowerContent)) {
    return 'Educational/Workbook'
  }
  if (/how to|guide|tutorial|steps|instructions/.test(lowerContent)) {
    return 'How-To/Guide'
  }
  if (/memoir|biography|autobiography|i remember|my life/.test(lowerContent)) {
    return 'Memoir/Biography'
  }
  
  return 'Fiction'
}

function calculateReadingLevel(avgSentenceLength: number, dialoguePercentage: number): string {
  if (avgSentenceLength < 10 && dialoguePercentage > 30) {
    return 'Middle Grade (8-12 years)'
  }
  if (avgSentenceLength < 15) {
    return 'Young Adult (12-18 years)'
  }
  if (avgSentenceLength < 20) {
    return 'Adult'
  }
  return 'Advanced/Literary'
}

function analyzePacing(content: string): string {
  const shortParagraphs = content.split(/\n\s*\n/).filter(p => p.trim().split(/\s+/).length < 50).length
  const totalParagraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  const shortParaPercentage = (shortParagraphs / totalParagraphs) * 100
  
  if (shortParaPercentage > 60) {
    return 'Fast-paced (lots of short paragraphs)'
  }
  if (shortParaPercentage < 20) {
    return 'Contemplative (longer paragraphs, more description)'
  }
  return 'Balanced (good mix of pacing)'
}

function analyzeStructure(content: string): string {
  const chapterCount = (content.match(/chapter\s+\d+/gi) || []).length
  const sections = content.split(/\n\s*\n/).filter(p => p.trim().length > 100).length
  
  if (chapterCount > 5) {
    return `Well-structured with ${chapterCount} chapters`
  }
  if (sections > 20) {
    return 'Good paragraph structure'
  }
  if (sections < 5) {
    return 'Consider adding more structure (chapters, scenes)'
  }
  return 'Basic structure detected'
}

function generateStrengths(wordCount: number, avgSentenceLength: number, dialoguePercentage: number, paragraphCount: number): string[] {
  const strengths: string[] = []
  
  if (wordCount > 50000) {
    strengths.push('Substantial word count - good length for a novel')
  } else if (wordCount > 25000) {
    strengths.push('Good length for a novella or short novel')
  }
  
  if (avgSentenceLength > 12 && avgSentenceLength < 20) {
    strengths.push('Excellent sentence length variety')
  }
  
  if (dialoguePercentage > 15 && dialoguePercentage < 40) {
    strengths.push('Good balance of dialogue and narrative')
  }
  
  if (paragraphCount > 30) {
    strengths.push('Good paragraph structure and flow')
  }
  
  if (wordCount > 1000 && strengths.length === 0) {
    strengths.push('Strong start - keep writing!')
  }
  
  return strengths.length > 0 ? strengths : ['Manuscript uploaded successfully']
}

function generateImprovementAreas(avgSentenceLength: number, dialoguePercentage: number, actionPercentage: number, paragraphCount: number): string[] {
  const improvements: string[] = []
  
  if (avgSentenceLength < 8) {
    improvements.push('Consider varying sentence length - some sentences are quite short')
  }
  
  if (avgSentenceLength > 25) {
    improvements.push('Some sentences are quite long - consider breaking them up for readability')
  }
  
  if (dialoguePercentage < 5) {
    improvements.push('Low dialogue percentage - consider adding more character interactions')
  }
  
  if (dialoguePercentage > 50) {
    improvements.push('High dialogue percentage - consider balancing with more narrative')
  }
  
  if (paragraphCount < 10) {
    improvements.push('Consider breaking content into more paragraphs for better flow')
  }
  
  return improvements
}

function generateRecommendations(
  wordCount: number, 
  avgSentenceLength: number, 
  dialoguePercentage: number, 
  actionPercentage: number,
  paragraphCount: number,
  pacing: string
): { title: string; description: string; type: 'info' | 'warning' | 'suggestion' }[] {
  const recommendations: { title: string; description: string; type: 'info' | 'warning' | 'suggestion' }[] = []
  
  if (wordCount < 40000) {
    recommendations.push({
      title: 'Word Count',
      description: `Your manuscript is ${wordCount.toLocaleString()} words. Consider aiming for 50,000-80,000 for a novel.`,
      type: 'suggestion'
    })
  }
  
  if (avgSentenceLength > 25) {
    recommendations.push({
      title: 'Sentence Length',
      description: 'Some sentences are very long. Consider breaking them up for better readability.',
      type: 'suggestion'
    })
  }
  
  if (dialoguePercentage < 10) {
    recommendations.push({
      title: 'Add More Dialogue',
      description: 'Consider adding more dialogue to bring characters to life and increase engagement.',
      type: 'suggestion'
    })
  }
  
  if (paragraphCount < 20 && wordCount > 10000) {
    recommendations.push({
      title: 'Paragraph Structure',
      description: 'Breaking your content into more paragraphs will improve readability and flow.',
      type: 'suggestion'
    })
  }
  
  if (pacing.includes('Fast-paced')) {
    recommendations.push({
      title: 'Pacing',
      description: 'Your writing has fast-paced energy. Consider adding descriptive passages to vary the tempo.',
      type: 'info'
    })
  }
  
  if (pacing.includes('Contemplative')) {
    recommendations.push({
      title: 'Pacing',
      description: 'Your writing is contemplative and descriptive. Consider adding action scenes to vary the pace.',
      type: 'info'
    })
  }
  
  return recommendations
}

