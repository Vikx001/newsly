/**
 * GET  /api/bookmarks       — list current user's bookmarks
 * POST /api/bookmarks       — add a bookmark
 * DELETE /api/bookmarks     — remove a bookmark (body: { articleHash })
 */

import { supabaseAdmin, requireAuth, setCors } from './_supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await requireAuth(req, res)
  if (!user) return // requireAuth already sent the 401

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: 'Failed to fetch bookmarks' })
    return res.status(200).json({ bookmarks: data })
  }

  if (req.method === 'POST') {
    const { articleHash, url, title, description, category, source, publishedAt, imageUrl } = req.body || {}

    if (!articleHash || !url) return res.status(400).json({ error: 'articleHash and url are required' })

    // Sanitise string inputs
    const row = {
      user_id: user.id,
      article_hash: String(articleHash).slice(0, 64),
      url: String(url).slice(0, 2000),
      title: title ? String(title).slice(0, 500) : null,
      description: description ? String(description).slice(0, 2000) : null,
      category: category ? String(category).slice(0, 64) : null,
      source: source ? String(source).slice(0, 255) : null,
      published_at: publishedAt ? String(publishedAt).slice(0, 64) : null,
      image_url: imageUrl ? String(imageUrl).slice(0, 2000) : null,
    }

    const { data, error } = await supabaseAdmin
      .from('bookmarks')
      .upsert(row, { onConflict: 'user_id,article_hash' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'Failed to save bookmark' })
    return res.status(201).json({ bookmark: data })
  }

  if (req.method === 'DELETE') {
    const { articleHash } = req.body || {}
    if (!articleHash) return res.status(400).json({ error: 'articleHash required' })

    const { error } = await supabaseAdmin
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('article_hash', String(articleHash))

    if (error) return res.status(500).json({ error: 'Failed to remove bookmark' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
