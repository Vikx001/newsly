import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Send, User, X, Check, LogIn } from 'lucide-react'
import { hashKey } from '../utils/storage'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/apiClient'

const MAX_COMMENT_LENGTH = 500

const CommentsCard = ({ article, onClose, onAuthRequired }) => {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const articleHash = hashKey(article.url || article.title || '')

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        const { comments: cloud } = await api.get(`/api/comments?articleHash=${articleHash}`)
        setComments(cloud)
      } else {
        // Logged-out users see localStorage comments (legacy)
        const saved = localStorage.getItem(`newsly_comments_${articleHash}`)
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setComments(parsed.map((c, i) => ({
              id: c.id || i,
              displayName: c.author || 'Anonymous',
              text: c.text,
              timestamp: c.timestamp,
              likes: c.likes || 0,
              hasLiked: false,
              isOwnComment: false,
            })))
          } catch {}
        }
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }, [articleHash, user])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    if (!user) { onAuthRequired?.(); return }

    setSubmitting(true)
    try {
      const { comment } = await api.post('/api/comments', {
        articleHash,
        text: newComment.trim(),
        displayName: user.displayName || 'Newsly Reader',
      })
      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (err) {
      // Silent — user can retry
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId, hasLiked) => {
    if (!user) { onAuthRequired?.(); return }
    // Optimistic update
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, likes: hasLiked ? Math.max(0, c.likes - 1) : c.likes + 1, hasLiked: !hasLiked }
        : c
    ))
    try {
      await api.post('/api/comment-like', { commentId })
    } catch {
      // Revert on failure
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, likes: hasLiked ? c.likes + 1 : Math.max(0, c.likes - 1), hasLiked }
          : c
      ))
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments?id=${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {}
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

        {/* Add Comment — only for logged-in users */}
        {user ? (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Commenting as <span className="font-medium text-gray-700 dark:text-gray-300">{user.displayName || 'Newsly Reader'}</span>
            </p>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-white" />
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
                    disabled={submitting}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {submitting
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send size={18} />}
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
        ) : (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={() => onAuthRequired?.()}
              className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <LogIn size={16} /> Sign in to comment
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
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
                        <span className="font-medium text-gray-900 dark:text-gray-100">{comment.displayName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                        {comment.isOwnComment && (
                          <span className="text-xs bg-blue-500/15 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">you</span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">{comment.text}</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikeComment(comment.id, comment.hasLiked)}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            comment.hasLiked
                              ? 'text-blue-600 dark:text-blue-400 cursor-default'
                              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                        >
                          <span>👍</span>
                          {comment.likes > 0 && <span>{comment.likes}</span>}
                          <span className="ml-0.5">{comment.hasLiked ? 'Liked' : 'Like'}</span>
                        </button>
                        {comment.isOwnComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
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
