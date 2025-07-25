import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { Sun, Moon, Search, Bookmark, Settings, Volume2, Settings as SettingsIcon } from 'lucide-react'

function HeaderBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const isActive = (path) => location.pathname === path

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] dark:border-b-gray-700 px-10 py-3 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-4 text-[#111418] dark:text-white">
        <div className="size-4">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 
          className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] cursor-pointer"
          onClick={() => navigate('/')}
        >
          Newsly
        </h2>
      </div>
      
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <button 
            className={`text-sm font-medium leading-normal ${
              isActive('/feed') 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-[#111418] dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            onClick={() => navigate('/feed')}
          >
            For You
          </button>
          <button 
            className={`text-sm font-medium leading-normal ${
              isActive('/bookmarks') 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-[#111418] dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            onClick={() => navigate('/bookmarks')}
          >
            Bookmarks
          </button>
          <button 
            className={`text-sm font-medium leading-normal ${
              isActive('/settings') 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-[#111418] dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            onClick={() => navigate('/settings')}
          >
            Settings
          </button>
        </div>
        
        <div className="flex gap-2">
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#f1f2f4] dark:bg-gray-700 text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
            <Search size={20} />
          </button>
          
          <button 
            onClick={() => navigate('/bookmarks')}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#f1f2f4] dark:bg-gray-700 text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            <Bookmark size={20} />
          </button>
          
          <button 
            onClick={() => navigate('/settings')}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#f1f2f4] dark:bg-gray-700 text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            <Settings size={20} />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#f1f2f4] dark:bg-gray-700 text-[#111418] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <button
          onClick={() => {
            if (window.speechSynthesis?.speaking) {
              window.speechSynthesis.cancel()
            }
          }}
          className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
          title="Stop all speech"
        >
          <Volume2 size={20} />
        </button>
      </div>
    </header>
  )
}

export default HeaderBar
