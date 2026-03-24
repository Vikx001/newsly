/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 *
 * Exchanges a refresh token for a new access token.
 * Called automatically by the frontend AuthContext when the access token expires.
 */

import { supabaseAuth, setCors } from '../_supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { refreshToken } = req.body || {}
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

  try {
    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data?.session) {
      return res.status(401).json({ error: 'Session expired — please log in again' })
    }

    return res.status(200).json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    })
  } catch (err) {
    console.error('[refresh] error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
