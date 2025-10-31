import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, BookOpen, Zap, Settings } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  icon: React.ComponentType<any>
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BookForge!',
    description: 'Transform your manuscript into professional books with our powerful formatting tool. Let\'s take a quick tour to get you started.',
    target: 'nav-logo',
    icon: BookOpen,
    position: 'bottom'
  },
  {
    id: 'wizard',
    title: 'Book Wizard',
    description: 'Start here to create your first book project. The wizard will guide you through uploading your manuscript and configuring the formatting options.',
    target: 'nav-wizard',
    icon: Zap,
    position: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Project Dashboard',
    description: 'Manage all your book projects here. Track progress, download completed books, and organize your publishing workflow.',
    target: 'nav-dashboard',
    icon: BookOpen,
    position: 'bottom'
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    description: 'Customize your experience, manage your account preferences, and configure API settings for advanced users.',
    target: 'nav-settings',
    icon: Settings,
    position: 'bottom'
  }
]

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [forceUpdate, setForceUpdate] = useState(0)

  useEffect(() => {
    if (isOpen) {
      const target = document.querySelector(`[data-tour="${tourSteps[currentStep].target}"]`) as HTMLElement
      setTargetElement(target)
      
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    const handleResize = () => {
      setForceUpdate(prev => prev + 1)
    }

    if (isOpen) {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, forceUpdate])

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const rect = targetElement.getBoundingClientRect()
    const step = tourSteps[currentStep]
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipWidth = 384 // max-w-sm = 384px
    const tooltipHeight = 300 // estimated height
    const padding = 20

    let position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    switch (step.position) {
      case 'top':
        const topY = rect.top - padding
        const topX = rect.left + rect.width / 2
        position = {
          top: `${Math.max(padding, topY - tooltipHeight)}px`,
          left: `${Math.max(padding, Math.min(viewportWidth - tooltipWidth - padding, topX))}px`,
          transform: topY - tooltipHeight < padding ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
        }
        break
      case 'bottom':
        const bottomY = rect.bottom + padding
        const bottomX = rect.left + rect.width / 2
        position = {
          top: `${Math.min(viewportHeight - tooltipHeight - padding, bottomY)}px`,
          left: `${Math.max(padding, Math.min(viewportWidth - tooltipWidth - padding, bottomX))}px`,
          transform: bottomY + tooltipHeight > viewportHeight - padding ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
        }
        break
      case 'left':
        const leftY = rect.top + rect.height / 2
        const leftX = rect.left - padding
        position = {
          top: `${Math.max(padding, Math.min(viewportHeight - tooltipHeight - padding, leftY))}px`,
          left: `${Math.max(padding, leftX - tooltipWidth)}px`,
          transform: leftX - tooltipWidth < padding ? 'translate(0, -50%)' : 'translate(-100%, -50%)'
        }
        break
      case 'right':
        const rightY = rect.top + rect.height / 2
        const rightX = rect.right + padding
        position = {
          top: `${Math.max(padding, Math.min(viewportHeight - tooltipHeight - padding, rightY))}px`,
          left: `${Math.min(viewportWidth - tooltipWidth - padding, rightX)}px`,
          transform: rightX + tooltipWidth > viewportWidth - padding ? 'translate(-100%, -50%)' : 'translate(0, -50%)'
        }
        break
    }

    return position
  }

  if (!isOpen) return null

  const currentStepData = tourSteps[currentStep]

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Spotlight */}
      {targetElement && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
            borderRadius: '8px',
            border: '2px solid #0ea5e9',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed z-50 bg-white rounded-xl shadow-2xl max-w-sm w-80 p-6 mx-4 sm:mx-0"
        style={{
          ...getTooltipPosition(),
          maxHeight: '80vh',
          overflowY: 'auto',
          // Fallback for very small screens
          ...(window.innerWidth < 400 && {
            left: '20px',
            right: '20px',
            width: 'auto',
            transform: 'none'
          })
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <currentStepData.icon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
              <p className="text-sm text-gray-500">
                Step {currentStep + 1} of {tourSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">{currentStepData.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
            
            <button
              onClick={nextStep}
              className="flex items-center space-x-1 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
