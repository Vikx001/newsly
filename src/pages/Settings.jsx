import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import {
  ArrowLeft, Type, Sun, Moon, Bell, Bookmark, CreditCard,
  Clock, MessageSquare, HelpCircle, ChevronRight, LogOut,
  Check, X, Shield, Eye, SortAsc, Sparkles, LogIn, UserPlus, User
} from 'lucide-react'
import { getHidePaywalled, setHidePaywalled, getStoredSortMode, setStoredSortMode } from '../utils/storage'
import { api } from '../utils/apiClient'

// Reusable toggle pill
const Toggle = ({ value, onToggle, isDark }) => (
  <button
    onClick={onToggle}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-blue-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
)

const Settings = () => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [fontSize, setFontSize] = useState('medium')
  const [enhancedBias, setEnhancedBias] = useState(false)
  const [showModal, setShowModal] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [hidePaywalled, setHidePaywalledState] = useState(getHidePaywalled())
  const [sortMode, setSortMode] = useState(getStoredSortMode())

  useEffect(() => {
    const savedNotifications = localStorage.getItem('newsly_notifications')
    const savedFontSize = localStorage.getItem('newsly_font_size')
    const savedEnhancedBias = localStorage.getItem('newsly_enhanced_bias')
    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications))
    if (savedFontSize) {
      setFontSize(savedFontSize)
      document.documentElement.style.fontSize =
        savedFontSize === 'small' ? '14px' : savedFontSize === 'large' ? '18px' : '16px'
    }
    if (savedEnhancedBias !== null) setEnhancedBias(JSON.parse(savedEnhancedBias))
  }, [])

  const handleNotificationToggle = () => {
    const v = !notifications; setNotifications(v)
    localStorage.setItem('newsly_notifications', JSON.stringify(v))
    if (user) api.put('/api/preferences', { notifications: v }).catch(() => {})
  }
  const handleFontSizeChange = (size) => {
    setFontSize(size); localStorage.setItem('newsly_font_size', size)
    document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'
    if (user) api.put('/api/preferences', { font_size: size }).catch(() => {})
  }
  const handleEnhancedBiasToggle = () => {
    const v = !enhancedBias; setEnhancedBias(v)
    localStorage.setItem('newsly_enhanced_bias', JSON.stringify(v))
    if (user) api.put('/api/preferences', { enhanced_bias: v }).catch(() => {})
  }

  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50'
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const text = isDark ? 'text-white' : 'text-gray-900'
  const sub = isDark ? 'text-gray-400' : 'text-gray-500'
  const iconBg = isDark ? 'bg-gray-800' : 'bg-gray-100'
  const divider = isDark ? 'border-gray-800' : 'border-gray-100'

  const SettingRow = ({ icon: Icon, iconColor = 'text-blue-500', iconBgColor = 'bg-blue-500/10', title, desc, right, onClick, danger }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:opacity-70
        ${danger ? (isDark ? 'hover:bg-red-900/10' : 'hover:bg-red-50') : (isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50')}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-red-500' : text}`}>{title}</p>
        {desc && <p className={`text-xs mt-0.5 ${sub}`}>{desc}</p>}
      </div>
      {right}
    </button>
  )

  const Section = ({ title, children }) => (
    <div className="mb-4">
      <p className={`text-xs font-semibold uppercase tracking-widest px-5 pb-2 ${sub}`}>{title}</p>
      <div className={`mx-4 rounded-2xl border overflow-hidden ${card}`}>
        {React.Children.map(children, (child, i) => (
          <>
            {i > 0 && <div className={`border-t mx-4 ${divider}`} />}
            {child}
          </>
        ))}
      </div>
    </div>
  )

  const Modal = ({ type, onClose }) => {
    useEffect(() => {
      const fn = (e) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', fn)
      return () => window.removeEventListener('keydown', fn)
    }, [onClose])

    if (!type) return null

    const contents = {
      reading: (
        <>
          <p className={`text-base font-bold mb-4 ${text}`}>Font Size</p>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map(size => (
              <button key={size} onClick={() => handleFontSizeChange(size)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${fontSize === size ? 'bg-blue-500 text-white border-blue-500' : `border ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}`}>
                {size[0].toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </>
      ),
      help: (
        <>
          <p className={`text-base font-bold mb-3 ${text}`}>Help & Support</p>
          <ul className={`space-y-2 text-sm ${sub}`}>
            <li>• Swipe up/down to navigate between articles</li>
            <li>• Tap the bookmark icon to save articles</li>
            <li>• Toggle light/dark mode from any header</li>
            <li>• Change categories in Genre Selection</li>
          </ul>
          <p className={`text-xs mt-4 ${sub}`}>Contact: <span className="text-blue-400">support@newsly.app</span></p>
        </>
      ),
      subscriptions: (
        <>
          <p className={`text-base font-bold mb-3 ${text}`}>Subscriptions</p>
          <div className={`p-3 rounded-xl border ${card} mb-2`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold ${text}`}>Free Plan</p>
              <span className="text-xs bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full font-semibold">Active</span>
            </div>
            <p className={`text-xs mt-1 ${sub}`}>Unlimited news access</p>
          </div>
          <div className={`p-3 rounded-xl border opacity-50 ${card}`}>
            <p className={`text-sm font-semibold ${text}`}>Premium — Coming Soon</p>
            <p className={`text-xs mt-1 ${sub}`}>Advanced features & ad-free experience</p>
          </div>
        </>
      ),
      confirmClearHistory: (
        <>
          <p className={`text-base font-bold mb-2 ${text}`}>Clear History?</p>
          <p className={`text-sm mb-4 ${sub}`}>This will permanently remove your reading history.</p>
          <div className="flex gap-2">
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={() => { localStorage.removeItem('newsly_reading_history'); onClose() }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white">Clear</button>
          </div>
        </>
      ),
      confirmLogout: (
        <>
          <p className={`text-base font-bold mb-2 ${text}`}>Log Out?</p>
          <p className={`text-sm mb-4 ${sub}`}>
            {user
              ? 'Your data is safely stored in the cloud. You can sign back in anytime.'
              : 'All local data and preferences will be cleared.'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'}`}>Cancel</button>
            <button onClick={() => {
              if (user) {
                signOut()
              } else {
                localStorage.clear()
              }
              onClose()
              navigate('/')
            }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white">Log Out</button>
          </div>
        </>
      ),
    }

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
          {contents[type]}
          {['reading', 'help', 'subscriptions'].includes(type) && (
            <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white">Done</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className={`flex items-center gap-3 px-4 pt-12 pb-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <button onClick={() => navigate(-1)} className={`p-2 rounded-xl ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 border border-gray-200 shadow-sm'}`}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-xl font-bold tracking-tight ${text}`}>Settings</h1>
      </header>

      {/* Profile strip */}
      {user ? (
        <div className={`mx-4 mb-6 rounded-2xl border p-4 flex items-center gap-4 ${card}`}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${text}`}>{user.displayName || 'Newsly Reader'}</p>
            <p className={`text-xs truncate ${sub}`}>{user.email}</p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="text-xs bg-blue-500/15 text-blue-500 px-2.5 py-1 rounded-full font-semibold">Free</span>
          </div>
        </div>
      ) : (
        <div className={`mx-4 mb-6 rounded-2xl border p-4 ${card}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${text}`}>Sign in to sync your data</p>
              <p className={`text-xs ${sub}`}>Bookmarks, comments &amp; preferences across devices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setAuthModalMode('login'); setShowAuthModal(true) }}
              className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              onClick={() => { setAuthModalMode('signup'); setShowAuthModal(true) }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'}`}
            >
              <UserPlus size={14} /> Sign Up
            </button>
          </div>
        </div>
      )}

      <div className="pb-10">
        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow
            icon={isDark ? Moon : Sun}
            iconBgColor={isDark ? 'bg-indigo-500/10' : 'bg-amber-500/10'}
            iconColor={isDark ? 'text-indigo-400' : 'text-amber-500'}
            title="Theme"
            desc={isDark ? 'Dark mode is on' : 'Light mode is on'}
            onClick={toggleTheme}
            right={<Toggle value={isDark} onToggle={toggleTheme} isDark={isDark} />}
          />
          <SettingRow
            icon={Type}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-500"
            title="Font Size"
            desc={`Currently: ${fontSize[0].toUpperCase() + fontSize.slice(1)}`}
            onClick={() => setShowModal('reading')}
            right={<ChevronRight size={16} className={sub} />}
          />
        </Section>

        {/* Feed */}
        <Section title="Feed">
          <SettingRow
            icon={SortAsc}
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-500"
            title="Default Sort"
            desc={sortMode === 'latest' ? 'Sorted by latest first' : 'Sorted by your interests'}
            onClick={() => { const n = sortMode === 'personalized' ? 'latest' : 'personalized'; setSortMode(n); setStoredSortMode(n) }}
            right={<span className={`text-xs font-semibold px-2 py-1 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{sortMode === 'latest' ? 'Latest' : 'For You'}</span>}
          />
          <SettingRow
            icon={Eye}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-500"
            title="Hide Paywalled"
            desc="Filter out paywalled articles"
            onClick={() => { const n = !hidePaywalled; setHidePaywalledState(n); setHidePaywalled(n) }}
            right={<Toggle value={hidePaywalled} onToggle={() => { const n = !hidePaywalled; setHidePaywalledState(n); setHidePaywalled(n) }} isDark={isDark} />}
          />
          <SettingRow
            icon={Shield}
            iconBgColor="bg-violet-500/10"
            iconColor="text-violet-500"
            title="Enhanced Bias Analysis"
            desc="Stronger heuristic bias detection"
            onClick={handleEnhancedBiasToggle}
            right={<Toggle value={enhancedBias} onToggle={handleEnhancedBiasToggle} isDark={isDark} />}
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow
            icon={Bell}
            iconBgColor="bg-pink-500/10"
            iconColor="text-pink-500"
            title="Push Notifications"
            desc="Breaking news and top stories"
            onClick={handleNotificationToggle}
            right={<Toggle value={notifications} onToggle={handleNotificationToggle} isDark={isDark} />}
          />
        </Section>

        {/* Account */}
        <Section title="Account">
          <SettingRow
            icon={Bookmark}
            iconBgColor="bg-cyan-500/10"
            iconColor="text-cyan-500"
            title="Bookmarks"
            desc="View your saved articles"
            onClick={() => navigate('/bookmarks')}
            right={<ChevronRight size={16} className={sub} />}
          />
          <SettingRow
            icon={CreditCard}
            iconBgColor="bg-teal-500/10"
            iconColor="text-teal-500"
            title="Subscriptions"
            desc="Manage your plan"
            onClick={() => setShowModal('subscriptions')}
            right={<ChevronRight size={16} className={sub} />}
          />
          <SettingRow
            icon={Clock}
            iconBgColor="bg-rose-500/10"
            iconColor="text-rose-500"
            title="Clear History"
            desc="Remove your reading history"
            onClick={() => setShowModal('confirmClearHistory')}
            right={<ChevronRight size={16} className={sub} />}
          />
        </Section>

        {/* Support */}
        <Section title="Support">
          <SettingRow
            icon={MessageSquare}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-500"
            title="Send Feedback"
            desc="Help us improve Newsly"
            onClick={() => window.open('mailto:feedback@newsly.app?subject=Newsly%20Feedback')}
            right={<ChevronRight size={16} className={sub} />}
          />
          <SettingRow
            icon={HelpCircle}
            iconBgColor="bg-indigo-500/10"
            iconColor="text-indigo-500"
            title="Help & Support"
            desc="Tips and contact info"
            onClick={() => setShowModal('help')}
            right={<ChevronRight size={16} className={sub} />}
          />
        </Section>

        {/* Danger zone */}
        <div className="mx-4">
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <SettingRow
              icon={LogOut}
              iconBgColor="bg-red-500/10"
              iconColor="text-red-500"
              title="Log Out"
              desc="Clear all data and return to start"
              onClick={() => setShowModal('confirmLogout')}
              danger
              right={<ChevronRight size={16} className="text-red-400" />}
            />
          </div>
        </div>

        <p className={`text-center text-xs mt-8 ${sub}`}>Newsly v2.0 · © 2026</p>
      </div>

      <Modal type={showModal} onClose={() => setShowModal(null)} />
      {showAuthModal && (
        <AuthModal
          defaultMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  )
}

export default Settings
