import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, RotateCcw } from 'lucide-react'
import { setStoredGenres } from '../utils/storage'

const SettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleResetGenres = () => {
    setStoredGenres([])
    navigate('/genres')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleResetGenres}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={20} />
            Reset Genre Preferences
          </button>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2">About Newsly</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ultra-short news stories delivered in 60 words or less. 
              Built with React and powered by NewsAPI.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal