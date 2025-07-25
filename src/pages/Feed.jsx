import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Settings, ChevronDown, Sun, Moon, Bookmark } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import NewsCard from '../components/NewsCard'
import { fetchNews } from '../utils/api'
import { getStoredGenres } from '../utils/storage'

const Feed = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Add speech synthesis state management
  const [currentSpeech, setCurrentSpeech] = useState(null)

  const loadNews = async (isRefresh = false) => {
    const genres = getStoredGenres()
    
    if (genres.length === 0) {
      navigate('/genres')
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      
      setError(null)
      const data = await fetchNews(genres)
      setArticles(data.articles || [])
      
      // Only reset to first article on initial load, not on refresh
      if (!isRefresh) {
        setCurrentIndex(0)
      } else {
        // On refresh, keep current position or reset if out of bounds
        setCurrentIndex(prev => {
          const newLength = data.articles?.length || 0
          return prev >= newLength ? Math.max(0, newLength - 1) : prev
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadNews()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        handlePrevious()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, articles.length])

  const handleNext = () => {
    console.log('handleNext called, currentIndex:', currentIndex, 'articles.length:', articles.length)
    if (currentIndex < articles.length - 1 && !isTransitioning) {
      console.log('Moving to next article:', currentIndex + 1)
      setIsTransitioning(true)
      setCurrentIndex(prev => {
        console.log('Setting index from', prev, 'to', prev + 1)
        return prev + 1
      })
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handlePrevious = () => {
    console.log('handlePrevious called, currentIndex:', currentIndex)
    if (currentIndex > 0 && !isTransitioning) {
      console.log('Moving to previous article:', currentIndex - 1)
      setIsTransitioning(true)
      setCurrentIndex(prev => {
        console.log('Setting index from', prev, 'to', prev - 1)
        return prev - 1
      })
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleRefresh = () => {
    loadNews(true)
  }

  // Stop any ongoing speech when navigating between articles
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [currentIndex])

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Add keyboard shortcut for speech
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault()
        // Trigger speech for current article
        const currentArticle = articles[currentIndex]
        if (currentArticle) {
          handleReadAloud(currentArticle)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [articles, currentIndex])

  const handleReadAloud = (article) => {
    if (!window.speechSynthesis) return
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    } else {
      const textToRead = `${article.title}. ${article.description}`
      const utterance = new SpeechSynthesisUtterance(textToRead)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Loading your personalized news...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => loadNews()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No articles found for your selected categories.</p>
          <button onClick={handleRefresh} className="btn-primary">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden" style={{fontFamily: 'Newsreader, "Noto Sans", sans-serif'}}>
      {/* Landing Page Style Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3 bg-white relative z-30">
        <div className="flex items-center gap-4 text-[#111418]">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Newsly</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/bookmarks')}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            <Bookmark size={20} />
          </button>
          <button
            onClick={toggleTheme}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Card Container with Transition */}
      <div className="h-full pt-4 pb-4 px-4 flex items-center justify-center relative z-10">
        <div className="w-full max-w-2xl h-full flex flex-col">
          <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
            <NewsCard 
              key={`article-${currentIndex}`}
              article={articles[currentIndex]}
              onBookmarkChange={() => {}}
              onNext={handleNext}
              onPrevious={handlePrevious}
              showNavigation={true}
              isFirst={currentIndex === 0}
              isLast={currentIndex === articles.length - 1}
            />
          </div>
        </div>
      </div>

      {/* Scroll Hint */}
      {currentIndex < articles.length - 1 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex flex-col items-center text-gray-400 dark:text-gray-500 animate-bounce">
            <ChevronDown size={20} />
            <span className="text-xs mt-1">Swipe up</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed
