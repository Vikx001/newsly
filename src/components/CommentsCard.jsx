import React, { useState, useEffect } from 'react'
import { ArrowLeft, Send, User, X } from 'lucide-react'

const CommentsCard = ({ article, onClose }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Load comments for this article
    const articleId = article.url || article.title
    const savedComments = localStorage.getItem(`newsly_comments_${btoa(articleId)}`)
    if (savedComments) {
      setComments(JSON.parse(savedComments))
    }
    
    // Load user name
    const savedUserName = localStorage.getItem('newsly_user_name')
    if (savedUserName) {
      setUserName(savedUserName)
    }
  }, [article])

  const saveComments = (updatedComments) => {
    const articleId = article.url || article.title
    localStorage.setItem(`newsly_comments_${btoa(articleId)}`, JSON.stringify(updatedComments))
    setComments(updatedComments)
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    let currentUserName = userName
    if (!currentUserName) {
      currentUserName = prompt('Enter your name:') || 'Anonymous'
      setUserName(currentUserName)
      localStorage.setItem('newsly_user_name', currentUserName)
    }

    const comment = {
      id: Date.now(),
      text: newComment.trim(),
      author: currentUserName,
      timestamp: new Date().toISOString(),
      likes: 0
    }

    // Add new comment at the beginning as the data is chnaged by user 
    const updatedComments = [comment, ...comments]
    saveComments(updatedComments)
    setNewComment('')
  }

  const handleLikeComment = (commentId) => {
    const updatedComments = comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, likes: comment.likes + 1 }
        : comment
    )
    saveComments(updatedComments)
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'now'
    if (diffInHours < 24) return `${diffInHours}h`
    return `${Math.floor(diffInHours / 24)}d`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md h-[80vh] flex flex-col">
        {/* Header of the data change as well*/}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Comments ({comments.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Article Title of the data change Reference */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
              {article.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {article.source?.name} • {formatTimeAgo(article.publishedAt)}
            </p>
          </div>
        </div>

        {/* Add Comment - the newset comment is going to be on the top */}
        {/* we have to make sure thatg we have give the user option to change the comments as well */}
        {/* we have to make sure that as per the IP the user should be able to likr the comment only once*/}
        {/* Add Comment  */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                autoFocus
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Comments List - Scrollable by the user as well if they want to change the comments  */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <User size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No comments yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Be the first to share your thoughts on this article!
              </p>
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
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                        {comment.text}
                      </p>
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>👍</span>
                        {comment.likes > 0 && <span>{comment.likes}</span>}
                        <span className="ml-1">Like</span>
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
