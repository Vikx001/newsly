import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wrench } from 'lucide-react'

const UnderConstruction = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <Wrench size={64} className="mx-auto text-blue-600 dark:text-blue-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something Cool is Under Construction
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            We're working hard to bring you this feature. Stay tuned!
          </p>
        </div>
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>
    </div>
  )
}

export default UnderConstruction
