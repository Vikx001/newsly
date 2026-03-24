/**
 * AuthContext
 *
 * Manages the user session. Auth calls go to our own Vercel API routes — the
 * Supabase service_role key never leaves the server. We only store:
 *   - accessToken  in memory (React state) + localStorage for persistence
 *   - refreshToken in localStorage only (never sent except to /api/auth/refresh)
 *
 * Security notes:
 *   - No Supabase keys of any kind are in this file or any other client file.
 *   - JWTs are user-level tokens; the service_role key (which can bypass
 *     security) lives only in Vercel environment variables.
 *   - Preferences are migrated from localStorage to cloud on first login.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { setToken, setRefreshCallback } from '../utils/apiClient'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

const LS_USER = 'newsly_auth_user'
const LS_AT   = 'newsly_auth_access_token'
const LS_RT   = 'newsly_auth_refresh_token'
const LS_EXP  = 'newsly_auth_expires_at'

function loadSession() {
  try {
    const user  = JSON.parse(localStorage.getItem(LS_USER) || 'null')
    const at    = localStorage.getItem(LS_AT)
    const rt    = localStorage.getItem(LS_RT)
    const exp   = Number(localStorage.getItem(LS_EXP) || '0')
    if (user && at && rt) return { user, accessToken: at, refreshToken: rt, expiresAt: exp }
  } catch {}
  return null
}

function saveSession({ user, accessToken, refreshToken, expiresAt }) {
  localStorage.setItem(LS_USER, JSON.stringify(user))
  localStorage.setItem(LS_AT, accessToken)
  localStorage.setItem(LS_RT, refreshToken)
  localStorage.setItem(LS_EXP, String(expiresAt || 0))
}

function clearSession() {
  localStorage.removeItem(LS_USER)
  localStorage.removeItem(LS_AT)
  localStorage.removeItem(LS_RT)
  localStorage.removeItem(LS_EXP)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Keep the apiClient module in sync
  useEffect(() => {
    setToken(accessToken)
  }, [accessToken])

  // Refresh the access token using the stored refresh token
  const refreshSession = useCallback(async () => {
    const rt = localStorage.getItem(LS_RT)
    if (!rt) return false
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      })
      if (!res.ok) {
        clearSession()
        setUser(null)
        setAccessToken(null)
        return false
      }
      const data = await res.json()
      setAccessToken(data.accessToken)
      localStorage.setItem(LS_AT, data.accessToken)
      localStorage.setItem(LS_RT, data.refreshToken)
      localStorage.setItem(LS_EXP, String(data.expiresAt || 0))
      return true
    } catch {
      return false
    }
  }, [])

  // Register the refresh callback with the apiClient module
  useEffect(() => {
    setRefreshCallback(refreshSession)
  }, [refreshSession])

  // Restore session from localStorage on mount
  useEffect(() => {
    const session = loadSession()
    if (session) {
      const nowSec = Math.floor(Date.now() / 1000)
      const expired = session.expiresAt && session.expiresAt < nowSec + 60

      if (expired) {
        // Try to refresh before setting state
        refreshSession().then(ok => {
          if (ok) {
            const restored = loadSession()
            if (restored) {
              setUser(restored.user)
              setAccessToken(restored.accessToken)
            }
          }
          setLoading(false)
        })
      } else {
        setUser(session.user)
        setAccessToken(session.accessToken)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [refreshSession])

  // Proactively refresh token 2 minutes before expiry
  useEffect(() => {
    if (!accessToken) return
    const exp = Number(localStorage.getItem(LS_EXP) || '0')
    if (!exp) return
    const msUntilRefresh = (exp - Math.floor(Date.now() / 1000) - 120) * 1000
    if (msUntilRefresh <= 0) { refreshSession(); return }
    const timer = setTimeout(refreshSession, msUntilRefresh)
    return () => clearTimeout(timer)
  }, [accessToken, refreshSession])

  const signUp = async (email, password, displayName) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Sign up failed')

    saveSession(data)
    setUser(data.user)
    setAccessToken(data.accessToken)

    // Migrate any existing localStorage preferences to the cloud
    await _migrateLocalPreferences(data.accessToken)

    return data.user
  }

  const signIn = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Sign in failed')

    saveSession(data)
    setUser(data.user)
    setAccessToken(data.accessToken)

    // Migrate any existing localStorage preferences to the cloud
    await _migrateLocalPreferences(data.accessToken)

    return data.user
  }

  const signOut = () => {
    clearSession()
    setUser(null)
    setAccessToken(null)
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    setUser(updated)
    localStorage.setItem(LS_USER, JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * On first login, migrate localStorage preferences to the user's cloud profile
 * so they don't lose their existing setup configuration.
 */
async function _migrateLocalPreferences(token) {
  try {
    const genres = JSON.parse(localStorage.getItem('newsly_genres') || 'null')
    const country = localStorage.getItem('newsly_country')
    const theme = localStorage.getItem('newsly-theme') === 'true' ? 'dark' : 'light'
    const fontSize = localStorage.getItem('newsly_font_size')
    const sortMode = localStorage.getItem('newsly_sort_mode')
    const hidePaywalled = localStorage.getItem('newsly_hide_paywalled')
    const enhancedBias = localStorage.getItem('newsly_enhanced_bias')

    const prefs = {}
    if (genres?.length) prefs.genres = genres
    if (country) prefs.country = country
    if (theme) prefs.theme = theme
    if (fontSize) prefs.font_size = fontSize
    if (sortMode) prefs.sort_mode = sortMode
    if (hidePaywalled !== null) prefs.hide_paywalled = JSON.parse(hidePaywalled)
    if (enhancedBias !== null) prefs.enhanced_bias = JSON.parse(enhancedBias)

    if (Object.keys(prefs).length > 0) {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(prefs),
      })
    }
  } catch {
    // Non-fatal — if migration fails, the user can re-configure
  }
}
