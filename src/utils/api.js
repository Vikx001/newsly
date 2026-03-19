import { CapacitorHttp } from '@capacitor/core'
import { fetchGoogleNews, getCategoryUrlsForCountry, getCountryParam, parseGoogleNewsXML } from './mockApi.js'

// Try the Vercel serverless endpoint first (avoids third-party CORS proxies in production).
// Falls back to the direct CORS-proxy chain when the endpoint is unreachable (e.g. plain Vite dev).
const fetchFromServerless = async (categories, country) => {
  const cp = getCountryParam(country)
  const url = `/api/news?categories=${encodeURIComponent(categories.join(','))}&countryParam=${encodeURIComponent(cp)}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Serverless API ${resp.status}`)
  return resp.json()
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
          const articles = parseGoogleNewsXML(response.data, category, country)
          allArticles.push(...articles)
        }
      }
      
      return { articles: allArticles }
    } else {
      // Web: try serverless endpoint first (production/vercel dev), fall back to CORS proxies
      try {
        return await fetchFromServerless(categories, country)
      } catch {
        return fetchGoogleNews(categories, country)
      }
    }
  } catch (error) {
    console.error('API Error:', error)
    throw new Error('Failed to fetch news. Please try again.')
  }
}

