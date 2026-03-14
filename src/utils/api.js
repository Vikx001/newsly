import { CapacitorHttp } from '@capacitor/core'
import { fetchGoogleNews, getCategoryUrlsForCountry } from './mockApi.js'

// Enhanced image proxy function with multiple services
const getProxiedImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // For native platforms, try direct URL first
  // for all the platforms they have to see if it is working or not 
  if (window.Capacitor?.isNativePlatform()) {
    return imageUrl
  }
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
    
    return proxyServices[0] 
  } catch {
    return imageUrl
  }
}

export const fetchNews = async (categories, source = 'auto', country = 'global') => {
  try {
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
          const articles = parseGoogleNewsXML(response.data, category, country)
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

