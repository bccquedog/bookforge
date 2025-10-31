import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  FileText, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Users,
  Award,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: FileText,
    title: 'Multiple Formats',
    description: 'Generate PDF, EPUB, and DOCX outputs from your manuscript'
  },
  {
    icon: Zap,
    title: 'Interactive Wizard',
    description: 'Guided setup process that asks the right questions for professional results'
  },
  {
    icon: CheckCircle,
    title: 'Print-Ready',
    description: 'Professional layout with proper margins, fonts, and page rules'
  },
  {
    icon: Users,
    title: 'Industry Standards',
    description: 'KDP and Ingram presets with proper trim sizes and margins'
  },
  {
    icon: Award,
    title: 'Professional Quality',
    description: 'Running heads, widows/orphans control, and proper typography'
  },
  {
    icon: Clock,
    title: 'Fast Processing',
    description: 'Quick conversion from manuscript to publication-ready formats'
  }
]

const stats = [
  { label: 'Books Formatted', value: '10,000+' },
  { label: 'Happy Authors', value: '5,000+' },
  { label: 'Formats Supported', value: '3' },
  { label: 'Platforms', value: 'All' }
]

export function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              Transform Your Manuscript Into
              <span className="block text-yellow-300">Professional Books</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto"
            >
              BookForge is the ultimate cross-platform book formatting tool that transforms your manuscript 
              into print-ready PDFs, EPUB, and DOCX formats with professional layout and typography.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link 
                to="/wizard" 
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Start Book Wizard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/dashboard" 
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>View Dashboard</span>
                <BookOpen className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Professional Book Publishing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              BookForge handles all the technical aspects of book formatting so you can focus on your content.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Format Your Book?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of authors who trust BookForge to create professional, publication-ready books.
          </p>
          <Link 
            to="/wizard" 
            className="bg-white hover:bg-gray-100 text-primary-600 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
