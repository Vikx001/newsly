import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, User, X, Check } from 'lucide-react'
import { hashKey } from '../utils/storage'

const MAX_COMMENT_LENGTH = 500

const CommentsCard = ({ article, onClose }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [userName, setUserName] = useState('')
  const [likedComments, setLikedComments] = useState(new Set())

  // Inline name-prompt state (replaces window.prompt)
  const [askingName, setAskingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const nameInputRef = useRef(null)

  const articleKey = hashKey(article.url || article.title || '')

  useEffect(() => {
    const savedComments = localStorage.getItem(`newsly_comments_${articleKey}`)
    if (savedComments) {
      try { setComments(JSON.parse(savedComments)) } catch {}
    }

    const savedName = localStorage.getItem('newsly_user_name')
    if (savedName) setUserName(savedName)

    try {
      const likedRaw = localStorage.getItem(`newsly_liked_${articleKey}`)
      if (likedRaw) setLikedComments(new Set(JSON.parse(likedRaw)))
    } catch {}
  }, [articleKey])

  // Auto-focus name input when it appears
  useEffect(() => {
    if (askingName) nameInputRef.current?.focus()
  }, [askingName])

  const saveComments = (updated) => {
    localStorage.setItem(`newsly_comments_${articleKey}`, JSON.stringify(updated))
    setComments(updated)
  }

  const submitComment = (text, author) => {
    const comment = {
      id: Date.now(),
      text: text.trim().slice(0, MAX_COMMENT_LENGTH),
      author,
      timestamp: new Date().toISOString(),
      likes: 0
    }
    saveComments([comment, ...comments])
    setNewComment('')
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    if (!userName) {
      setAskingName(true)
      return
    }
    submitComment(newComment, userName)
  }

  const handleNameConfirm = () => {
    const finalName = nameInput.trim().slice(0, 30) || 'Anonymous'
    setUserName(finalName)
    localStorage.setItem('newsly_user_name', finalName)
    setAskingName(false)
    setNameInput('')
    if (newComment.trim()) submitComment(newComment, finalName)
  }

  const handleLikeComment = (commentId) => {
    if (likedComments.has(commentId)) return // each user can like only once
    const newLiked = new Set([...likedComments, commentId])
    setLikedComments(newLiked)
    try {
      localStorage.setItem(`newsly_liked_${articleKey}`, JSON.stringify([...newLiked]))
    } catch {}
    saveComments(comments.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c))
  }

  const formatTimeAgo = (dateString) => {
    const diffInHours = Math.floor((Date.now() - new Date(dateString)) / 3_600_000)
    if (diffInHours < 1) return 'now'
    if (diffInHours < 24) return `${diffInHours}h`
    return `${Math.floor(diffInHours / 24)}d`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Comments ({comments.length})
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{article.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {article.source?.name} · {formatTimeAgo(article.publishedAt)}
            </p>
          </div>
        </div>

        {/* Inline name prompt (replaces window.prompt) */}
        {askingName && (
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">What should we call you?</p>
            <div className="flex gap-2">
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.slice(0, 30))}
                placeholder="Your display name"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                maxLength={30}
              />
              <button
                onClick={handleNameConfirm}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => { setAskingName(false); setNameInput('') }}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Add Comment */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          {userName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Commenting as <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>
            </p>
          )}
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                  maxLength={MAX_COMMENT_LENGTH}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </div>
              {newComment.length > MAX_COMMENT_LENGTH * 0.8 && (
                <p className={`text-xs text-right ${newComment.length >= MAX_COMMENT_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                  {newComment.length}/{MAX_COMMENT_LENGTH}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <User size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No comments yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{comment.author}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">{comment.text}</p>
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        disabled={likedComments.has(comment.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          likedComments.has(comment.id)
                            ? 'text-blue-600 dark:text-blue-400 cursor-default'
                            : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        <span>{likedComments.has(comment.id) ? '👍' : '👍'}</span>
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                        <span className="ml-1">{likedComments.has(comment.id) ? 'Liked' : 'Like'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommentsCard
