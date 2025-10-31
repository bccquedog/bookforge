import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { LandingPage } from './pages/LandingPage'
import { WizardPage } from './pages/WizardPage'
import { SettingsPage } from './pages/SettingsPage'
import { DashboardPage } from './pages/DashboardPage'
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext'
import { OnboardingTour } from './components/OnboardingTour'

function AppContent() {
  const { isOnboardingActive, completeOnboarding, skipOnboarding } = useOnboarding()

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
      
      <OnboardingTour
        isOpen={isOnboardingActive}
        onClose={skipOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <OnboardingProvider>
        <AppContent />
      </OnboardingProvider>
    </BrowserRouter>
  )
}

export default App

