import React, { useState, useEffect } from 'react'
import { ExternalLink, Bookmark, BookmarkCheck, Share, MessageCircle, Languages, Shield } from 'lucide-react'
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
  const [biasAnalysis, setBiasAnalysis] = useState(null)
  const [showBiasAnalysis, setShowBiasAnalysis] = useState(false)

  // Community bias voting state
  const [showBiasVote, setShowBiasVote] = useState(false)
  const [animateBiasModal, setAnimateBiasModal] = useState(false)
  const [biasVotes, setBiasVotes] = useState({ biased: 0, nonBiased: 0, myVote: null })



  // Load comments count and reaction for display
  useEffect(() => {
    const articleId = article.url || article.title
    const savedComments = localStorage.getItem(`newsly_comments_${btoa(articleId)}`)
    if (savedComments) {
      setComments(JSON.parse(savedComments))
    }

    // Reset translation state when article changes
    setTranslatedContent(null)
    setShowOriginal(true)
    setIsTranslating(false)

    // Load bias votes for this article
    try {
      const votesRaw = localStorage.getItem(`newsly_bias_votes_${btoa(articleId)}`)
      if (votesRaw) {
        const parsed = JSON.parse(votesRaw)
        setBiasVotes({ biased: parsed.biased || 0, nonBiased: parsed.nonBiased || 0, myVote: parsed.myVote || null })
      } else {
        setBiasVotes({ biased: 0, nonBiased: 0, myVote: null })
      }
    } catch (e) {
      setBiasVotes({ biased: 0, nonBiased: 0, myVote: null })
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
  const [resolvedImage, setResolvedImage] = useState(null)
  const [resolvingImage, setResolvingImage] = useState(false)
  const [imageCredit, setImageCredit] = useState(null)



  // Try to resolve a better image from the original article if we only have a flag
  useEffect(() => {
    setResolvedImage(null)
    setResolvingImage(false)

    const initial = article?.urlToImage || ''
    const isFlag = /flagcdn\.com\/w320\/(?:[a-z]{2}|un)\.png/i.test(initial)
    // Treat some aggregator/CDN placeholders as "bad" so we try to resolve a real image
    const initialHost = (() => { try { return new URL(initial).hostname.replace(/^www\./,'') } catch { return '' } })()
    const badHosts = ['news.google.com','gstatic.com','googleusercontent.com','ggpht.com','apple.news','mzstatic.com','flipboard.com','news.yahoo.com','yimg.com','s.yimg.com']
    const isAggregatorInitial = initial && badHosts.some(d => initialHost === d || initialHost.endsWith(`.${d}`))
    const looksGeneric = /placeholder|default|generic|og-image|opengraph|brand|logo|card|thumb|sprite/i.test(initial)
    if (initial && !isFlag && !isAggregatorInitial && !looksGeneric) return

    // Prefer the original article URL when available (from RSS description), else fallback to Google News link
    const targetUrl = article?.originalUrl || article?.url
    if (!targetUrl) return

    const fetchHtmlAndExtract = async () => {
      setResolvingImage(true)
      try {
        const makeAbs = (u, base) => {
          try { return new URL(u, base).toString() } catch { return u }
        }
        const fetchHtml = async (url) => {
          if (Capacitor.isNativePlatform()) {
            const response = await CapacitorHttp.get({ url, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Newsly/1.0)' } })
            if (typeof response.data === 'string') return response.data
            return ''
          } else {
            const proxied = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
            const resp = await fetch(proxied)
            if (resp.ok) {
              const data = await resp.json()
              return data.contents || ''
            }
            return ''
          }
        }
        const extractCandidates = (html, base) => {
          const candidates = []
          const push = (x) => { if (x) candidates.push(x) }
          // OG/Twitter
          ;[...html.matchAll(/<meta[^>]+(?:property|name)=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig)]
            .forEach(m => push(m[1]))
          ;[...html.matchAll(/<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/ig)]
            .forEach(m => push(m[1]))
          // JSON-LD
          const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig)]
          for (const lm of ldMatches) {
            try {
              const json = JSON.parse(lm[1].trim())
              const pushImage = (img) => {
                if (!img) return
                if (typeof img === 'string') push(img)
                else if (Array.isArray(img)) img.forEach(x => pushImage(x))
                else if (typeof img === 'object' && img.url) push(img.url)
              }
              if (Array.isArray(json)) json.forEach(obj => pushImage(obj?.image))
              else pushImage(json?.image)
            } catch {}
          }
          // rel=image_src
          const linkMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/i)
          if (linkMatch) push(linkMatch[1])
          // srcset highest-res
          const srcsetMatch = html.match(/<img[^>]+srcset=["']([^"']+)["'][^>]*>/i)
          if (srcsetMatch) {
            try {
              const parts = srcsetMatch[1].split(',').map(s => s.trim())
              let best = null, bestW = 0
              parts.forEach(p => {
                const m = p.match(/\s*(\S+)\s+(\d+)w/)
                if (m) { const url = m[1]; const w = parseInt(m[2], 10); if (w > bestW) { bestW = w; best = url } }
              })
              if (best) push(best)
            } catch {}
          }
          // fallback first absolute <img>
          const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|gif|webp|avif)[^"']*)["'][^>]*>/i)
          if (imgMatch) push(imgMatch[1])

          // Canonical
          const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<link[^>]+rel=["']amphtml["'][^>]+href=["']([^"']+)["'][^>]*>/i)

          const cleaned = candidates
            .filter(Boolean)
            .map(s => s.replace(/&amp;/g, '&'))
            .map(s => s.startsWith('//') ? `https:${s}` : s)
            .map(s => makeAbs(s, base))
            .filter(u => !/^data:/i.test(u))
            .filter(u => !/(sprite|logo|icon|favicon|placeholder|default)/i.test(u))
          return { images: cleaned, canonical: canon ? makeAbs(canon[1], base) : null }
        }

        const aggregators = ['news.google.com','apple.news','flipboard.com','news.yahoo.com','t.co','feedburner.com','feedproxy.google.com']
        const startUrl = targetUrl
        const startHtml = await fetchHtml(startUrl)
        if (!startHtml) {
          // If we couldn't fetch the page (CORS, network), still try Openverse as a last resort
          try {
            const title = (article?.title || '').replace(/\s+/g, ' ').trim()
            const host = (() => { try { return new URL(targetUrl || '').hostname.replace(/^www\./,'') } catch { return '' } })()
            const q = [title, host].filter(Boolean).join(' ')
            const ovUrl = `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(q)}&page_size=8&categories=photograph`
            const resp = await fetch(ovUrl)
            if (resp.ok) {
              const data = await resp.json()
              const pick = (data?.results || [])
                .filter(x => x && (x.url || x.thumbnail))
                .filter(x => (x.width || 0) >= 800 || (x.height || 0) >= 600)
                .find(Boolean)
              if (pick) {
                setResolvedImage(pick.url || pick.thumbnail)
                setImageCredit({ provider: 'Openverse', creator: pick.creator, license: pick.license, url: pick.foreign_landing_url || pick.url })
              }
            }
          } catch {}
          return
        }
        const { images: firstBatch, canonical } = extractCandidates(startHtml, startUrl)
        let all = firstBatch

        if (canonical) {
          try {
            const startHost = new URL(startUrl).hostname.replace(/^www\./,'')
            const canonHost = new URL(canonical).hostname.replace(/^www\./,'')
            if (canonHost !== startHost || aggregators.includes(startHost)) {
              const canonHtml = await fetchHtml(canonical)
              if (canonHtml) {
                const { images: secondBatch } = extractCandidates(canonHtml, canonical)
                all = [...all, ...secondBatch]
              }
            }
          } catch {}
        }

        // Pick first viable
        const found = all.find(Boolean)
        if (found) {
          setResolvedImage(found)
        } else {
          // Openverse fallback (no key). Try to find a topical photograph.
          try {
            const title = (article?.title || '').replace(/\s+/g, ' ').trim()
            const host = (() => { try { return new URL(article?.url || '').hostname.replace(/^www\./,'') } catch { return '' } })()
            const q = [title, host].filter(Boolean).join(' ')
            const ovUrl = `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(q)}&page_size=8&categories=photograph`
            const resp = await fetch(ovUrl)
            if (resp.ok) {
              const data = await resp.json()
              const pick = (data?.results || [])
                .filter(x => x && (x.url || x.thumbnail))
                .filter(x => (x.width || 0) >= 800 || (x.height || 0) >= 600)
                .find(Boolean)
              if (pick) {
                setResolvedImage(pick.url || pick.thumbnail)
                setImageCredit({ provider: 'Openverse', creator: pick.creator, license: pick.license, url: pick.foreign_landing_url || pick.url })
              }
            }
          } catch {}
        }
      } catch (e) {
        console.log('resolve image failed:', e)
      } finally {
        setResolvingImage(false)
      }
    }

    fetchHtmlAndExtract()
  }, [article])


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
  const handleBiasVote = (vote) => {
    const articleId = article.url || article.title
    setBiasVotes(prev => {
      let { biased, nonBiased, myVote } = prev || { biased: 0, nonBiased: 0, myVote: null }
      if (myVote === vote) return prev
      if (myVote === 'biased') biased = Math.max(0, biased - 1)
      if (myVote === 'nonBiased') nonBiased = Math.max(0, nonBiased - 1)
      if (vote === 'biased') biased += 1; else nonBiased += 1
      const updated = { biased, nonBiased, myVote: vote }
      try {
        localStorage.setItem(`newsly_bias_votes_${btoa(articleId)}`,
          JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const totalBiasVotes = (biasVotes?.biased || 0) + (biasVotes?.nonBiased || 0)

  const analyzeBias = async () => {
    if (biasAnalysis && !showBiasAnalysis) {
      setShowBiasAnalysis(true)
      return
    }

    if (biasAnalysis && showBiasAnalysis) {
      setShowBiasAnalysis(false)
      return
    }

    setAnalyzingBias(true)

    try {
      const title = (article.title || '').toLowerCase()
      const description = (article.description || '').toLowerCase()
      const textToAnalyze = `${title}\n\n${description}`

      const enhanced = JSON.parse(localStorage.getItem('newsly_enhanced_bias') || 'false')

      // Base keyword buckets
      const biasKeywords = {
        political: ['liberal', 'conservative', 'left-wing', 'right-wing'],
        emotional: ['shocking', 'outrageous', 'devastating', 'incredible'],
        sensational: ['breaking', 'exclusive', 'bombshell', 'scandal'],
        opinion: ['should', 'must', 'obviously', 'clearly']
      }

      let biasScore = 0
      let detectedBias = []

      if (enhanced) {
        // Enhanced heuristic with weights and extras
        const buckets = {
          political: { words: biasKeywords.political, w: 12 },
          emotional: { words: biasKeywords.emotional, w: 10 },
          sensational: { words: biasKeywords.sensational, w: 10 },
          opinion: { words: biasKeywords.opinion, w: 8 }
        }
        const addMatches = (type, keyword, count) => {
          if (!count) return
          const entry = detectedBias.find(d => d.type === type)
          if (entry) {
            entry.matches.push(keyword)
          } else {
            detectedBias.push({ type, matches: [keyword] })
          }
        }
        Object.entries(buckets).forEach(([type, { words, w }]) => {
          words.forEach(word => {
            const re = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g')
            const matches = (textToAnalyze.match(re) || []).length
            if (matches > 0) {
              biasScore += matches * w
              // extra weight if in title
              if (title.includes(word)) biasScore += w
              addMatches(type, word, matches)
            }
          })
        })
        // Dampeners and amplifiers
        const hedges = ['allegedly', 'reportedly', 'according to', 'claims']
        hedges.forEach(h => { if (textToAnalyze.includes(h)) biasScore -= 5 })
        const exclamations = (textToAnalyze.match(/!/g) || []).length
        biasScore += Math.min(exclamations, 3) * 3
      } else {
        // Original lightweight heuristic
        Object.entries(biasKeywords).forEach(([type, keywords]) => {
          const matches = keywords.filter(keyword => textToAnalyze.includes(keyword))
          if (matches.length > 0) {
            biasScore += matches.length * 15
            detectedBias.push({ type, matches })
          }
        })
      }

      const percentage = Math.max(0, Math.min(biasScore, 100))

      setBiasAnalysis({
        biasPercentage: percentage,
        biasLevel: percentage < 20 ? 'Low' : percentage < 50 ? 'Medium' : 'High',
        detectedBias,
        analysis: `This article shows ${percentage}% bias indicators.${enhanced ? ' (enhanced)' : ''}`
      })
      setShowBiasAnalysis(true)

    } catch (error) {
      console.error('Bias analysis failed:', error)
    } finally {
      setAnalyzingBias(false)
    }
  }

  const displayContent = showOriginal ? article : (translatedContent || article)

  // Web-only image proxy for better hotlink reliability
  const isNative = Capacitor.isNativePlatform()
  const finalImageSrc = (() => {
    const src = resolvedImage || article.urlToImage
    if (!src) return null
    if (isNative) return src
    // Avoid double-proxying, only proxy http(s) images
    if (/^https?:\/\//i.test(src)) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=1200&h=800&fit=cover&a=attention`
    }
    return src
  })()

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
        touchAction: 'pan-y',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {(finalImageSrc && !/flagcdn\.com\/w320\//i.test(finalImageSrc) && !imageError) ? (
          <img
            src={finalImageSrc}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 animate-pulse"></div>
        )}
        {/* Image shimmer overlay while loading/resolving */}
        {(imageLoading || resolvingImage) && (
          <div className="absolute inset-0 animate-pulse bg-gray-200/30 dark:bg-gray-700/30"></div>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Top Bar with Logo and Actions */}
      <div className="relative z-10 flex items-center justify-between p-4">
        {/* Newsly Logo */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg">
        {/* Image attribution overlay */}
        {imageCredit && (
          <div className="absolute bottom-2 right-2 text-[10px] md:text-xs text-white/90 drop-shadow-sm">
            Image: {imageCredit.provider}
            {imageCredit.creator ? ` • ${imageCredit.creator}` : ''}
            {imageCredit.license ? ` • ${String(imageCredit.license).toUpperCase()}` : ''}
          </div>
        )}

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
        <div className="flex-1 overflow-y-auto p-6">
        {/* Source and Time */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 gap-2">
          <span className="font-medium">{article.source?.name || 'Unknown'}</span>
          <span className="mx-1">·</span>
          <span>{formatTimeAgo(article.publishedAt)}</span>
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
                <button onClick={() => handleBiasVote('nonBiased')} className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${biasVotes.myVote === 'nonBiased' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  Non-biased
                </button>
                <button onClick={() => handleBiasVote('biased')} className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${biasVotes.myVote === 'biased' ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  Biased
                </button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Community bias</span>
                  <span>{computeBiasPct(biasVotes.biased, biasVotes.nonBiased) !== null ? `${computeBiasPct(biasVotes.biased, biasVotes.nonBiased)}% biased` : 'No votes yet'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-red-500" style={{ width: `${computeBiasPct(biasVotes.biased, biasVotes.nonBiased) ?? 0}%` }}></div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Based on {(Number(biasVotes.biased || 0) + Number(biasVotes.nonBiased || 0))} vote{(Number(biasVotes.biased || 0) + Number(biasVotes.nonBiased || 0)) === 1 ? '' : 's'}.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </article>
  )
}

export default NewsCard
