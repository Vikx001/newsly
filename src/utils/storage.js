// Genre storage
export const getStoredGenres = () => {
  try {
    const stored = localStorage.getItem('newsly_genres')
    return stored ? JSON.parse(stored) : ['technology', 'business', 'sports']
  } catch {
    return ['technology', 'business', 'sports']
  }
}

export const setStoredGenres = (genres) => {
  localStorage.setItem('newsly_genres', JSON.stringify(genres))
}

// Country storage
export const getStoredCountry = () => {
  return localStorage.getItem('newsly_country') || 'global'
}

export const setStoredCountry = (countryCode) => {
  localStorage.setItem('newsly_country', countryCode)
}

// Bookmark storage
export const getStoredBookmarks = () => {
  try {
    const stored = localStorage.getItem('newsly_bookmarks')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const setStoredBookmarks = (bookmarks) => {
  localStorage.setItem('newsly_bookmarks', JSON.stringify(bookmarks))
}

export const addBookmark = (article) => {
  const bookmarks = getStoredBookmarks()
  const exists = bookmarks.find(b => b.url === article.url)
  if (!exists) {
    bookmarks.push(article)
    setStoredBookmarks(bookmarks)
  }
}

export const removeBookmark = (articleUrl) => {
  const bookmarks = getStoredBookmarks()
  const filtered = bookmarks.filter(b => b.url !== articleUrl)
  setStoredBookmarks(filtered)
}

export const isBookmarked = (articleUrl) => {
  const bookmarks = getStoredBookmarks()
  return bookmarks.some(b => b.url === articleUrl)
}
