import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Bookmark,
  MoreHorizontal,
  Share,
  Search,
  X,
  User,
  LogIn
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
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
  const [animating, setAnimating] = useState(false)
  const [animDir, setAnimDir] = useState(null)   // 'up' | 'down'
  const [animReady, setAnimReady] = useState(false)
  const pendingIndexRef = useRef(null)
  const [showComments, setShowComments] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const { user } = useAuth()
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
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState('article') // 'article' | 'source'
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef(null)
  const feedTouchStartY = useRef(null)

  // Debounce: only apply search filter 400ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

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

    // Apply search filter (debounced, mode-aware)
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase()
      if (searchMode === 'source') {
        list = list.filter(a => a.source?.name?.toLowerCase().includes(q))
      } else {
        list = list.filter(a =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
        )
      }
    }

    return list
  }, [articles, hidePaywalled, sortMode, debouncedSearchQuery, searchMode])

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0)
  }, [sortMode, hidePaywalled, debouncedSearchQuery, searchMode])

  // Swipe on the entire feed container (catches touches outside the card)
  const handleFeedTouchStart = (e) => {
    // Don't hijack touches inside interactive elements
    const tag = e.target.tagName
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'A') return
    feedTouchStartY.current = e.touches[0].clientY
  }

  const handleFeedTouchEnd = (e) => {
    if (feedTouchStartY.current === null) return
    const delta = feedTouchStartY.current - e.changedTouches[0].clientY
    feedTouchStartY.current = null
    if (Math.abs(delta) < 50) return          // too short — ignore
    if (delta > 0) handleNext()               // swipe up  → next
    else handlePrevious()                     // swipe down → previous
  }

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  const handleMainScroll = (e) => {
    setScrolled(e.currentTarget.scrollTop > 0)
  }


  const loadNews = async (forceRefresh = false, countryOverride = null) => {
    // For force refresh, always proceed regardless of loading state
    if (!forceRefresh && loading) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const country = countryOverride ?? selectedCountry
      const genres = selectedGenres?.length > 0 ? selectedGenres : ['technology', 'business']
      const data = await fetchNews(genres, 'auto', country)

      if (data && data.articles && data.articles.length > 0) {
        if (forceRefresh) {
          setArticles(data.articles)
          setCurrentIndex(0)
        } else {
          // Deduplicate when appending to avoid showing same articles twice
          setArticles(prev => {
            const existingUrls = new Set(prev.map(a => a.url))
            const newOnes = data.articles.filter(a => !existingUrls.has(a.url))
            return newOnes.length > 0 ? [...prev, ...newOnes] : prev
          })
        }
      } else {
        setError('No articles found for your selected categories')
      }
    } catch (err) {
      setError(err.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasInitialLoad) {
      setHasInitialLoad(true)
      loadNews()
    }
  }, []) // Remove hasInitialLoad dependency to prevent re-runs

  const handleCountryChange = async (countryCode) => {
    setSelectedCountry(countryCode)
    setStoredCountry(countryCode)
    setShowCountrySelector(false)
    setArticles([])
    setCurrentIndex(0)
    loadNews(true, countryCode)
  }

  // Auto-load more articles when near the end of the feed
  useEffect(() => {
    if (
      hasInitialLoad &&
      filteredArticles.length > 0 &&
      currentIndex >= filteredArticles.length - 3 &&
      !loading &&
      !searchQuery.trim()
    ) {
      loadNews(false)
    }
  }, [currentIndex, filteredArticles.length])

  const handleRefresh = () => {
    setRefreshing(true)
    loadNews(true).finally(() => setRefreshing(false))
  }

  const handleNext = () => {
    if (currentIndex < filteredArticles.length - 1 && !animating) {
      const nextIdx = currentIndex + 1
      pendingIndexRef.current = nextIdx
      setAnimDir('up')
      setAnimating(true)
      setAnimReady(false)
      // Double rAF: first ensures the incoming card is painted at its initial
      // off-screen position, second triggers the CSS transition into view.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setAnimReady(true)
        setTimeout(() => {
          setCurrentIndex(nextIdx)
          setAnimating(false)
          setAnimDir(null)
          setAnimReady(false)
          pendingIndexRef.current = null
        }, 380)
      }))
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0 && !animating) {
      const prevIdx = currentIndex - 1
      pendingIndexRef.current = prevIdx
      setAnimDir('down')
      setAnimating(true)
      setAnimReady(false)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setAnimReady(true)
        setTimeout(() => {
          setCurrentIndex(prevIdx)
          setAnimating(false)
          setAnimDir(null)
          setAnimReady(false)
          pendingIndexRef.current = null
        }, 380)
      }))
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
  }, [currentIndex, articles.length, animating])

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

  if (filteredArticles.length === 0 && !searchQuery) {
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
      <header className={`relative z-50 flex items-center whitespace-nowrap px-4 py-3 flex-shrink-0 backdrop-blur ${scrolled ? 'bg-white/80 dark:bg-gray-800/80 border-b border-b-[#e7edf3] dark:border-b-gray-700' : 'bg-white dark:bg-gray-800'}`}>

        {/* ── Search mode: full-width input replaces everything ── */}
        {showSearch ? (
          <>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); setDebouncedSearchQuery('') }}
              className="p-2 mr-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col flex-1 gap-1.5">
              {/* Input row */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchMode === 'source' ? 'Search by newspaper…' : 'Search articles…'}
                  className="flex-1 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setDebouncedSearchQuery('') }}>
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Article / Source toggle */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSearchMode('article')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    searchMode === 'article'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Article
                </button>
                <button
                  onClick={() => setSearchMode('source')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    searchMode === 'source'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Newspaper
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Normal mode ── */
          <>
            <div className="flex items-center gap-2 text-[#0d151c] dark:text-white flex-shrink-0">
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

            <div className="flex items-center gap-2 ml-auto">
              {/* Country Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCountrySelector(!showCountrySelector)}
                  className="flex items-center gap-1 px-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors max-w-[96px]"
                >
                  <span className="text-sm truncate">{getCountryName(selectedCountry)}</span>
                  <ChevronDown size={14} className="flex-shrink-0" />
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

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>

              {/* User / Login */}
              <button
                onClick={() => { setAuthModalMode(user ? 'login' : 'login'); setShowAuthModal(true) }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                title={user ? user.displayName || user.email : 'Sign in'}
              >
                {user ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <span className="text-white font-bold" style={{ fontSize: 9 }}>
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <LogIn size={18} />
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings size={18} />
              </button>

              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Search size={18} />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Removed separate search bar — it's now inline in the header */}


      {/* Main Content — swipe-only navigation; no native scroll */}
      <main
        className="flex-1 overflow-hidden"
        style={{ touchAction: 'none' }}
        onTouchStart={handleFeedTouchStart}
        onTouchEnd={handleFeedTouchEnd}
        onTouchMove={(e) => e.preventDefault()}
      >
        <div className="px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {refreshing && (
              <div className="text-center mb-4">
                <RefreshCw className="animate-spin mx-auto mb-2 text-blue-600" size={24} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Refreshing...</p>
              </div>
            )}

            {/* Card stack — overflow-hidden clips outgoing/incoming cards during animation */}
            <div className="relative overflow-hidden rounded-xl" style={{ height: '600px' }}>

              {/* No-results fallback — shown inline so user can still edit search without losing context */}
              {filteredArticles.length === 0 && debouncedSearchQuery.trim() && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Search size={28} className="text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    No {searchMode === 'source' ? 'newspapers' : 'articles'} found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    No results for <span className="font-medium text-gray-700 dark:text-gray-200">&quot;{debouncedSearchQuery}&quot;</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                    {searchMode === 'source'
                      ? 'Try a different newspaper name, e.g. "BBC", "Reuters", "The Hindu"'
                      : 'Try different keywords or switch to Newspaper search'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSearchQuery(''); setDebouncedSearchQuery('') }}
                      className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Clear search
                    </button>
                    <button
                      onClick={() => setSearchMode(m => m === 'article' ? 'source' : 'article')}
                      className="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Search {searchMode === 'article' ? 'Newspaper' : 'Article'}
                    </button>
                  </div>
                </div>
              )}

              {/* Typing debounce hint — shown while user is still typing */}
              {filteredArticles.length === 0 && searchQuery && !debouncedSearchQuery.trim() && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl">
                  <p className="text-sm text-gray-400 dark:text-gray-500">Searching…</p>
                </div>
              )}

              {/* Outgoing (current) card — slides up or down off screen */}
              <div
                className="absolute inset-0"
                style={{
                  zIndex: 2,
                  transition: animReady ? 'transform 380ms cubic-bezier(0.4,0,0.2,1)' : 'none',
                  transform: animReady
                    ? (animDir === 'up' ? 'translateY(-110%)' : animDir === 'down' ? 'translateY(110%)' : 'translateY(0)')
                    : 'translateY(0)',
                }}
              >
                <NewsCard
                  article={filteredArticles[currentIndex]}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onShowComments={handleShowComments}
                  onAuthRequired={() => setShowAuthModal(true)}
                  showNavigation={true}
                  isFirst={currentIndex === 0}
                  isLast={currentIndex === filteredArticles.length - 1}
                />
              </div>

              {/* Incoming card — slides in from below (up) or above (down) */}
              {animating && pendingIndexRef.current !== null && filteredArticles[pendingIndexRef.current] && (
                <div
                  className="absolute inset-0"
                  style={{
                    zIndex: 1,
                    pointerEvents: 'none',
                    transition: animReady ? 'transform 380ms cubic-bezier(0.4,0,0.2,1)' : 'none',
                    transform: animReady
                      ? 'translateY(0) scale(1)'
                      : (animDir === 'up' ? 'translateY(105%) scale(0.97)' : 'translateY(-105%) scale(0.97)'),
                  }}
                >
                  <NewsCard
                    article={filteredArticles[pendingIndexRef.current]}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onShowComments={handleShowComments}
                    onAuthRequired={() => setShowAuthModal(true)}
                    showNavigation={true}
                    isFirst={pendingIndexRef.current === 0}
                    isLast={pendingIndexRef.current === filteredArticles.length - 1}
                  />
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                {filteredArticles.length > 0 ? `${currentIndex + 1} / ${filteredArticles.length}` : ''}
              </span>
              {loading && <RefreshCw size={11} className="animate-spin text-gray-400" />}
            </div>

            {/* Swipe hint — hidden while animating */}
            {!animating && currentIndex < filteredArticles.length - 1 && (
              <div className="flex flex-col items-center justify-center mt-6 py-2">
                <div className="animate-bounce mb-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                <p className="text-gray-400 text-xs font-medium">Swipe up</p>
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
          onAuthRequired={() => { handleCloseComments(); setShowAuthModal(true) }}
        />
      )}

      {/* Auth modal — shown when unauthenticated action is attempted */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} defaultMode={authModalMode} />
      )}
    </div>
  )
}

export default Feed
