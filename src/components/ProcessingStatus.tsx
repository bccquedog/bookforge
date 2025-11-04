import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Circle } from 'lucide-react'

interface ProcessingStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
}

interface ProcessingStatusProps {
  steps: ProcessingStep[]
  currentStep?: string
  message?: string
}

export function ProcessingStatus({ steps, currentStep, message }: ProcessingStatusProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-4">
        {/* Main status message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600 font-medium">{message}</p>
          </motion.div>
        )}

        {/* Step indicators */}
        <div className="space-y-3">
          <AnimatePresence>
            {steps.map((step, index) => {
              const isActive = step.id === currentStep || step.status === 'processing'
              const isCompleted = step.status === 'completed'
              const isPending = step.status === 'pending'

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-5 h-5 text-primary-600" />
                      </motion.div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <motion.p
                      className={`text-sm font-medium ${
                        isActive
                          ? 'text-gray-900'
                          : isCompleted
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                      animate={isActive ? { opacity: [0.7, 1, 0.7] } : {}}
                      transition={
                        isActive
                          ? {
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }
                          : {}
                      }
                    >
                      {step.label}
                    </motion.p>
                    {step.message && isActive && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-gray-500 mt-1"
                      >
                        {step.message}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{
                width: `${(steps.filter((s) => s.status === 'completed').length / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
