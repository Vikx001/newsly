import { CapacitorHttp } from '@capacitor/core'
import { fetchGoogleNews } from './mockApi.js'

// Add image proxy function for better image loading
const getProxiedImageUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // For native platforms, try direct URL first
  if (window.Capacitor?.isNativePlatform()) {
    return imageUrl
  }
  
  // For web, use image proxy to handle CORS
  try {
    const url = new URL(imageUrl)
    // Use a more reliable image proxy
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=400&h=300&fit=cover&a=attention`
  } catch {
    return imageUrl
  }
}

export const fetchNews = async (categories, source = 'auto') => {
  try {
    console.log('🔍 Fetching news with categories:', categories)
    
    // Use Capacitor HTTP for native platforms
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      console.log(' Using Capacitor HTTP (native)')
      
      // Use Google News RSS directly on native
      const categoryUrls = {
        'technology': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
        'general': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
        'business': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
        'sports': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en'
      }
      
      const allArticles = []
      
      for (const category of categories) {
        const url = categoryUrls[category] || categoryUrls['general']
        
        const response = await CapacitorHttp.get({
          url: url,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
          }
        })
        
        if (response.data) {
          const { parseGoogleNewsXML } = await import('./mockApi.js')
          const articles = parseGoogleNewsXML(response.data, category)
          allArticles.push(...articles)
        }
      }
      
      return { articles: allArticles }
    } else {
      console.log(' Using mock API (web)')
      const data = await fetchGoogleNews(categories)
      return data
    }
  } catch (error) {
    console.error(' API Error details:', error)
    throw new Error('Failed to fetch news. Please try again.')
  }
}


