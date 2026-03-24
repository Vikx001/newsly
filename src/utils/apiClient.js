/**
 * Authenticated API client.
 *
 * All data calls go through our own Vercel serverless API routes — never
 * directly to Supabase from the browser. This keeps the service_role key
 * completely invisible to the client.
 *
 * Usage:
 *   import { api } from './apiClient'
 *   const data = await api.get('/api/bookmarks')
 *   const data = await api.post('/api/bookmarks', { url, title, ... })
 */

// Module-level token store — AuthContext calls setToken() on login/logout.
let _accessToken = null
let _refreshCallback = null  // set by AuthContext to handle token refresh

export function setToken(token) {
  _accessToken = token
}

export function setRefreshCallback(fn) {
  _refreshCallback = fn
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // If the access token expired, try to refresh once and retry
  if (res.status === 401 && _refreshCallback) {
    const refreshed = await _refreshCallback()
    if (refreshed) {
      const retryHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_accessToken}` }
      const retry = await fetch(path, {
        method,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || 'Request failed')
      }
      return retry.json()
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }

  return res.json()
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path, body) => request('DELETE', path, body),
}
