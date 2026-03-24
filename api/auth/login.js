/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * Signs in a user server-side and returns the session token.
 * Credentials never touch the Supabase API directly from the browser.
 */

import { supabaseAdmin, supabaseAuth, setCors } from '../_supabase.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error || !data?.session) {
      // Generic message — never reveal whether the email exists
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Fetch display name from profiles table
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('id', data.user.id)
      .single()

    return res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        displayName: profile?.display_name || data.user.user_metadata?.display_name || 'Newsly Reader',
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    })
  } catch (err) {
    console.error('[login] unexpected error:', err)
    return res.status(500).json({ error: 'Server error — please try again' })
  }
}
