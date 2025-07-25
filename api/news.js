export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { categories, source = 'google' } = req.query
    console.log('API called with categories:', categories, 'source:', source)
    
    if (!categories) {
      res.status(400).json({ error: 'Categories parameter is required' })
      return
    }

    const categoryList = categories.split(',')
    let allArticles = []

    // Always use Google News for now since it's free
    console.log('Fetching from Google News for categories:', categoryList)
    allArticles = await fetchFromGoogleNews(categoryList)
    console.log('Total articles fetched:', allArticles.length)

    // Remove duplicates and filter articles - no limit here
    const uniqueArticles = allArticles
      .filter((article, index, self) => 
        index === self.findIndex(a => a.url === article.url)
      )
      .filter(article => 
        article.title && 
        article.description &&
        !article.title.includes('[Removed]')
      )
    // Remove any slice() limit here too

    console.log('Unique articles after filtering:', uniqueArticles.length)

    res.status(200).json({
      articles: uniqueArticles, // No limit
      total: uniqueArticles.length,
      source: 'google'
    })

  } catch (error) {
    console.error('News API Error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch news',
      message: error.message 
    })
  }
}

async function fetchFromGoogleNews(categoryList) {
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

  const promises = categoryList.map(async (category) => {
    const url = categoryUrls[category] || categoryUrls['general']
    console.log(`Fetching ${category} from:`, url)
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
        }
      })
      
      if (!response.ok) {
        console.error(`HTTP ${response.status} for ${category}`)
        throw new Error(`Failed to fetch ${category} news from Google`)
      }
      
      const xmlText = await response.text()
      console.log(`XML length for ${category}:`, xmlText.length)
      const articles = await parseGoogleNewsXML(xmlText, category) // Add await here
      console.log(`Parsed ${articles.length} articles for ${category}`)
      return articles
    } catch (error) {
      console.error(`Error fetching Google News for ${category}:`, error)
      return []
    }
  })

  const results = await Promise.all(promises)
  const allArticles = results.flat()
}

async function parseGoogleNewsXML(xmlText, category) {
  const articles = []
  
  // Parse RSS items
  const itemRegex = /<item>(.*?)<\/item>/gs
  const items = xmlText.match(itemRegex) || []
  
  for (const item of items) {
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                     item.match(/<title>(.*?)<\/title>/)
    const linkMatch = item.match(/<link>(.*?)<\/link>/)
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                     item.match(/<description>(.*?)<\/description>/)
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
    
    if (titleMatch && linkMatch) {
      const title = titleMatch[1]
      const description = descMatch ? descMatch[1] : ''
      
      // Get image using meta tag extraction
      let imageUrl = null
      if (linkMatch[1]) {
        imageUrl = await getArticleImage(linkMatch[1], titleMatch[1])
      }

      // Clean description and remove HTML
      const cleanDesc = description.replace(/<[^>]*>/g, '').trim()
      
      // Skip if title contains unwanted content
      if (title.includes('[Removed]') || title.includes('...')) continue
      
      articles.push({
        title: title,
        description: cleanDesc.substring(0, 150) + (cleanDesc.length > 150 ? '...' : ''),
        url: linkMatch[1],
        urlToImage: imageUrl,
        publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        source: { name: 'Google News' },
        category: category
      })
    }
  }
  
  return articles
}
