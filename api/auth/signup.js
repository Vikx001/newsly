/**
 * POST /api/auth/signup
 * Body: { email, password, displayName }
 *
 * Creates a new user account entirely server-side.
 * No Supabase keys are ever sent to the client.
 */

import { supabaseAdmin, supabaseAuth, setCors } from '../_supabase.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password, displayName } = req.body || {}

  // --- Input validation (never trust the client) ---
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (password.length > 128) return res.status(400).json({ error: 'Password too long' })

  const safeName = (displayName || '').toString().trim().slice(0, 30) || 'Newsly Reader'
  const safeEmail = email.toLowerCase().trim()

  try {
    // 1. Create user via admin API (skips email confirmation flow)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: safeEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: safeName },
    })

    if (createErr) {
      if (createErr.message?.toLowerCase().includes('already registered') ||
          createErr.message?.toLowerCase().includes('already exists')) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }
      return res.status(400).json({ error: createErr.message })
    }

    // 2. Sign in immediately so we can return a usable session token
    const { data: session, error: signInErr } = await supabaseAuth.auth.signInWithPassword({
      email: safeEmail,
      password,
    })

    if (signInErr || !session?.session) {
      // User was created but sign-in failed — log and ask user to log in manually
      console.error('[signup] sign-in after create failed:', signInErr?.message)
      return res.status(201).json({ error: 'Account created — please log in to continue' })
    }

    // 3. Persist profile and default preferences (errors here are non-fatal)
    await Promise.allSettled([
      supabaseAdmin.from('profiles').upsert({ id: created.user.id, display_name: safeName }),
      supabaseAdmin.from('user_preferences').upsert({ user_id: created.user.id }),
    ])

    return res.status(201).json({
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: safeName,
      },
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
      expiresAt: session.session.expires_at,
    })
  } catch (err) {
    console.error('[signup] unexpected error:', err)
    return res.status(500).json({ error: 'Server error — please try again' })
  }
}
