import React, { useState, useEffect } from 'react'
import { ExternalLink, Bookmark, BookmarkCheck, Share, MessageCircle, Languages } from 'lucide-react'
import { useBookmarks } from '../contexts/BookmarkContext'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { CapacitorHttp } from '@capacitor/core'

const NewsCard = ({ 
  article, 
  onBookmarkChange, 
  onNext, 
  onPrevious, 
  onShowComments,
  showNavigation = false,
  isFirst = false,
  isLast = false 
}) => {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks()
  const [comments, setComments] = useState([])
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedContent, setTranslatedContent] = useState(null)
  const [showOriginal, setShowOriginal] = useState(true)
  
  // Load comments count for display
  useEffect(() => {
    const articleId = article.url || article.title
    const savedComments = localStorage.getItem(`newsly_comments_${btoa(articleId)}`)
    if (savedComments) {
      setComments(JSON.parse(savedComments))
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
  const [speechSynthesis, setSpeechSynthesis] = useState(null)

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis)
    }

    // Cleanup on unmount
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [article])

  const handleReadAloud = () => {
    if (!speechSynthesis) {
      alert('Text-to-speech is not supported in your browser')
      return
    }

    if (isReading) {
      // Stop reading
      speechSynthesis.cancel()
      setIsReading(false)
    } else {
      // Start reading
      const textToRead = `${article.title}. ${article.description}`
      const utterance = new SpeechSynthesisUtterance(textToRead)
      
      // Configure speech settings
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      // Event handlers
      utterance.onstart = () => setIsReading(true)
      utterance.onend = () => setIsReading(false)
      utterance.onerror = () => setIsReading(false)
      
      speechSynthesis.speak(utterance)
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
    if (isBookmarked(article)) {
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

  const displayContent = showOriginal ? article : (translatedContent || article)

  return (
    <article 
      className="h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col select-none relative z-20"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      style={{ 
        touchAction: 'pan-y', 
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Source Bar */}
      <div className="px-6 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">{article.source?.name || 'Unknown'}</span>
          <span className="mx-2">·</span>
          <span>{formatTimeAgo(article.publishedAt)}</span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="px-6 pb-4 flex-shrink-0">
        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {(article.urlToImage && !imageError) ? (
            <img
              src={article.urlToImage}
              alt={article.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No image available</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content - Flexible */}
      <div className="px-6 flex-1 flex flex-col">
        {/* Headline */}
        <h1 className="text-xl md:text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100 mb-4">
          {displayContent.title}
          {!showOriginal && (
            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              Translated
            </span>
          )}
        </h1>

        {/* 60-Word Summary */}
        <div className="flex-1 flex items-start">
          <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
            {displayContent.description}
          </p>
        </div>
      </div>
      
      {/* Action Row - Fixed at bottom */}
      <div className="px-6 pb-6 pt-4 flex-shrink-0">
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              Read More
            </a>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title={showOriginal ? "Translate to English" : "Show Original"}
              >
                <Languages 
                  size={20} 
                  className={`${isTranslating ? 'animate-spin' : ''} ${
                    !showOriginal ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`} 
                />
              </button>
              
              <button
                onClick={() => onShowComments?.(article)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 relative"
              >
                <MessageCircle size={20} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                {comments.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {comments.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={handleBookmark}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {isBookmarked(article) ? (
                  <BookmarkCheck size={20} className="text-blue-600 dark:text-blue-400" />
                ) : (
                  <Bookmark size={20} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                )}
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Share size={20} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default NewsCard
