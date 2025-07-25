import { XMLParser } from 'fast-xml-parser'

// Mock API for development - fetches Google News RSS feeds directly from frontend
export const fetchGoogleNews = async (categories) => {
  const categoryUrls = {
    'technology': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    'general': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    'business': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    'sports': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    'science': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y0RvU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    'health': 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en',
    'entertainment': 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    'politics': 'https://news.google.com/rss/search?q=politics&hl=en-US&gl=US&ceid=US:en'
  }

  const allArticles = []

  for (const category of categories) {
    try {
      const url = categoryUrls[category] || categoryUrls['general']
      console.log(`Fetching ${category} news from Google News...`)
      
      // Use a CORS proxy for development
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      
      const response = await fetch(proxyUrl)
      const data = await response.json()
      
      if (data.contents) {
        const articles = parseGoogleNewsXML(data.contents, category)
        console.log(`Found ${articles.length} articles for ${category}`)
        allArticles.push(...articles)
      }
    } catch (error) {
      console.error(`Error fetching ${category}:`, error)
    }
  }

  console.log(`Total articles fetched: ${allArticles.length}`)
  return {
    articles: allArticles, // No limit
    total: allArticles.length
  }
}

export const parseGoogleNewsXML = (xmlText, category) => {
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
    
    const articles = items.map(item => {
      // Extract title
      let title = item.title || ''
      if (typeof title === 'object' && title['#text']) {
        title = title['#text']
      }
      
      // Extract description
      let description = item.description || ''
      if (typeof description === 'object' && description['#text']) {
        description = description['#text']
      }
      
      // Clean description - remove HTML tags and decode entities
      let cleanDescription = description
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim()

      // Extract image from description HTML with comprehensive patterns
      let imageUrl = null

      // Try to extract from Google News specific patterns first
      const googleNewsImgPatterns = [
        // Google News specific image patterns
        /<img[^>]+src="(https:\/\/lh3\.googleusercontent\.com[^"]+)"/i,
        /<img[^>]+src="(https:\/\/encrypted-tbn[^"]+)"/i,
        // Standard image patterns
        /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|gif|webp)[^"]*)"/i,
        /<img[^>]+src='([^']+\.(?:jpg|jpeg|png|gif|webp)[^']*)'/i,
        // Any image source
        /<img[^>]*src=["']([^"']+)["'][^>]*>/i,
        // Background image patterns
        /background-image:\s*url\(["']?([^"')]+)["']?\)/i
      ]

      for (const pattern of googleNewsImgPatterns) {
        const match = description.match(pattern)
        if (match && match[1]) {
          let url = match[1]
          // Clean up the URL
          url = url.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
          
          // Skip tiny images and icons
          if (!url.includes('1x1') && 
              !url.includes('16x16') && 
              !url.includes('32x32') && 
              !url.includes('favicon') &&
              !url.includes('logo') &&
              url.length > 20) {
            imageUrl = url
            break
          }
        }
      }

      // If no image found, try to fetch from article URL using a service
      if (!imageUrl && (item.link || item.guid)) {
        // Use a meta tag extraction service for better images
        const articleUrl = item.link || item.guid
        try {
          // Use a free meta tag extraction service
          imageUrl = `https://api.microlink.io/?url=${encodeURIComponent(articleUrl)}&screenshot=true&meta=false&embed=screenshot.url`
        } catch (e) {
          // Fallback to another service
          imageUrl = `https://image.thum.io/get/width/400/crop/600/${encodeURIComponent(articleUrl)}`
        }
      }

      // Create a proper summary
      const sentences = cleanDescription.split(/[.!?]+/).filter(s => s.trim().length > 20)
      let summary = sentences.slice(0, 3).join('. ').trim()
      if (summary && !summary.endsWith('.')) summary += '.'
      
      // Fallback if no good summary
      if (!summary || summary.length < 80) {
        summary = cleanDescription.substring(0, 200) + (cleanDescription.length > 200 ? '...' : '')
      }

      // Skip articles with poor content
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
    }).filter(Boolean) // Remove null entries

    return articles.slice(0, 10) // Limit per category
  } catch (error) {
    console.error('Error parsing XML:', error)
    return []
  }
}

// Improve image extraction with multiple fallback strategies
const getArticleImage = async (articleUrl, title) => {
  try {
    // Try to extract image from Google News URL structure
    const googleImageMatch = articleUrl.match(/imgurl=([^&]+)/)
    if (googleImageMatch) {
      return decodeURIComponent(googleImageMatch[1])
    }
    
    // Fallback: Generate a placeholder based on category
    const category = getCurrentCategory() // You'll need to pass this
    const placeholders = {
      technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      business: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
      science: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=300&fit=crop',
      health: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      entertainment: 'https://images.unsplash.com/photo-1489599904472-84b0e19e8b0b?w=400&h=300&fit=crop',
      general: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop'
    }
    
    return placeholders[category] || placeholders.general
  } catch (error) {
    console.log('Image extraction failed:', error)
    return null
  }
}
