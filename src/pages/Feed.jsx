import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Bookmark,
  MoreHorizontal,
  Share
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import NewsCard from '../components/NewsCard'
import CommentsCard from '../components/CommentsCard'
import { fetchNews } from '../utils/api'
import { getStoredGenres, getStoredCountry, setStoredCountry, getStoredSortMode, setStoredSortMode, getHidePaywalled } from '../utils/storage'
import { PAYWALLED_DOMAINS } from '../utils/constants'
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

  // Preferences
  const [sortMode, setSortMode] = useState(getStoredSortMode()) // 'latest' | 'personalized'
  const [hidePaywalled, setHidePaywalled] = useState(getHidePaywalled())

  const [scrolled, setScrolled] = useState(false)

  // Derive filtered/sorted articles
  const filteredArticles = useMemo(() => {
    let list = [...articles]

    // Hide paywalled if enabled
    if (hidePaywalled) {
      const isPaywalledDomain = (url) => {
        try {
          const host = new URL(url).hostname.replace(/^www\./, '')
          return PAYWALLED_DOMAINS.some(d => host === d || host.endsWith(`.${d}`))
        } catch { return false }
      }
      list = list.filter(a => a?.url && !isPaywalledDomain(a.url))
    }

    if (sortMode === 'latest') {
      list.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    }

    return list
  }, [articles, hidePaywalled, sortMode])

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0)
  }, [sortMode, hidePaywalled])

  const handleMainScroll = (e) => {
    setScrolled(e.currentTarget.scrollTop > 0)
  }


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

    // Refresh the entire app
    window.location.reload()
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

  if (filteredArticles.length === 0) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No articles found for your selected filters.</p>
          <button onClick={handleRefresh} className="btn-primary">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header - Fixed */}
      <header className={`flex items-center justify-between whitespace-nowrap px-4 py-3 flex-shrink-0 backdrop-blur ${scrolled ? 'bg-white/80 dark:bg-gray-800/80 border-b border-b-[#e7edf3] dark:border-b-gray-700' : 'bg-white dark:bg-gray-800'}`}>
        <div className="flex items-center gap-4 text-[#0d151c] dark:text-white">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2
            className="text-[#0d151c] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] cursor-pointer"
            onClick={() => navigate('/')}
          >
            Newsly
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Country Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCountrySelector(!showCountrySelector)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-36 overflow-hidden justify-between"
            >
              <span className="text-sm truncate flex-1">{getCountryName(selectedCountry)}</span>
              <ChevronDown size={16} />
            </button>

            {showCountrySelector && (
              <div className="absolute top-full right-0 mt-2 z-50">
                <CountrySelector
                  selectedCountry={selectedCountry}
                  onCountryChange={handleCountryChange}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {/* Sort Toggle */}
          <div className="hidden sm:flex items-center rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setSortMode('personalized'); setStoredSortMode('personalized') }}
              className={`px-3 py-2 text-sm ${sortMode === 'personalized' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Personalized
            </button>
            <button
              onClick={() => { setSortMode('latest'); setStoredSortMode('latest') }}
              className={`px-3 py-2 text-sm ${sortMode === 'latest' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Latest
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings size={20} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>


      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto" onScroll={handleMainScroll}>
        <div className="px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {refreshing && (
              <div className="text-center mb-4">
                <RefreshCw className="animate-spin mx-auto mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Refreshing...</p>
              </div>
            )}

            <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>

              <NewsCard
                article={filteredArticles[currentIndex]}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onShowComments={handleShowComments}
                showNavigation={true}
                isFirst={currentIndex === 0}
                isLast={currentIndex === filteredArticles.length - 1}
              />
            </div>

            {/* Swipe Up Animation - Outside the card if the card is not the last one */}
            {currentIndex < articles.length - 1 && (
              <div className="flex flex-col items-center justify-center mt-8 py-4">
                <div className="animate-bounce mb-2">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">Swipe up</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Comments Modal */}
      {showComments && selectedArticle && (
        <CommentsCard
          article={selectedArticle}
          onClose={handleCloseComments}
        />
      )}
    </div>
  )
}

export default Feed
