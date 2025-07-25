import React from 'react'
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
  LogOut
} from 'lucide-react'

const Settings = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const settingsItems = [
    {
      category: "App Preferences",
      items: [
        {
          icon: Type,
          title: "Reading Experience",
          description: "Customize your reading experience",
          action: () => navigate('/under-construction'),
          showArrow: true
        },
        {
          icon: theme === 'dark' ? Moon : Sun,
          title: "Theme",
          description: "Choose your preferred app theme",
          action: toggleTheme,
          value: theme === 'dark' ? 'Dark' : 'Light',
          showArrow: false
        },
        {
          icon: Bell,
          title: "Notifications",
          description: "Manage your notification settings",
          action: () => navigate('/under-construction'),
          showArrow: true
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
          action: () => navigate('/under-construction'),
          showArrow: true
        },
        {
          icon: Clock,
          title: "Clear History",
          description: "Clear your reading history",
          action: () => {
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
          action: () => navigate('/under-construction'),
          showArrow: true
        },
        {
          icon: HelpCircle,
          title: "Help & Support",
          description: "Access help and support resources",
          action: () => navigate('/under-construction'),
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
    </div>
  )
}

export default Settings
