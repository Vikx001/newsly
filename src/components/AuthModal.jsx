import React, { useState, useEffect, useRef } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

/**
 * AuthModal — Login / Sign Up sheet.
 * Appears as a bottom sheet on mobile, centred card on desktop.
 *
 * Props:
 *  onClose  — called when user dismisses the modal
 *  defaultMode — 'login' | 'signup' (default 'login')
 */
const AuthModal = ({ onClose, defaultMode = 'login' }) => {
  const { signIn, signUp } = useAuth()
  const { isDark } = useTheme()

  const [mode, setMode] = useState(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const emailRef = useRef(null)

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 100)
  }, [mode])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic client-side validation (server validates too — this is just UX)
    if (!email.trim()) { setError('Email is required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (mode === 'signup' && !displayName.trim()) { setError('Please enter a display name'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password, displayName.trim())
      }
      setSuccess(true)
      setTimeout(onClose, 600)
    } catch (err) {
      setError(err.message || 'Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  const bg   = isDark ? 'bg-gray-950' : 'bg-white'
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const text = isDark ? 'text-white' : 'text-gray-900'
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500'
  const inputBg = isDark
    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-green-500" size={28} />
          </div>
          <p className={`text-lg font-bold ${text}`}>
            {mode === 'login' ? 'Welcome back!' : 'Account created!'}
          </p>
          <p className={`text-sm mt-1 ${sub}`}>Syncing your data…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className={`absolute top-5 right-5 p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className={`text-base font-bold ${text}`}>{mode === 'login' ? 'Welcome back' : 'Join Newsly'}</p>
              <p className={`text-xs ${sub}`}>{mode === 'login' ? 'Sign in to sync your data' : 'Create your free account'}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-3" noValidate>
          {mode === 'signup' && (
            <div className="relative">
              <User size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${sub}`} />
              <input
                type="text"
                value={displayName}
                onChange={e => { setDisplayName(e.target.value.slice(0, 30)); setError('') }}
                placeholder="Display name"
                maxLength={30}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
                disabled={loading}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${sub}`} />
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="Email address"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
              disabled={loading}
            />
          </div>

          <div className="relative">
            <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${sub}`} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Password (min 8 chars)"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${sub} hover:text-blue-500 transition-colors`}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="py-2.5 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-500 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <p className={`text-center text-xs ${sub}`}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-blue-500 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
