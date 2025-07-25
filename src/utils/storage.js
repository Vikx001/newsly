const BOOKMARKS_KEY = 'newsly_bookmarks'
const GENRES_KEY = 'newsly_genres'

export const getStoredBookmarks = () => {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading bookmarks from storage:', error)
    return []
  }
}

export const addBookmark = (article) => {
  try {
    const bookmarks = getStoredBookmarks()
    const exists = bookmarks.find(bookmark => bookmark.url === article.url)
    
    if (!exists) {
      const newBookmarks = [...bookmarks, article]
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks))
      return newBookmarks
    }
    
    return bookmarks
  } catch (error) {
    console.error('Error adding bookmark:', error)
    return getStoredBookmarks()
  }
}

export const removeBookmark = (articleUrl) => {
  try {
    const bookmarks = getStoredBookmarks()
    const newBookmarks = bookmarks.filter(bookmark => bookmark.url !== articleUrl)
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks))
    return newBookmarks
  } catch (error) {
    console.error('Error removing bookmark:', error)
    return getStoredBookmarks()
  }
}

export const getStoredGenres = () => {
  try {
    const stored = localStorage.getItem(GENRES_KEY)
    return stored ? JSON.parse(stored) : ['technology', 'business', 'sports']
  } catch (error) {
    console.error('Error reading genres from storage:', error)
    return ['technology', 'business', 'sports']
  }
}

export const setStoredGenres = (genres) => {
  try {
    localStorage.setItem(GENRES_KEY, JSON.stringify(genres))
    return genres
  } catch (error) {
    console.error('Error saving genres to storage:', error)
    return getStoredGenres()
  }
}

export const isBookmarked = (articleUrl) => {
  try {
    const bookmarks = getStoredBookmarks()
    return bookmarks.some(bookmark => bookmark.url === articleUrl)
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return false
  }
}
