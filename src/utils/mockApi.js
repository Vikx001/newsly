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
      
      // Try multiple CORS proxies
      const corsProxies = [
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      ]

      let proxyIndex = 0
      const response = await fetch(corsProxies[proxyIndex](url), {
        timeout: 10000
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      let xmlContent
      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const data = await response.json()
        xmlContent = data.contents || data
      } else {
        xmlContent = await response.text()
      }

      if (xmlContent) {
        const articles = parseGoogleNewsXML(xmlContent, category, country)
        console.log(`Found ${articles.length} articles for ${category} in ${country}`)
        allArticles.push(...articles)
      }
    } catch (error) {
      console.error(`Error fetching ${category} for ${country}:`, error)
    }
  }

  console.log(`Total articles fetched for ${country}:`, allArticles.length)
  return { articles: allArticles }
}

// Extract actual images from Google News RSS or use country flag dynamically
const getNewsImage = (description, country, category, title) => {
  // First try to extract real images from Google News description
  const imagePatterns = [
    // Google News specific image patterns
    /<img[^>]+src="(https:\/\/lh3\.googleusercontent\.com[^"]+)"/i,
    /<img[^>]+src="(https:\/\/encrypted-tbn[^"]+)"/i,
    /<img[^>]+src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
    // Any image in description
    /src="([^"]*\.(?:jpg|jpeg|png|gif|webp|avif)[^"]*)"/i
  ]

  for (const pattern of imagePatterns) {
    const match = description.match(pattern)
    if (match && match[1]) {
      let imageUrl = match[1].replace(/&amp;/g, '&')
      // Skip tiny images and icons
      if (!imageUrl.includes('1x1') && 
          !imageUrl.includes('16x16') && 
          !imageUrl.includes('favicon') &&
          imageUrl.length > 50) {
        console.log('✅ Found real news image:', imageUrl)
        return imageUrl
      }
    }
  }

  // Fallback: Use country flag dynamically
  if (country === 'global') {
    console.log('🌍 Using global/UN flag as fallback')
    return 'https://flagcdn.com/w320/un.png'
  }

  // Get country code from react-select-country-list
  const countries = countryList().getData()
  const countryData = countries.find(c => c.value.toLowerCase() === country.toLowerCase())
  
  if (countryData) {
    const flagUrl = `https://flagcdn.com/w320/${countryData.value.toLowerCase()}.png`
    console.log(`🏳️ Using ${countryData.label} flag as fallback:`, flagUrl)
    return flagUrl
  }

  // Ultimate fallback
  console.log('⚠️ Country not found, using global flag')
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
    
    const articles = items.map((item, index) => {
      let title = item.title || ''
      if (typeof title === 'object' && title['#text']) {
        title = title['#text']
      }
      
      let description = item.description || ''
      if (typeof description === 'object' && description['#text']) {
        description = description['#text']
      }
      
      let cleanDescription = description
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim()

      // Get real news image or country flag dynamically
      const imageUrl = getNewsImage(description, country, category, title)

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
        author: item['dc:creator'] || null
      }
    })

    return articles.filter(Boolean).slice(0, 10)
  } catch (error) {
    console.error('Error parsing XML:', error)
    return []
  }
}


