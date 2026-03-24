import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getStoredBookmarks, addBookmark as addBookmarkToStorage, removeBookmark as removeBookmarkFromStorage } from '../utils/storage'
import { useAuth } from './AuthContext'
import { api } from '../utils/apiClient'
import { hashKey } from '../utils/storage'

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
  const { user } = useAuth()

  // Load bookmarks — cloud if logged in, localStorage otherwise
  const loadBookmarks = useCallback(async () => {
    if (user) {
      try {
        const { bookmarks: cloud } = await api.get('/api/bookmarks')
        // Normalise cloud shape to match the local shape consumers expect
        const normalised = cloud.map(b => ({
          url: b.url,
          title: b.title,
          description: b.description,
          category: b.category,
          source: b.source ? { name: b.source } : null,
          publishedAt: b.published_at,
          urlToImage: b.image_url,
          _hash: b.article_hash,
        }))
        setBookmarks(normalised)
        return
      } catch {
        // fall through to localStorage on error
      }
    }
    setBookmarks(getStoredBookmarks())
  }, [user])

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const addBookmark = async (article) => {
    if (user) {
      try {
        const articleHash = hashKey(article.url || article.title || '')
        await api.post('/api/bookmarks', {
          articleHash,
          url: article.url,
          title: article.title,
          description: article.description,
          category: article.category,
          source: article.source?.name || article.source || null,
          publishedAt: article.publishedAt,
          imageUrl: article.urlToImage,
        })
        setBookmarks(prev => [{ ...article, _hash: articleHash }, ...prev])
        return
      } catch {
        // fall through to localStorage
      }
    }
    const newBookmarks = addBookmarkToStorage(article)
    setBookmarks(newBookmarks)
  }

  const removeBookmark = async (article) => {
    if (user) {
      try {
        const articleHash = article._hash || hashKey(article.url || article.title || '')
        await api.delete('/api/bookmarks', { articleHash })
        setBookmarks(prev => prev.filter(b => b.url !== article.url))
        return
      } catch {
        // fall through to localStorage
      }
    }
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
      isBookmarked,
    }}>
      {children}
    </BookmarkContext.Provider>
  )
}