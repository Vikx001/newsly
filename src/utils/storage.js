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

export const getStoredCountry = () => {

  return localStorage.getItem('newsly_country') || 'global'
}

export const setStoredCountry = (countryCode) => {
  localStorage.setItem('newsly_country', countryCode)
}

// Feed preferences
export const getStoredSortMode = () => localStorage.getItem('newsly_sort_mode') || 'personalized' // 'latest' | 'personalized'
export const setStoredSortMode = (mode) => localStorage.setItem('newsly_sort_mode', mode)

export const getHidePaywalled = () => JSON.parse(localStorage.getItem('newsly_hide_paywalled') || 'false')
export const setHidePaywalled = (val) => localStorage.setItem('newsly_hide_paywalled', JSON.stringify(!!val))

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
  return bookmarks
}

export const removeBookmark = (articleUrl) => {
  const bookmarks = getStoredBookmarks()
  const filtered = bookmarks.filter(b => b.url !== articleUrl)
  setStoredBookmarks(filtered)
  return filtered
}

export const isBookmarked = (articleUrl) => {
  const bookmarks = getStoredBookmarks()
  return bookmarks.some(b => b.url === articleUrl)
}
