/**
 * GET  /api/comments?articleHash=<hash>   — fetch all comments for an article
 * POST /api/comments                       — add a comment
 * DELETE /api/comments?id=<commentId>      — delete your own comment
 */

import { supabaseAdmin, requireAuth, setCors } from './_supabase.js'

const MAX_COMMENT_LENGTH = 500

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { articleHash } = req.query
    if (!articleHash) return res.status(400).json({ error: 'articleHash query param required' })

    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(`
        id, article_hash, user_id, display_name, text, created_at,
        comment_likes ( count )
      `)
      .eq('article_hash', String(articleHash).slice(0, 64))
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return res.status(500).json({ error: 'Failed to fetch comments' })

    // Gather which comments the current user has liked
    const commentIds = data.map(c => c.id)
    let likedSet = new Set()
    if (commentIds.length > 0) {
      const { data: likes } = await supabaseAdmin
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds)
      if (likes) likes.forEach(l => likedSet.add(l.comment_id))
    }

    return res.status(200).json({
      comments: data.map(c => ({
        id: c.id,
        articleHash: c.article_hash,
        userId: c.user_id,
        displayName: c.display_name,
        text: c.text,
        timestamp: c.created_at,
        likes: c.comment_likes?.[0]?.count ?? 0,
        isOwnComment: c.user_id === user.id,
        hasLiked: likedSet.has(c.id),
      })),
    })
  }

  if (req.method === 'POST') {
    const { articleHash, text, displayName } = req.body || {}
    if (!articleHash || !text) return res.status(400).json({ error: 'articleHash and text are required' })

    const safeText = String(text).trim().slice(0, MAX_COMMENT_LENGTH)
    const safeDisplayName = String(displayName || 'Anonymous').trim().slice(0, 30)

    if (!safeText) return res.status(400).json({ error: 'Comment text cannot be empty' })

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        article_hash: String(articleHash).slice(0, 64),
        user_id: user.id,
        display_name: safeDisplayName,
        text: safeText,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'Failed to post comment' })

    return res.status(201).json({
      comment: {
        id: data.id,
        articleHash: data.article_hash,
        userId: data.user_id,
        displayName: data.display_name,
        text: data.text,
        timestamp: data.created_at,
        likes: 0,
        isOwnComment: true,
        hasLiked: false,
      },
    })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Comment id required' })

    // RLS-equivalent: only allow deleting your own comments
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return res.status(500).json({ error: 'Failed to delete comment' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
