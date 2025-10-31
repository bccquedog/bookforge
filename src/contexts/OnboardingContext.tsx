import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OnboardingContextType {
  hasCompletedOnboarding: boolean
  isOnboardingActive: boolean
  startOnboarding: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

interface OnboardingProviderProps {
  children: ReactNode
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isOnboardingActive, setIsOnboardingActive] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding before
    const completed = localStorage.getItem('bookforge-onboarding-completed')
    setHasCompletedOnboarding(completed === 'true')
    
    // Show onboarding for new users
    if (completed !== 'true') {
      setIsOnboardingActive(true)
    }
  }, [])

  const startOnboarding = () => {
    setIsOnboardingActive(true)
  }

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true)
    setIsOnboardingActive(false)
    localStorage.setItem('bookforge-onboarding-completed', 'true')
  }

  const skipOnboarding = () => {
    setHasCompletedOnboarding(true)
    setIsOnboardingActive(false)
    localStorage.setItem('bookforge-onboarding-completed', 'true')
  }

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isOnboardingActive,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}


