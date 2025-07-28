import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { 
  ArrowLeft, 
  Type, 
  Sun, 
  Moon, 
  Bell, 
  CreditCard, 
  Clock, 
  MessageSquare, 
  HelpCircle, 
  ChevronRight,
  LogOut,
  Check,
  X
} from 'lucide-react'

const Settings = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [fontSize, setFontSize] = useState('medium')
  const [showModal, setShowModal] = useState(null)

  useEffect(() => {
    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('newsly_notifications')
    const savedFontSize = localStorage.getItem('newsly_font_size')
    
    if (savedNotifications !== null) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedFontSize) {
      setFontSize(savedFontSize)
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
          icon: theme === 'dark' ? Moon : Sun,
          title: "Theme",
          description: "Choose your preferred app theme",
          action: () => {
            console.log('Theme clicked')
            toggleTheme()
          },
          value: theme === 'dark' ? 'Dark' : 'Light',
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
        }
      ]
    },
    {
      category: "Account",
      items: [
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
            if (confirm('Are you sure you want to clear your reading history?')) {
              localStorage.removeItem('newsly_reading_history')
              alert('Reading history cleared!')
            }
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
    if (confirm('Are you sure you want to log out?')) {
      localStorage.clear()
      navigate('/login')
    }
  }

  const Modal = ({ type, onClose }) => {
    if (!type) return null

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
                Response time: 24-48 hours
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
      )
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            {modalContent[type]}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ml-4"
            >
              <X size={20} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
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
                <div 
                  key={itemIndex}
                  className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 min-h-[72px] py-2 justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
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
                </div>
              ))}
            </div>
          ))}

          {/* Logout */}
          <div 
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
          </div>
        </div>
      </div>
      <Modal type={showModal} onClose={() => setShowModal(null)} />
    </div>
  )
}

export default Settings
