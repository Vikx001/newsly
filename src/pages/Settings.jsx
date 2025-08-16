import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import {
  ArrowLeft,
  Type,
  Sun,
  Moon,
  Bell,
  Bookmark,
  CreditCard,
  Clock,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  LogOut,
  Check,
  X,
  Shield
} from 'lucide-react'
import { getHidePaywalled, setHidePaywalled, getStoredSortMode, setStoredSortMode } from '../utils/storage'

const Settings = () => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [fontSize, setFontSize] = useState('medium')
  const [enhancedBias, setEnhancedBias] = useState(false)
  const [showModal, setShowModal] = useState(null)
  const [hidePaywalled, setHidePaywalledState] = useState(getHidePaywalled())
  const [sortMode, setSortMode] = useState(getStoredSortMode())

  useEffect(() => {
    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('newsly_notifications')
    const savedFontSize = localStorage.getItem('newsly_font_size')
    const savedEnhancedBias = localStorage.getItem('newsly_enhanced_bias')

    if (savedNotifications !== null) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedFontSize) {
      setFontSize(savedFontSize)
      document.documentElement.style.fontSize =
        savedFontSize === 'small' ? '14px' : savedFontSize === 'large' ? '18px' : '16px'
    }
    if (savedEnhancedBias !== null) {
      setEnhancedBias(JSON.parse(savedEnhancedBias))
    }
  }, [])

  const handleNotificationToggle = () => {
    const newValue = !notifications
    setNotifications(newValue)
    localStorage.setItem('newsly_notifications', JSON.stringify(newValue))
  }

  const handleFontSizeChange = (size) => {
    setFontSize(size)
    localStorage.setItem('newsly_font_size', size)
    document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px'
  }

  const handleEnhancedBiasToggle = () => {
    const newValue = !enhancedBias
    setEnhancedBias(newValue)
    localStorage.setItem('newsly_enhanced_bias', JSON.stringify(newValue))
  }

  const handleFeedback = () => {
    const email = 'feedback@newsly.app'
    const subject = 'Newsly App Feedback'
    const body = 'Hi Newsly Team,\n\nI have some feedback about the app:\n\n'
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const handleHelp = () => {
    setShowModal('help')
  }

  const handleSubscriptions = () => {
    setShowModal('subscriptions')
  }

  const settingsItems = [
    {
      category: "App Preferences",
      items: [
        {
          icon: Type,
          title: "Reading Experience",
          description: "Customize your reading experience",
          action: () => {
            console.log('Reading Experience clicked')
            setShowModal('reading')
          },
          showArrow: true
        },
        {
          icon: isDark ? Moon : Sun,
          title: "Theme",
          description: "Choose your preferred app theme",
          action: () => {
            console.log('Theme clicked')
            toggleTheme()
          },
          value: isDark ? 'Dark' : 'Light',
          showArrow: false
        },
        {
          icon: Bell,
          title: "Notifications",
          description: "Manage your notification settings",
          action: () => {
            console.log('Notifications clicked')
            handleNotificationToggle()
          },
          value: notifications ? 'On' : 'Off',
          showArrow: false
        },
        {
          icon: Shield,
          title: "Enhanced Bias Analysis",
          description: "Stronger heuristic for bias detection",
          action: () => {
            console.log('Enhanced Bias Analysis clicked')
            handleEnhancedBiasToggle()
          },
          value: enhancedBias ? 'On' : 'Off',
          showArrow: false
        },
        {
          icon: Bookmark,
          title: "Hide Paywalled Articles",
          description: "Filter out articles from common paywalled sites",
          action: () => {
            const next = !hidePaywalled
            setHidePaywalledState(next)
            setHidePaywalled(next)
          },
          value: hidePaywalled ? 'On' : 'Off',
          showArrow: false
        },
        {
          icon: Clock,
          title: "Default Sort",
          description: "Choose between Personalized or Latest",
          action: () => {
            const next = sortMode === 'personalized' ? 'latest' : 'personalized'
            setSortMode(next)
            setStoredSortMode(next)
          },
          value: sortMode === 'latest' ? 'Latest' : 'Personalized',
          showArrow: false
        }
      ]
    },
    {
      category: "Account",
      items: [
        {
          icon: Bookmark,
          title: "Bookmarks",
          description: "View your saved articles",
          action: () => navigate('/bookmarks'),
          showArrow: true
        },
        {
          icon: CreditCard,
          title: "Subscriptions",
          description: "Manage your subscriptions",
          action: () => {
            console.log('Subscriptions clicked')
            handleSubscriptions()
          },
          showArrow: true
        },
        {
          icon: Clock,
          title: "Clear History",
          description: "Clear your reading history",
          action: () => {
            console.log('Clear History clicked')
            setShowModal('confirmClearHistory')
          },
          showArrow: true
        },
        {
          icon: MessageSquare,
          title: "Feedback",
          description: "Provide feedback or report issues",
          action: () => {
            console.log('Feedback clicked')
            handleFeedback()
          },
          showArrow: true
        },
        {
          icon: HelpCircle,
          title: "Help & Support",
          description: "Access help and support resources",
          action: () => {
            console.log('Help clicked')
            handleHelp()
          },
          showArrow: true
        }
      ]
    }
  ]

  const handleLogout = () => {
    setShowModal('confirmLogout')
  }

  const Modal = ({ type, onClose }) => {
    if (!type) return null

    // Close on Escape
    useEffect(() => {
      const onKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    const modalContent = {
      reading: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Reading Experience</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`px-3 py-2 rounded-lg border ${
                      fontSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      help: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Help & Support</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">How to use Newsly:</h4>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Swipe left/right to navigate between articles</li>
                <li>Tap bookmark icon to save articles</li>
                <li>Use theme toggle for dark/light mode</li>
                <li>Select your preferred news categories</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Contact Support:</h4>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Email: support@newsly.app<br/>
                Response time: 12-24 hours
              </p>
            </div>
          </div>
        </div>
      ),
      subscriptions: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Subscriptions</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg dark:border-gray-600">
              <h4 className="font-medium">Free Plan</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Current plan - Unlimited news access
              </p>
              <div className="flex items-center mt-2">
                <Check size={16} className="text-green-600 mr-2" />
                <span className="text-sm">Active</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg dark:border-gray-600 opacity-60">
              <h4 className="font-medium">Premium Plan</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Coming soon - Advanced features
              </p>
            </div>
          </div>
        </div>
      ),
      confirmClearHistory: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Clear History</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to clear your reading history?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">Cancel</button>
            <button
              onClick={() => {
                localStorage.removeItem('newsly_reading_history')
                onClose()
              }}
              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Clear
            </button>
          </div>
        </div>
      ),
      confirmLogout: (
        <div>
          <h3 className="text-lg font-semibold mb-4">Log Out</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to log out?</p>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">Cancel</button>
            <button
              onClick={() => {
                localStorage.clear()
                onClose()
                navigate('/login')
              }}
              className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        </div>
      )
    }

    const showDone = ['reading', 'help', 'subscriptions'].includes(type)

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        role="dialog" aria-modal="true" aria-label="Settings modal"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            {modalContent[type]}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ml-4"
            >
              <X size={20} />
            </button>
          </div>
          {showDone && (
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f1f2f4] dark:border-b-gray-700 px-10 py-3 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4 text-[#121416] dark:text-white">
          <div className="size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2
            className="text-[#121416] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] cursor-pointer"
            onClick={() => navigate('/')}
          >
            Newsly
          </h2>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </header>

      {/* Content */}
      <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1">
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <h1 className="text-[#121416] dark:text-white tracking-light text-[32px] font-bold leading-tight min-w-72">
              Settings
            </h1>
          </div>

          {settingsItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-[#121416] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                {section.category}
              </h3>

              {section.items.map((item, itemIndex) => (
                <button
                  type="button"
                  key={itemIndex}
                  className="flex w-full text-left items-center gap-4 bg-white dark:bg-gray-800 px-4 min-h-[72px] py-2 justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={item.action}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-[#121416] dark:text-white flex items-center justify-center rounded-lg bg-[#f1f2f4] dark:bg-gray-600 shrink-0 size-12">
                      <item.icon size={24} />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[#121416] dark:text-white text-base font-medium leading-normal line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-[#6a7381] dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {item.value ? (
                      <p className="text-[#121416] dark:text-white text-base font-normal leading-normal">
                        {item.value}
                      </p>
                    ) : item.showArrow ? (
                      <ChevronRight size={24} className="text-[#121416] dark:text-white" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ))}

          {/* Logout */}
          <button
            type="button"
            className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 min-h-14 justify-between hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors mt-4"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="text-red-600 dark:text-red-400 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0 size-10">
                <LogOut size={20} />
              </div>
              <p className="text-red-600 dark:text-red-400 text-base font-normal leading-normal flex-1 truncate">
                Log Out
              </p>
            </div>
            <div className="shrink-0">
              <ChevronRight size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </button>
        </div>
      </div>
      <Modal type={showModal} onClose={() => setShowModal(null)} />
    </div>
  )
}

export default Settings
