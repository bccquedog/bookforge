import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Shield, 
  Palette, 
  Globe,
  Save,
  Eye,
  EyeOff,
  Play
} from 'lucide-react'
import { useOnboarding } from '../contexts/OnboardingContext'

interface SettingsData {
  profile: {
    name: string
    email: string
    organization: string
  }
  preferences: {
    defaultFormat: string
    autoSave: boolean
    notifications: boolean
    theme: string
  }
  privacy: {
    shareData: boolean
    analytics: boolean
    marketing: boolean
  }
  api: {
    apiKey: string
    endpoint: string
  }
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showApiKey, setShowApiKey] = useState(false)
  const { startOnboarding } = useOnboarding()
  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: 'John Doe',
      email: 'john@example.com',
      organization: 'My Publishing Company'
    },
    preferences: {
      defaultFormat: 'pdf',
      autoSave: true,
      notifications: true,
      theme: 'light'
    },
    privacy: {
      shareData: false,
      analytics: true,
      marketing: false
    },
    api: {
      apiKey: 'sk-1234567890abcdef',
      endpoint: 'https://api.bookforge.com'
    }
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'onboarding', label: 'Help & Tour', icon: Play },
    { id: 'api', label: 'API', icon: Globe },
  ]

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={settings.profile.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, name: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="profile-organization" className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                  <input
                    id="profile-organization"
                    type="text"
                    value={settings.profile.organization}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, organization: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Preferences</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="default-format" className="block text-sm font-medium text-gray-700 mb-2">Default Output Format</label>
                  <select
                    id="default-format"
                    value={settings.preferences.defaultFormat}
                    onChange={(e) => setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, defaultFormat: e.target.value }
                    })}
                    className="input-field"
                  >
                    <option value="pdf">PDF</option>
                    <option value="epub">EPUB</option>
                    <option value="docx">DOCX</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Auto-save projects</h4>
                      <p className="text-sm text-gray-600">Automatically save your work as you go</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.preferences.autoSave}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, autoSave: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email notifications</h4>
                      <p className="text-sm text-gray-600">Get notified when projects are completed</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.preferences.notifications}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, notifications: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Theme</h4>
                      <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
                    </div>
                    <select
                      value={settings.preferences.theme}
                      onChange={(e) => setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, theme: e.target.value }
                      })}
                      className="input-field w-32"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Share anonymous usage data</h4>
                    <p className="text-sm text-gray-600">Help us improve BookForge by sharing anonymous usage statistics</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareData}
                    onChange={(e) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, shareData: e.target.checked }
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-600">Allow analytics to help us understand how you use the app</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.analytics}
                    onChange={(e) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, analytics: e.target.checked }
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Marketing communications</h4>
                    <p className="text-sm text-gray-600">Receive updates about new features and tips</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.marketing}
                    onChange={(e) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, marketing: e.target.checked }
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="relative">
                    <input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.api.apiKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, apiKey: e.target.value }
                      })}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Your API key for accessing BookForge services</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Endpoint</label>
                  <input
                    type="url"
                    value={settings.api.endpoint}
                    onChange={(e) => setSettings({
                      ...settings,
                      api: { ...settings.api, endpoint: e.target.value }
                    })}
                    className="input-field"
                  />
                  <p className="text-sm text-gray-600 mt-1">Base URL for API requests</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">API Documentation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Learn how to integrate BookForge into your workflow using our REST API.
                  </p>
                  <button className="btn-outline text-sm">
                    View Documentation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'onboarding':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Help & Onboarding</h3>
              
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-blue-900 mb-2">Welcome Tour</h4>
                  <p className="text-blue-700 mb-4">
                    Take a guided tour of BookForge to learn about all the features and how to get started.
                  </p>
                  <button
                    onClick={startOnboarding}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Tour</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Getting Started</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary-600 font-semibold text-xs">1</span>
                      </div>
                      <div>
                        <strong>Upload your manuscript</strong> - Use the Book Wizard to upload your .docx, .md, or .txt file
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary-600 font-semibold text-xs">2</span>
                      </div>
                      <div>
                        <strong>Configure formatting</strong> - Set your book details, trim size, fonts, and other options
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary-600 font-semibold text-xs">3</span>
                      </div>
                      <div>
                        <strong>Generate and download</strong> - Create your book in PDF, EPUB, and DOCX formats
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Need Help?</h4>
                  <p className="text-gray-600 mb-4">
                    If you have questions or need assistance, here are some helpful resources:
                  </p>
                  <div className="space-y-2">
                    <button className="text-left w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                      <div className="font-medium text-gray-900">Documentation</div>
                      <div className="text-sm text-gray-600">Complete guide to using BookForge</div>
                    </button>
                    <button className="text-left w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                      <div className="font-medium text-gray-900">FAQ</div>
                      <div className="text-sm text-gray-600">Frequently asked questions</div>
                    </button>
                    <button className="text-left w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                      <div className="font-medium text-gray-900">Contact Support</div>
                      <div className="text-sm text-gray-600">Get help from our support team</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            {renderTabContent()}

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

