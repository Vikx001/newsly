import React, { createContext, useContext, useState, useEffect } from 'react'
import { getStoredBookmarks, addBookmark as addBookmarkToStorage, removeBookmark as removeBookmarkFromStorage } from '../utils/storage'

const BookmarkContext = createContext()

export const useBookmarks = () => {
  const context = useContext(BookmarkContext)
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider')
  }
  return context
}

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    setBookmarks(getStoredBookmarks())
  }, [])

  const addBookmark = (article) => {
    const newBookmarks = addBookmarkToStorage(article)
    setBookmarks(newBookmarks)
  }

  const removeBookmark = (article) => {
    const newBookmarks = removeBookmarkFromStorage(article.url)
    setBookmarks(newBookmarks)
  }

  const isBookmarked = (articleUrl) => {
    return bookmarks.some(bookmark => bookmark.url === articleUrl)
  }

  return (
    <BookmarkContext.Provider value={{
      bookmarks,
      addBookmark,
      removeBookmark,
      isBookmarked
    }}>
      {children}
    </BookmarkContext.Provider>
  )
}