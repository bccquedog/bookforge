import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Settings, Zap, Home } from 'lucide-react'

export function Navigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/wizard', label: 'Book Wizard', icon: Zap },
    { path: '/dashboard', label: 'Dashboard', icon: BookOpen },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" data-tour="nav-logo">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BookForge</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              const tourId = path === '/wizard' ? 'nav-wizard' : 
                           path === '/dashboard' ? 'nav-dashboard' : 
                           path === '/settings' ? 'nav-settings' : ''
              
              return (
                <Link
                  key={path}
                  to={path}
                  data-tour={tourId}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

