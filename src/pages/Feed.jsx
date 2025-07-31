import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Settings, ChevronDown, Sun, Moon, Bookmark } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import NewsCard from '../components/NewsCard'
import CommentsCard from '../components/CommentsCard'
import { fetchNews } from '../utils/api'
import { getStoredGenres, getStoredCountry, setStoredCountry } from '../utils/storage'
import CountrySelector from '../components/CountrySelector'
import countryList from 'react-select-country-list'

const Feed = () => {
  const countries = useMemo(() => countryList().getData(), [])
  
  const getCountryName = (countryCode) => {
    if (countryCode === 'global') return 'Global'
    const country = countries.find(c => c.value.toLowerCase() === countryCode.toLowerCase())
    return country ? country.label : countryCode.toUpperCase()
  }

  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false) // Change from true to false
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [selectedCountry, setSelectedCountry] = useState(getStoredCountry())
  const selectedGenres = getStoredGenres()
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  // Add debugging
  console.log('🔍 Feed component state:', { 
    selectedGenres, 
    selectedCountry, 
    loading, 
    articlesCount: articles.length 
  })

  const loadNews = async (forceRefresh = false) => {
    console.log('📰 Starting loadNews...', { forceRefresh, selectedGenres, selectedCountry })
    
    // For force refresh, always proceed regardless of loading state
    if (!forceRefresh && loading) {
      console.log('⏸️ Already loading, skipping...')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const genres = selectedGenres?.length > 0 ? selectedGenres : ['technology', 'business']
      console.log('🔍 Loading news with:', { genres, selectedCountry })
      
      console.log('🌐 Calling fetchNews API...')
      const data = await fetchNews(genres, 'auto', selectedCountry)
      console.log('✅ News data received:', data)
      
      if (data && data.articles && data.articles.length > 0) {
        if (forceRefresh) {
          setArticles(data.articles)
          setCurrentIndex(0)
        } else {
          setArticles(prev => [...prev, ...data.articles])
        }
        console.log('📰 Articles set:', data.articles.length)
      } else {
        console.warn('⚠️ No articles in response:', data)
        setError('No articles found for your selected categories')
      }
    } catch (err) {
      console.error('❌ Load news error:', err)
      setError(err.message || 'Failed to load news')
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasInitialLoad) {
      console.log('🚀 Feed mounted, loading news...')
      setHasInitialLoad(true)
      loadNews()
    }
  }, []) // Remove hasInitialLoad dependency to prevent re-runs

  const handleCountryChange = async (countryCode) => {
    console.log('🌍 Country changed to:', countryCode)
    setSelectedCountry(countryCode)
    setStoredCountry(countryCode)
    
    // Show refreshing state immediately
    setRefreshing(true)
    
    // Clear current articles and reset index
    setArticles([])
    setCurrentIndex(0)
    
    try {
      // Force refresh with new country
      await loadNews(true)
    } finally {
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadNews(true).finally(() => setRefreshing(false))
  }

  const handleNext = () => {
    if (currentIndex < articles.length - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentIndex(prev => prev + 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentIndex(prev => prev - 1)
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

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

  const handleShowComments = (article) => {
    setSelectedArticle(article)
    setShowComments(true)
  }

  const handleCloseComments = () => {
    setShowComments(false)
    setSelectedArticle(null)
  }

  // Keyboard handlers
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

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault()
        const currentArticle = articles[currentIndex]
        if (currentArticle) {
          handleReadAloud(currentArticle)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [articles, currentIndex])

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [currentIndex])

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    let timeout
    if (loading) {
      // Only set timeout when actually loading
      timeout = setTimeout(() => {
        console.error('⏰ Loading timeout')
        setLoading(false)
        setError('Loading took too long. Please try again.')
      }, 15000)
    }
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" size={32} />
          <p className="text-gray-600 dark:text-gray-400">Loading your personalized news...</p>
          <p className="text-xs text-gray-500 mt-2">
            Genres: {selectedGenres?.join(', ') || 'None'} | Country: {selectedCountry}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => loadNews(true)} className="btn-primary">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-4 py-3 bg-white relative z-30">
        <div className="flex items-center gap-3 text-[#111418] relative">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Newsly</h2>
          
          {/* Clickable country flag */}
          <button 
            onClick={() => setShowCountrySelector(!showCountrySelector)}
            disabled={refreshing || loading}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors p-1 rounded disabled:opacity-50"
          >
            <span className="text-lg">
              {selectedCountry === 'global' ? '🌍' : 
               selectedCountry.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()))}
            </span>
            <ChevronDown size={12} className={`transition-transform ${showCountrySelector ? 'rotate-180' : ''} ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Floating dropdown - fixed positioning for mobile */}
          {showCountrySelector && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black bg-opacity-20" 
                onClick={() => setShowCountrySelector(false)}
              />
              <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm">
                <CountrySelector
                  selectedCountry={selectedCountry}
                  onCountryChange={(country) => {
                    handleCountryChange(country)
                    setShowCountrySelector(false)
                  }}
                  className="border-0 shadow-none"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/bookmarks')}
            className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-[#f0f2f5] text-[#111418] hover:bg-gray-200 transition-colors"
          >
            <Bookmark size={18} />
          </button>
          <button
            onClick={toggleTheme}
            className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-[#f0f2f5] text-[#111418] hover:bg-gray-200 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-[#f0f2f5] text-[#111418] hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing || loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-[#f0f2f5] text-[#111418] hover:bg-gray-200 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      <div className="h-full pt-4 pb-4 px-4 flex items-center justify-center relative z-10">
        <div className="w-full max-w-2xl h-full flex flex-col">
          <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
            {showComments ? (
              <CommentsCard 
                article={selectedArticle}
                onClose={handleCloseComments}
              />
            ) : (
              <NewsCard 
                key={`article-${currentIndex}`}
                article={articles[currentIndex]}
                onBookmarkChange={() => {}}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onShowComments={handleShowComments}
                showNavigation={true}
                isFirst={currentIndex === 0}
                isLast={currentIndex === articles.length - 1}
              />
            )}
          </div>
        </div>
      </div>

      {!showComments && currentIndex < articles.length - 1 && (
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
