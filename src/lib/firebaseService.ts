import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { db, storage } from './firebase'
import type { BookProject, BookConfig } from './api'

const PROJECTS_COLLECTION = 'projects'
const MANUSCRIPTS_FOLDER = 'manuscripts'
const OUTPUTS_FOLDER = 'outputs'

// Firestore operations
export const createProjectInFirestore = async (config: Partial<BookConfig>): Promise<BookProject> => {
  const projectId = crypto.randomUUID()

  const project: BookProject = {
    id: projectId,
    title: config.title || 'Untitled Book',
    author: config.author || '',
    status: 'created',
    created_at: new Date().toISOString(),
    formats: [],
  }

  await setDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    ...project,
    config: config,
    createdAt: Timestamp.now(),
  })

  return project
}

export const getProjectFromFirestore = async (projectId: string): Promise<BookProject> => {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Project not found')
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    title: data.title,
    author: data.author,
    status: data.status,
    created_at: data.created_at,
    formats: data.formats || [],
    manuscript_path: data.manuscript_path,
    output_paths: data.output_paths,
    page_count: data.page_count,
  }
}

export const getProjectsFromFirestore = async (): Promise<BookProject[]> => {
  const q = query(collection(db, PROJECTS_COLLECTION), orderBy('createdAt', 'desc'))
  const querySnapshot = await getDocs(q)

  return querySnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.title,
      author: data.author,
      status: data.status,
      created_at: data.created_at,
      formats: data.formats || [],
      manuscript_path: data.manuscript_path,
      output_paths: data.output_paths,
      page_count: data.page_count,
    }
  })
}

export const updateProjectInFirestore = async (
  projectId: string,
  updates: Partial<BookProject>
): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId)
  await updateDoc(docRef, updates)
}

export const deleteProjectFromFirestore = async (projectId: string): Promise<void> => {
  // Delete project document
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId))

  // TODO: Also delete associated files from Storage
  // This would require keeping track of all uploaded files
}

// Firebase Storage operations
export const uploadManuscriptToStorage = async (
  projectId: string,
  file: File
): Promise<string> => {
  const timestamp = Date.now()
  const fileName = `${timestamp}_${file.name}`
  const storageRef = ref(storage, `${MANUSCRIPTS_FOLDER}/${projectId}/${fileName}`)

  await uploadBytes(storageRef, file)
  const downloadURL = await getDownloadURL(storageRef)

  // For text files, store content in Firestore for preview
  // Limit to 500,000 characters to stay within Firestore limits
  let manuscriptContent = ''
  let contentPreview = ''

  if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    try {
      const fullContent = await file.text()

      // If content is within limit, store it all
      if (fullContent.length <= 500000) {
        manuscriptContent = fullContent
        contentPreview = fullContent.slice(0, 5000) // Store preview separately
      } else {
        // If too large, only store preview
        console.warn(`Manuscript too large (${fullContent.length} chars), storing preview only`)
        contentPreview = fullContent.slice(0, 5000)
      }
    } catch (error) {
      console.warn('Could not extract text content:', error)
    }
  }

  // Calculate word count and estimated pages
  const wordCount = manuscriptContent ? manuscriptContent.split(/\s+/).filter(w => w).length : 0
  const estimatedPages = Math.ceil(wordCount / 250)

  // Update project with manuscript path and content
  await updateProjectInFirestore(projectId, {
    manuscript_path: downloadURL,
    manuscript_content: manuscriptContent,
    manuscript_preview: contentPreview,
    manuscript_filename: file.name,
    manuscript_size: file.size,
    word_count: wordCount,
    page_count: estimatedPages,
    status: 'uploaded',
  })

  return downloadURL
}

export const uploadOutputToStorage = async (
  projectId: string,
  format: string,
  blob: Blob
): Promise<string> => {
  const fileName = `output.${format}`
  const storageRef = ref(storage, `${OUTPUTS_FOLDER}/${projectId}/${fileName}`)

  await uploadBytes(storageRef, blob)
  const downloadURL = await getDownloadURL(storageRef)

  return downloadURL
}

export const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  const storageRef = ref(storage, filePath)
  await deleteObject(storageRef)
}
