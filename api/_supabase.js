/**
 * Server-side Supabase helpers — Vercel serverless functions ONLY.
 * This file is NEVER bundled into the client; the `_` prefix is ignored by
 * Vercel's file-system router for serverless routes.
 *
 * Two clients:
 *  - supabaseAdmin  → service_role key, bypasses RLS — use for all data ops
 *  - supabaseAuth   → anon key, user-level — use only for signInWithPassword
 *
 * All secret env vars are set in the Vercel dashboard (or .env.local for dev).
 * They are NEVER prefixed with VITE_ and therefore never bundled by Vite.
 */

import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[_supabase] Missing required server env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
}

/** Admin client — has full DB access, bypasses RLS. Keep server-side only. */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Auth client — uses the public anon key only for signInWithPassword.
 * The anon key stays server-side here and is never sent to the browser.
 */
export const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Verify a Bearer JWT from the Authorization header.
 * Returns { user } on success or sends a 401 and returns null.
 */
export async function requireAuth(req, res) {
  const header = req.headers['authorization'] || ''
  const token = header.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    res.status(401).json({ error: 'Authorization token required' })
    return null
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }

  return user
}

/** Apply permissive CORS headers — tighten origin in production if needed. */
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}
