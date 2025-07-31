import { CapacitorHttp } from '@capacitor/core'
import { fetchGoogleNews } from './mockApi.js'
import countryLanguage from 'country-language'

// Enhanced image proxy function with multiple services
const getProxiedImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // For native platforms, try direct URL first
  if (window.Capacitor?.isNativePlatform()) {
    return imageUrl
  }
  
  // For web, use multiple image proxy services
  try {
    const url = new URL(imageUrl)
    
    // Try different proxy services in order of reliability
    const proxyServices = [
      // Weserv (most reliable)
      `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=400&h=300&fit=cover&a=attention`,
      // ImageProxy
      `https://imageproxy.pimg.tw/resize?url=${encodeURIComponent(imageUrl)}&width=400&height=300`,
      // Statically
      `https://cdn.statically.io/img/${url.hostname}${url.pathname}?w=400&h=300&f=auto`,
      // Direct URL as last resort
      imageUrl
    ]
    
    return proxyServices[0] // Return the most reliable one
  } catch {
    return imageUrl
  }
}

export const fetchNews = async (categories, source = 'auto', country = 'global') => {
  try {
    console.log('🔍 Fetching news:', { categories, country })
    
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      const categoryUrls = getCategoryUrlsForCountry(country)
      
      const allArticles = []
      for (const category of categories) {
        const url = categoryUrls[category] || categoryUrls['general']
        
        const response = await CapacitorHttp.get({
          url: url,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
        })
        
        if (response.data) {
          const { parseGoogleNewsXML } = await import('./mockApi.js')
          const articles = parseGoogleNewsXML(response.data, category)
          allArticles.push(...articles)
        }
      }
      
      return { articles: allArticles }
    } else {
      const data = await fetchGoogleNews(categories, country)
      return data
    }
  } catch (error) {
    console.error('API Error:', error)
    throw new Error('Failed to fetch news. Please try again.')
  }
}

const getCategoryUrlsForCountry = (country) => {
  // Dynamic country parameter generation using library (same as mockApi.js)
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


