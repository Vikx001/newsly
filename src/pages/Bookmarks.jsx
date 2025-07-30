import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useBookmarks } from '../contexts/BookmarkContext'
import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

function Bookmarks() {
  const { bookmarks, removeBookmark } = useBookmarks()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleReadMore = async (article) => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: article.url,
          windowName: '_blank',
          toolbarColor: '#1f2937',
          presentationStyle: 'popover'
        })
      } else {
        window.open(article.url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error opening URL:', error)
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] dark:border-b-gray-700 px-10 py-3 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4 text-[#111418] dark:text-white">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 
            className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] cursor-pointer"
            onClick={() => navigate('/')}
          >
            Newsly
          </h2>
        </div>
        <button 
          onClick={toggleTheme}
          className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] dark:bg-gray-700 text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Bookmarks</h1>
        
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No bookmarks yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Start bookmarking articles to see them here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookmarks.map((article, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {article.category || 'News'}
                        </p>
                        {article.description && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReadMore(article)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Read More
                        </button>
                        <button
                          onClick={() => removeBookmark(article)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  {article.urlToImage && (
                    <div className="md:w-64 h-48 md:h-auto">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Bookmarks
