/**
 * POST /api/comment-like
 * Body: { commentId }
 *
 * Toggles a like on a comment. One like per user per comment, enforced server-side.
 */

import { supabaseAdmin, requireAuth, setCors } from './_supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await requireAuth(req, res)
  if (!user) return

  const { commentId } = req.body || {}
  if (!commentId) return res.status(400).json({ error: 'commentId required' })

  // Check if already liked
  const { data: existing } = await supabaseAdmin
    .from('comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Already liked — remove like (toggle off)
    await supabaseAdmin
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
    return res.status(200).json({ liked: false })
  } else {
    // Not liked — add like
    const { error } = await supabaseAdmin
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: user.id })
    if (error) return res.status(500).json({ error: 'Failed to like comment' })
    return res.status(200).json({ liked: true })
  }
}
