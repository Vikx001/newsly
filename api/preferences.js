/**
 * GET /api/preferences       — fetch current user's preferences
 * PUT /api/preferences       — update preferences (partial update supported)
 */

import { supabaseAdmin, requireAuth, setCors } from './_supabase.js'

const ALLOWED_SORT_MODES = ['latest', 'personalized']
const ALLOWED_FONT_SIZES = ['small', 'medium', 'large']
const ALLOWED_THEMES = ['dark', 'light']
const ALLOWED_GENRES = ['technology', 'general', 'business', 'sports', 'science', 'health', 'entertainment', 'politics']

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = await requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch preferences' })
    }

    // Return defaults if no record exists yet
    const prefs = data || {
      user_id: user.id,
      genres: ['technology', 'business', 'sports'],
      country: 'global',
      theme: 'dark',
      font_size: 'medium',
      sort_mode: 'personalized',
      hide_paywalled: false,
      enhanced_bias: false,
      notifications: false,
    }

    return res.status(200).json({ preferences: prefs })
  }

  if (req.method === 'PUT') {
    const body = req.body || {}
    const update = {}

    // Only accept known fields, validate each value
    if (body.genres !== undefined) {
      const genres = Array.isArray(body.genres)
        ? body.genres.filter(g => ALLOWED_GENRES.includes(g)).slice(0, 8)
        : []
      update.genres = genres
    }
    if (body.country !== undefined) {
      update.country = String(body.country).slice(0, 10)
    }
    if (body.theme !== undefined && ALLOWED_THEMES.includes(body.theme)) {
      update.theme = body.theme
    }
    if (body.font_size !== undefined && ALLOWED_FONT_SIZES.includes(body.font_size)) {
      update.font_size = body.font_size
    }
    if (body.sort_mode !== undefined && ALLOWED_SORT_MODES.includes(body.sort_mode)) {
      update.sort_mode = body.sort_mode
    }
    if (body.hide_paywalled !== undefined) {
      update.hide_paywalled = Boolean(body.hide_paywalled)
    }
    if (body.enhanced_bias !== undefined) {
      update.enhanced_bias = Boolean(body.enhanced_bias)
    }
    if (body.notifications !== undefined) {
      update.notifications = Boolean(body.notifications)
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    update.user_id = user.id
    update.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .upsert(update, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'Failed to update preferences' })
    return res.status(200).json({ preferences: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
