import { XMLParser } from 'fast-xml-parser'
import countryLanguage from 'country-language'
import countryList from 'react-select-country-list'

// Mock API for development - fetches Google News RSS feeds directly from frontend
export const fetchGoogleNews = async (categories, country = 'global') => {
  console.log('🌍 fetchGoogleNews called with:', { categories, country })
  
  const getCategoryUrlsForCountry = (country) => {
    // Dynamic country parameter generation using library
    let countryParam
    
    if (country === 'global') {
      countryParam = 'hl=en-US&gl=US&ceid=US:en'
    } else {
      try {
        // Get primary language for the country
        const languages = countryLanguage.getCountryLanguages(country.toUpperCase())
        const primaryLang = languages && languages[0] ? languages[0] : null
        
        const upperCountry = country.toUpperCase()
        
        if (primaryLang && primaryLang.iso639_1) {
          // Use the primary language of the country
          const langCode = `${primaryLang.iso639_1}-${upperCountry}`
          countryParam = `hl=${langCode}&gl=${upperCountry}&ceid=${upperCountry}:${primaryLang.iso639_1}`
        } else {
          // Fallback to English for that country
          countryParam = `hl=en-${upperCountry}&gl=${upperCountry}&ceid=${upperCountry}:en`
        }
      } catch (error) {
        console.log(`Language lookup failed for ${country}, using English fallback`)
        const upperCountry = country.toUpperCase()
        countryParam = `hl=en-${upperCountry}&gl=${upperCountry}&ceid=${upperCountry}:en`
      }
    }
    
    return {
      'technology': `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?${countryParam}`,
      'business': `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?${countryParam}`,
      'sports': `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?${countryParam}`,
      'science': `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y0RvU0FtVnVHZ0pWVXlnQVAB?${countryParam}`,
      'health': `https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?${countryParam}`,
      'entertainment': `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?${countryParam}`,
      'general': `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?${countryParam}`
    }
  }

  const categoryUrls = getCategoryUrlsForCountry(country)
  const allArticles = []

  for (const category of categories) {
    try {
      const url = categoryUrls[category] || categoryUrls['general']
      console.log(`Fetching ${category} news from Google News for ${country}...`)
      console.log('URL:', url)
      
      // Try multiple CORS proxies sequentially until one works
      const proxyBuilders = [
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        // AllOrigins raw (simpler than JSON wrapper)
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
      ]

      let xmlContent = null
      let lastError = null
      for (const build of proxyBuilders) {
        const proxied = build(url)
        try {
          const resp = await fetch(proxied, { cache: 'no-store' })
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const ct = resp.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            // Some proxies still return JSON; handle both
            const data = await resp.json()
            xmlContent = data.contents || data
          } else {
            xmlContent = await resp.text()
          }
          if (xmlContent) break
        } catch (e) {
          lastError = e
          console.warn(`Proxy failed ${proxied}:`, e?.message || e)
        }
      }

      if (xmlContent) {
        const articles = parseGoogleNewsXML(xmlContent, category, country)
        console.log(`Found ${articles.length} articles for ${category} in ${country}`)
        allArticles.push(...articles)
      } else {
        console.error(`All proxies failed for ${category} (${country}). Last error:`, lastError?.message || lastError)
      }
    } catch (error) {
      console.error(`Error fetching ${category} for ${country}:`, error)
    }
  }

  console.log(`Total articles fetched for ${country}:`, allArticles.length)
  return { articles: allArticles }
}

// Extract actual images from Google News RSS or use country flag dynamically
const getNewsImage = (description, country, category, title, item) => {
  // 1) Check common RSS media fields first (more reliable than parsing HTML)
  try {
    const candidates = []
    const pushFrom = (entry) => {
      if (!entry) return
      const arr = Array.isArray(entry) ? entry : [entry]
      arr.forEach(e => {
        const url = e?.['@_url'] || e?.url
        const type = e?.['@_type'] || e?.type || ''
        if (url && (!type || String(type).startsWith('image/'))) {
          candidates.push(String(url))
        }
      })
    }
    pushFrom(item?.['media:content'])
    pushFrom(item?.['media:thumbnail'])
    pushFrom(item?.enclosure)

    for (const u of candidates) {
      const cleaned = u.replace(/&amp;/g, '&')
      if (
        /\.(jpg|jpeg|png|gif|webp|avif)(?:[?#].*)?$/i.test(cleaned) ||
        cleaned.startsWith('https://lh3.googleusercontent.com') ||
        cleaned.startsWith('https://encrypted-tbn')
      ) {
        return cleaned
      }
    }
  } catch {}

  // 2) Fallback: extract from HTML in description
  const imagePatterns = [
    /<img[^>]+src="(https:\/\/lh3\.googleusercontent\.com[^"]+)"/i,
    /<img[^>]+src="(https:\/\/encrypted-tbn[^"]+)"/i,
    /<img[^>]+src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
    /src="([^"]*\.(?:jpg|jpeg|png|gif|webp|avif)[^"]*)"/i
  ]

  for (const pattern of imagePatterns) {
    const match = description?.match(pattern)
    if (match && match[1]) {
      let imageUrl = match[1].replace(/&amp;/g, '&')
      if (
        !imageUrl.includes('1x1') &&
        !imageUrl.includes('16x16') &&
        !imageUrl.includes('favicon') &&
        imageUrl.length > 50
      ) {
        return imageUrl
      }
    }
  }

  // 3) Country flag fallback
  if (country === 'global') {
    return 'https://flagcdn.com/w320/un.png'
  }

  const countries = countryList().getData()
  const countryData = countries.find(c => c.value.toLowerCase() === country.toLowerCase())
  if (countryData) {
    return `https://flagcdn.com/w320/${countryData.value.toLowerCase()}.png`
  }

  return 'https://flagcdn.com/w320/un.png'
}

export const parseGoogleNewsXML = (xmlText, category, country = 'global') => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  })

  try {
    const result = parser.parse(xmlText)
    const items = result.rss?.channel?.item || []
    
    const articles = items.map((item) => {
      let title = item.title || ''
      if (typeof title === 'object' && title['#text']) {
        title = title['#text']
      }
      
      let description = item.description || ''
      if (typeof description === 'object' && description['#text']) {
        description = description['#text']
      }
      
      // Try to extract original article URL from description's first anchor
      const linkMatch = description && description.match(/<a[^>]+href="([^"]+)"/i)
      const originalUrl = linkMatch && linkMatch[1] ? linkMatch[1].replace(/&amp;/g, '&') : null

      let cleanDescription = (description || '')
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim()

      const imageUrl = getNewsImage(description, country, category, title, item)

      const sentences = cleanDescription.split(/[.!?]+/).filter(s => s.trim().length > 20)
      let summary = sentences.slice(0, 3).join('. ').trim()
      if (summary && !summary.endsWith('.')) summary += '.'
      
      if (!summary || summary.length < 80) {
        summary = cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? '...' : '')
      }

      if (!title || title.includes('[Removed]') || !summary || summary.length < 50) {
        return null
      }

      return {
        title: title,
        description: summary,
        url: item.link || item.guid || '',
        urlToImage: imageUrl,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        source: {
          name: item.source?.['#text'] || item.source || 'Google News'
        },
        category: category,
        author: item['dc:creator'] || null,
        originalUrl
      }
    })

    return articles.filter(Boolean).slice(0, 10)
  } catch (error) {
    console.error('Error parsing XML:', error)
    return []
  }
}


