import React, { useState, useEffect } from 'react'
import { ExternalLink, Bookmark, BookmarkCheck, Share, MessageCircle, Languages, Shield, Clock } from 'lucide-react'
import { useBookmarks } from '../contexts/BookmarkContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/apiClient'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { CapacitorHttp } from '@capacitor/core'
import { speechManager } from '../utils/speech'
import { hashKey } from '../utils/storage'

// Per-session cache so repeated swipes don't re-fetch article HTML
const resolvedImageCache = new Map()

const CATEGORY_GRADIENTS = {
  technology: 'from-blue-900 via-blue-800 to-cyan-900',
  business: 'from-emerald-900 via-teal-800 to-emerald-900',
  sports: 'from-orange-900 via-red-800 to-orange-900',
  science: 'from-violet-900 via-purple-800 to-violet-900',
  health: 'from-green-900 via-emerald-800 to-teal-900',
  entertainment: 'from-pink-900 via-rose-800 to-pink-900',
  politics: 'from-red-900 via-orange-800 to-red-900',
}

const NewsCard = ({
  article,
  onBookmarkChange,
  onNext,
  onPrevious,
  onShowComments,
  showNavigation = false,
  isFirst = false,
  isLast = false,
  onAuthRequired,
  isRead = false,
  onToggleRead,
  moreLikeThis = [],
  onSelectArticle,
}) => {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks()
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedContent, setTranslatedContent] = useState(null)
  const [showOriginal, setShowOriginal] = useState(true)
  const [biasAnalysis, setBiasAnalysis] = useState(null)
  const [showBiasAnalysis, setShowBiasAnalysis] = useState(false)
  const [analyzingBias, setAnalyzingBias] = useState(false)

  // Community bias voting state
  const [showBiasVote, setShowBiasVote] = useState(false)
  const [animateBiasModal, setAnimateBiasModal] = useState(false)
  const [biasVotes, setBiasVotes] = useState({ biased: 0, notBiased: 0, myVote: null })



  // Load comments count and reaction for display
  useEffect(() => {
    const articleId = article.url || article.title
    const articleHash = hashKey(articleId)

    const savedComments = localStorage.getItem(`newsly_comments_${btoa(articleId)}`)
    if (savedComments) {
      setComments(JSON.parse(savedComments))
    }

    // Reset translation state when article changes
    setTranslatedContent(null)
    setShowOriginal(true)
    setIsTranslating(false)

    // Load bias votes from cloud (or localStorage fallback)
    if (user) {
      api.get(`/api/bias-votes?articleHash=${articleHash}`)
        .then(data => setBiasVotes({ biased: data.biased || 0, notBiased: data.notBiased || 0, myVote: data.myVote || null }))
        .catch(() => setBiasVotes({ biased: 0, notBiased: 0, myVote: null }))
    } else {
      try {
        const votesRaw = localStorage.getItem(`newsly_bias_votes_${articleHash}`)
        if (votesRaw) {
          const parsed = JSON.parse(votesRaw)
          setBiasVotes({ biased: parsed.biased || 0, notBiased: parsed.nonBiased || parsed.notBiased || 0, myVote: parsed.myVote || null })
        } else {
          setBiasVotes({ biased: 0, notBiased: 0, myVote: null })
        }
      } catch {
        setBiasVotes({ biased: 0, notBiased: 0, myVote: null })
      }
    }

    // Auto-run bias analysis when Enhanced Bias Analysis is enabled
    const enhancedBiasEnabled = localStorage.getItem('newsly_enhanced_bias') === 'true'
    if (enhancedBiasEnabled) {
      setBiasAnalysis(null)
      setShowBiasAnalysis(false)
    }
  }, [article])

  // When enhanced bias mode is on, auto-fetch bias analysis for each new article
  useEffect(() => {
    const enhancedBiasEnabled = localStorage.getItem('newsly_enhanced_bias') === 'true'
    if (enhancedBiasEnabled && article?.title && !biasAnalysis && !analyzingBias) {
      const run = async () => {
        setAnalyzingBias(true)
        try {
          const text = `${article.title || ''}\n\n${article.description || ''}`
          const resp = await fetch('/api/ai/bias-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, source: article.source?.name || '' })
          })
          if (resp.ok) {
            const data = await resp.json()
            setBiasAnalysis(data)
            setShowBiasAnalysis(true)
          }
        } catch {}
        finally { setAnalyzingBias(false) }
      }
      run()
    }
  }, [article])

  const minSwipeDistance = 50
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [mouseStart, setMouseStart] = useState(null)
  const [mouseEnd, setMouseEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isReading, setIsReading] = useState(false)
  const [resolvedImage, setResolvedImage] = useState(null)
  const [resolvingImage, setResolvingImage] = useState(false)
  const [imageCredit, setImageCredit] = useState(null)
  const [showMoreLikeThis, setShowMoreLikeThis] = useState(false)



  // Resolve a relevant image via Wikipedia (title-based keyword lookup)
  useEffect(() => {
    setResolvedImage(null)
    setImageError(false)
    setImageLoading(true)
    setImageCredit(null)
    setResolvingImage(false)

    const cacheKey = article?.url || article?.title || ''
    if (!cacheKey) return

    const isNative = Capacitor.isNativePlatform()

    const resolveImage = async () => {
      if (resolvedImageCache.has(cacheKey)) {
        const cached = resolvedImageCache.get(cacheKey)
        if (cached.url) {
          setResolvedImage(cached.url)
          setImageCredit(cached.credit || null)
        }
        setImageLoading(false)
        return
      }

      setResolvingImage(true)
      try {
        const title = (article?.title || '').trim()

        // Extract the most informative keywords from the article title for Wikipedia lookup.
        const buildWikiQuery = (t) => {
          const stopWords = new Set([
            'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
            'is','are','was','were','be','been','has','have','had','will','can','as','up','it',
            'its','this','that','these','those','he','she','they','we','you','i','not','no',
            'vs','vs.','new','says','says','after','amid','over','like','just','more','than',
            'buys','sells','holds','stake','shares','stock','fund','percent','quarter','fiscal',
            'price','market','report','today','week','year','million','billion','trillion','lp',
            'inc','corp','llc','plc','ltd','company','companies','group','holdings','partners',
          ])
          return t
            .replace(/\s[-–|]\s.*$/, '')          // drop " - Publisher Name" suffix
            .replace(/\$[A-Z]+/g, '')             // strip stock tickers like $STX
            .replace(/[^a-zA-Z0-9 ]/g, ' ')       // strip punctuation
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
            .slice(0, 5)                           // keep top 5 keywords
            .join(' ')
        }

        // Wikipedia MediaWiki search API — search for articles and return the first with a thumbnail.
        // Uses generator=search+pageimages in a single request, which is far more reliable
        // than exact-title lookups (handles disambiguation, company names, financial topics, etc.)
        const fetchWikipediaImage = async (t) => {
          const query = buildWikiQuery(t)
          if (!query) return null
          const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&prop=pageimages&pithumbsize=800&piprop=thumbnail&format=json&origin=*`
          const headers = { 'Api-User-Agent': 'Newsly/2.0 (newsly.app)' }
          try {
            let data
            if (isNative) {
              // CapacitorHttp bypasses WebView CORS/network restrictions on Android
              const res = await CapacitorHttp.get({ url: apiUrl, headers })
              if (res.status !== 200) return null
              data = res.data
            } else {
              const res = await fetch(apiUrl, { headers })
              if (!res.ok) return null
              data = await res.json()
            }
            const pages = Object.values(data?.query?.pages || {})
            // Pages come back in random order; sort by index (search relevance rank)
            pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
            for (const page of pages) {
              const src = page?.thumbnail?.source
              if (src) {
                const hiRes = src.replace(/\/\d+px-/, '/800px-')
                const pageTitle = encodeURIComponent(page.title.replace(/ /g, '_'))
                return {
                  url: hiRes,
                  credit: {
                    provider: 'Wikipedia',
                    creator: 'Wikimedia Commons',
                    license: 'CC',
                    url: `https://en.wikipedia.org/wiki/${pageTitle}`
                  }
                }
              }
            }
          } catch (e) {
            console.error('Wikipedia image fetch failed:', e)
          }
          return null
        }

        const result = await fetchWikipediaImage(title)
        if (result) {
          resolvedImageCache.set(cacheKey, result)
          setResolvedImage(result.url)
          setImageCredit(result.credit)
        } else {
          resolvedImageCache.set(cacheKey, { url: null, credit: null })
        }
      } catch (e) {
        // silently fall through to gradient
      } finally {
        setResolvingImage(false)
      }
    }

    resolveImage()
  }, [article])




  // Stop speech when article changes
  useEffect(() => {
    return () => speechManager.stop()
  }, [article])

  const handleReadAloud = () => {
    if (!speechManager.isSupported) {
      alert('Text-to-speech is not supported in your browser')
      return
    }
    if (isReading) {
      speechManager.stop()
      setIsReading(false)
    } else {
      speechManager.speak(`${article.title}. ${article.description}`, {
        rate: 0.9,
        pitch: 1,
        volume: 1,
        onStart: () => setIsReading(true),
        onEnd: () => setIsReading(false),
        onError: () => setIsReading(false),
      })
    }
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  // Touch events
  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isUpSwipe = distance > minSwipeDistance
    const isDownSwipe = distance < -minSwipeDistance

    if (isUpSwipe && !isLast) {
      onNext?.()
    }
    if (isDownSwipe && !isFirst) {
      onPrevious?.()
    }
  }

  // Mouse events for desktop testing
  const onMouseDown = (e) => {
    setIsDragging(true)
    setMouseEnd(null)
    setMouseStart(e.clientY)
  }

  const onMouseMove = (e) => {
    if (!isDragging) return
    setMouseEnd(e.clientY)
  }

  const onMouseUp = () => {
    if (!isDragging || !mouseStart || !mouseEnd) {
      setIsDragging(false)
      return
    }

    const distance = mouseStart - mouseEnd
    const isUpSwipe = distance > minSwipeDistance
    const isDownSwipe = distance < -minSwipeDistance

    if (isUpSwipe && !isLast) {
      onNext?.()
    }
    if (isDownSwipe && !isFirst) {
      onPrevious?.()
    }

    setIsDragging(false)
  }

  const handleBookmark = () => {
    const url = article?.url
    if (!url) return
    if (isBookmarked(url)) {
      removeBookmark(article)
    } else {
      addBookmark(article)
    }
    onBookmarkChange?.()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      try {
        await navigator.clipboard.writeText(article.url)
        alert('Link copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy link')
      }
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'now'
    if (diffInHours < 24) return `${diffInHours}h`
    return `${Math.floor(diffInHours / 24)}d`
  }

  const handleReadMore = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Browser for mobile
        await Browser.open({
          url: article.url,
          windowName: '_blank',
          toolbarColor: '#1f2937',
          presentationStyle: 'popover'
        })
      } else {
        // Use window.open for web
        window.open(article.url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error opening URL:', error)
      // Fallback: try window.open
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }

  // Helpers
  const computeBiasPct = (biased, nonBiased) => {
    const b = Number(biased) || 0
    const nb = Number(nonBiased) || 0
    const total = b + nb
    if (total <= 0) return null
    const raw = (b / total) * 100
    // Show 1 decimal until we reach 20+ votes, then round to whole number
    return total < 20 ? Math.round(raw * 10) / 10 : Math.round(raw)
  }

  const handleTranslate = async () => {
    if (translatedContent && !showOriginal) {
      setShowOriginal(true)
      return
    }

    if (translatedContent && showOriginal) {
      setShowOriginal(false)
      return
    }

    setIsTranslating(true)

    try {
      const textToTranslate = `${article.title}\n\n${article.description}`
      let translatedText = null
      const isNative = Capacitor.isNativePlatform()

      console.log('Translation attempt - isNative:', isNative)

      // Try LibreTranslate first (better quality)
      try {
        if (isNative) {
          const response = await CapacitorHttp.post({
            url: 'https://libretranslate.de/translate',
            headers: {
              'Content-Type': 'application/json',
            },
            data: {
              q: textToTranslate,
              source: 'auto',
              target: 'en',
              format: 'text'
            }
          })

          console.log('LibreTranslate mobile response:', response)
          if (response.status === 200 && response.data && response.data.translatedText) {
            translatedText = response.data.translatedText
          }
        } else {
          const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              q: textToTranslate,
              source: 'auto',
              target: 'en',
              format: 'text'
            })
          })

          if (response.ok) {
            const data = await response.json()
            translatedText = data.translatedText
          }
        }
      } catch (error) {
        console.log('LibreTranslate failed:', error)
      }

      // Fallback: Try Google Translate via proxy
      if (!translatedText) {
        try {
          const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(textToTranslate)}`

          if (isNative) {
            const response = await CapacitorHttp.get({
              url: googleUrl,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
              }
            })

            console.log('Google mobile response:', response)
            if (response.status === 200 && response.data && response.data[0]) {
              translatedText = response.data[0].map(item => item[0]).join('')
            }
          } else {
            const response = await fetch(googleUrl)
            const data = await response.json()

            if (data && data[0]) {
              translatedText = data[0].map(item => item[0]).join('')
            }
          }
        } catch (error) {
          console.log('Google Translate failed:', error)
        }
      }

      // Final fallback: Lingva Translate
      if (!translatedText) {
        try {
          const lingvaUrl = `https://lingva.ml/api/v1/auto/en/${encodeURIComponent(textToTranslate)}`

          if (isNative) {
            const response = await CapacitorHttp.get({
              url: lingvaUrl,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
              }
            })

            console.log('Lingva mobile response:', response)
            if (response.status === 200 && response.data && response.data.translation) {
              translatedText = response.data.translation
            }
          } else {
            const response = await fetch(lingvaUrl)
            const data = await response.json()
            translatedText = data.translation
          }
        } catch (error) {
          console.log('Lingva failed:', error)
        }
      }

      if (translatedText) {
        // Split back into title and description
        const parts = translatedText.split('\n\n')
        const translatedTitle = parts[0] || article.title
        const translatedDescription = parts[1] || parts[0] || article.description

        setTranslatedContent({
          title: translatedTitle,
          description: translatedDescription
        })
        setShowOriginal(false)
        console.log('Translation successful!')
      } else {
        console.log('All translation services failed')
        alert('Translation service temporarily unavailable. Please try again later.')
      }

    } catch (error) {
      console.error('Translation failed:', error)
      alert('Translation failed. Please check your internet connection.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Community bias vote modal helpers
  const openBiasVoteModal = () => {
    setShowBiasVote(true)
    setTimeout(() => setAnimateBiasModal(true), 0)
  }
  const closeBiasVoteModal = () => {
    setAnimateBiasModal(false)
    setTimeout(() => setShowBiasVote(false), 180)
  }
  const handleBiasVote = async (vote) => {
    const articleId = article.url || article.title
    const articleHash = hashKey(articleId)

    if (!user) { onAuthRequired?.(); closeBiasVoteModal(); return }
    if (biasVotes.myVote === vote) return // already voted this way

    // Optimistic update
    setBiasVotes(prev => {
      let { biased, notBiased, myVote } = prev
      if (myVote === 'biased') biased = Math.max(0, biased - 1)
      if (myVote === 'not_biased') notBiased = Math.max(0, notBiased - 1)
      if (vote === 'biased') biased += 1; else notBiased += 1
      return { biased, notBiased, myVote: vote }
    })

    closeBiasVoteModal()

    try {
      const data = await api.post('/api/bias-votes', { articleHash, vote })
      setBiasVotes({ biased: data.biased || 0, notBiased: data.notBiased || 0, myVote: data.myVote })
    } catch {
      // Revert on failure
      setBiasVotes(prev => {
        let { biased, notBiased, myVote: current } = prev
        if (current === 'biased') biased = Math.max(0, biased - 1)
        if (current === 'not_biased') notBiased = Math.max(0, notBiased - 1)
        return { biased, notBiased, myVote: null }
      })
    }
  }

  const totalBiasVotes = (biasVotes?.biased || 0) + (biasVotes?.notBiased || 0)

  const enhancedBiasEnabled = localStorage.getItem('newsly_enhanced_bias') === 'true'

  // Reading time estimate based on description word count
  const wordCount = article?.description?.split(/\s+/).filter(Boolean).length || 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  const analyzeBias = async () => {
    if (biasAnalysis && !showBiasAnalysis) { setShowBiasAnalysis(true); return }
    if (biasAnalysis && showBiasAnalysis) { setShowBiasAnalysis(false); return }

    setAnalyzingBias(true)
    try {
      const text = `${article.title || ''}\n\n${article.description || ''}`
      const resp = await fetch('/api/ai/bias-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source: article.source?.name || '' })
      })
      if (resp.ok) {
        const data = await resp.json()
        setBiasAnalysis(data)
        setShowBiasAnalysis(true)
      }
    } catch {}
    finally { setAnalyzingBias(false) }
  }

  const displayContent = showOriginal ? article : (translatedContent || article)

  const finalImageSrc = resolvedImage || null

  return (
    <article
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col select-none relative z-20 max-w-md mx-auto h-[600px]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      style={{
        touchAction: 'none',   // we handle swipes ourselves; prevents browser scroll hijack
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {(finalImageSrc && !imageError) ? (
          <img
            src={finalImageSrc}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[article?.category] || 'from-slate-800 via-gray-700 to-slate-900'}`}></div>
        )}
        {/* Image shimmer overlay while loading/resolving */}
        {(imageLoading || resolvingImage) && (
          <div className="absolute inset-0 animate-pulse bg-gray-200/30 dark:bg-gray-700/30"></div>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        {/* Image attribution – shown only when picture is from Openverse */}
        {imageCredit && (
          <div className="absolute bottom-2 right-2 z-10 text-[10px] text-white/75 drop-shadow">
            Image: {imageCredit.provider}
            {imageCredit.creator ? ` · ${imageCredit.creator}` : ''}
            {imageCredit.license ? ` · ${String(imageCredit.license).toUpperCase()}` : ''}
          </div>
        )}
      </div>

      {/* Top Bar with Logo and Actions */}
      <div className="relative z-10 flex items-center justify-between p-4">
        {/* Newsly Logo */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
                className="text-blue-600"
              />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">newsly</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmark}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            {isBookmarked(article?.url) ? (
              <BookmarkCheck size={18} className="text-blue-600 dark:text-blue-400" />
            ) : (
              <Bookmark size={18} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>

          <button
            onClick={handleShare}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <Share size={18} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Content Card at Bottom */}
      <div className="relative z-10 mt-auto bg-white dark:bg-gray-800 rounded-t-3xl max-h-[70%] flex flex-col">
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
        {/* Source and Time */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 gap-2 flex-wrap">
          <span className="font-medium">{article.source?.name || 'Unknown'}</span>
          <span className="mx-1">·</span>
          <span>{formatTimeAgo(article.publishedAt)}</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {readingTime} min read
          </span>
          {isRead && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 text-xs">
              Read
            </span>
          )}
          {enhancedBiasEnabled && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Shield size={10} />
              Bias watch
            </span>
          )}
          {(() => {
            try {
              const host = new URL(article?.url || '').hostname.replace(/^www\./, '')
              const paywalled = ['nytimes.com','wsj.com','ft.com','bloomberg.com','thetimes.co.uk','economist.com','washingtonpost.com','theatlantic.com','newyorker.com']
                .some(d => host === d || host.endsWith(`.${d}`))
              return paywalled ? (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Paywall</span>
              ) : null
            } catch { return null }
          })()}
        </div>

        {/* Headline */}
        <h1 className="text-lg font-bold leading-tight text-blue-600 dark:text-blue-400 mb-4">
          {displayContent.title}
          {!showOriginal && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              Translated
            </span>
          )}
        </h1>

        {/* Description - Full 60-word summary */}
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-6">
          {displayContent.description}
        </p>

        {/* Bias Analysis Panel */}
        {showBiasAnalysis && biasAnalysis && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-900 dark:text-white font-medium text-sm">Bias Analysis</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                biasAnalysis.biasLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                biasAnalysis.biasLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {biasAnalysis.biasLevel} Bias
              </span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Bias Level</span>
                <span>{biasAnalysis.biasPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    biasAnalysis.biasPercentage < 20 ? 'bg-green-500' :
                    biasAnalysis.biasPercentage < 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${biasAnalysis.biasPercentage}%` }}
                ></div>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-xs">
              {biasAnalysis.analysis}
            </p>
          </div>
        )}
        </div>

        {/* Bottom Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
          <button
            onClick={handleReadMore}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
            title="Open original article"
          >
            <ExternalLink size={14} />
            Read full at {article.source?.name || 'Source'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              title={showOriginal ? "Translate to English" : "Show Original"}
            >
              <Languages
                size={18}
                className={`${isTranslating ? 'animate-spin' : ''} ${
                  !showOriginal ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              />
            </button>


            <button
              onClick={() => onShowComments?.(article)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 relative"
            >
              <MessageCircle size={18} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
              {comments.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              onClick={openBiasVoteModal}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              title="Community Bias Vote"
            >
              <Shield
                size={18}
                className={`text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400`}
              />
            </button>
          </div>
        </div>

        {/* More like this + read/unread */}
        {moreLikeThis && moreLikeThis.length > 0 && (
          <div className="shrink-0 px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <button
                onClick={() => setShowMoreLikeThis(prev => !prev)}
                className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0"
              >
                {showMoreLikeThis ? 'Hide' : 'More like this'}
                <span className="ml-1">({moreLikeThis.length})</span>
              </button>

              <button
                onClick={onToggleRead}
                className="text-xs font-medium px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isRead ? 'Mark as unread' : 'Mark as read'}
              >
                {isRead ? 'Mark unread' : 'Mark read'}
              </button>
            </div>

            {showMoreLikeThis && (
              <div className="mt-3 grid gap-2">
                {moreLikeThis.map((item) => (
                  <button
                    key={item.url || item.title}
                    onClick={() => onSelectArticle?.(item)}
                    className="text-left w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.title}</div>
                    <div className="text-gray-500 dark:text-gray-400 truncate">{item.source?.name || 'Unknown source'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bias Vote Modal */}
      {showBiasVote && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* backdrop */}
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${animateBiasModal ? 'opacity-100' : 'opacity-0'}`} onClick={closeBiasVoteModal}></div>

          {/* sheet */}
          <div className={`relative w-full sm:max-w-sm sm:rounded-2xl bg-white dark:bg-gray-800 shadow-xl m-0 sm:m-4 translate-y-0 transition-all duration-200 ${animateBiasModal ? 'sm:scale-100 sm:opacity-100 translate-y-0' : 'sm:scale-95 sm:opacity-0 translate-y-4'}`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Is this article biased?</h3>
              </div>
              <button onClick={closeBiasVoteModal} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
                  <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.415L11.414 10l4.95 4.95a1 1 0 11-1.415 1.414L10 11.414l-4.95 4.95a1 1 0 11-1.414-1.415L8.586 10 3.636 5.05A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBiasVote('not_biased')} className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${biasVotes.myVote === 'not_biased' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  Non-biased
                </button>
                <button onClick={() => handleBiasVote('biased')} className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${biasVotes.myVote === 'biased' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  Biased
                </button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Community bias</span>
                  <span>{computeBiasPct(biasVotes.biased, biasVotes.notBiased) !== null ? `${computeBiasPct(biasVotes.biased, biasVotes.notBiased)}% biased` : 'No votes yet'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-red-500" style={{ width: `${computeBiasPct(biasVotes.biased, biasVotes.notBiased) ?? 0}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Based on {(Number(biasVotes.biased || 0) + Number(biasVotes.notBiased || 0))} vote{(Number(biasVotes.biased || 0) + Number(biasVotes.notBiased || 0)) === 1 ? '' : 's'}.</p>
              </div>

              {/* AI Bias Analysis */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={analyzeBias}
                  disabled={analyzingBias}
                  className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 py-1"
                >
                  {analyzingBias ? 'Analyzing…' : biasAnalysis ? (showBiasAnalysis ? 'Hide AI Analysis' : 'Show AI Analysis') : 'Run AI Bias Analysis'}
                </button>
                {showBiasAnalysis && biasAnalysis && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">AI Analysis</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        biasAnalysis.biasLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        biasAnalysis.biasLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>{biasAnalysis.biasLevel} · {biasAnalysis.biasPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                      <div className={`h-1.5 rounded-full ${biasAnalysis.biasPercentage < 20 ? 'bg-green-500' : biasAnalysis.biasPercentage < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${biasAnalysis.biasPercentage}%` }}></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{biasAnalysis.analysis}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </article>
  )
}

export default NewsCard
