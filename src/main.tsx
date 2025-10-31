import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from 'react-hot-toast'

// Suppress third-party SVG viewBox errors from external scripts (osano.js, Railway monitoring, etc.)
const originalError = console.error
console.error = (...args: any[]) => {
  const errorMessage = args.join(' ')
  // Filter out SVG viewBox errors from third-party scripts
  if (
    errorMessage.includes('attribute viewBox: Expected number') &&
    (errorMessage.includes('%') || errorMessage.includes('px'))
  ) {
    // Suppress these specific errors from third-party scripts
    return
  }
  // Allow all other errors through
  originalError.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
      }}
    />
  </React.StrictMode>,
)

