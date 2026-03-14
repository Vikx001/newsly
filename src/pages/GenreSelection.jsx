import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, Sun, Moon } from 'lucide-react'
import { setStoredGenres } from '../utils/storage'
import { GENRES } from '../utils/genres'
import { useTheme } from '../contexts/ThemeContext'

// Per-genre visual identity
const GENRE_STYLES = {
  technology:    { grad: 'from-blue-500 to-cyan-400',    shadow: 'shadow-blue-500/40' },
  general:       { grad: 'from-teal-500 to-emerald-400', shadow: 'shadow-teal-500/40' },
  business:      { grad: 'from-emerald-500 to-green-400',shadow: 'shadow-emerald-500/40' },
  sports:        { grad: 'from-orange-500 to-amber-400', shadow: 'shadow-orange-500/40' },
  science:       { grad: 'from-violet-500 to-purple-400',shadow: 'shadow-violet-500/40' },
  health:        { grad: 'from-rose-500 to-pink-400',    shadow: 'shadow-rose-500/40' },
  entertainment: { grad: 'from-fuchsia-500 to-pink-500', shadow: 'shadow-fuchsia-500/40' },
  politics:      { grad: 'from-red-500 to-orange-400',   shadow: 'shadow-red-500/40' },
}

const GenreSelection = () => {
  const [selectedGenres, setSelectedGenres] = useState(['technology', 'business', 'sports'])
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    )
  }

  const handleContinue = () => {
    setStoredGenres(selectedGenres)
    navigate('/feed')
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500">
            <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor" />
          </svg>
          <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>newsly</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900 shadow-sm border border-gray-200'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => navigate('/feed')}
            className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Skip
          </button>
        </div>
      </header>

      {/* Title */}
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className={`text-3xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>What are you<br />into?</h1>
        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pick topics you care about. You can change these later.</p>
      </div>

      {/* Genre Grid */}
      <div className="flex-1 px-5 pb-36 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {GENRES.map((genre) => {
            const Icon = genre.icon
            const isSelected = selectedGenres.includes(genre.id)
            const style = GENRE_STYLES[genre.id] || { grad: 'from-gray-500 to-gray-400', shadow: 'shadow-gray-500/40' }
            return (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl p-5 aspect-square transition-all duration-200 active:scale-95
                  ${isSelected
                    ? `bg-gradient-to-br ${style.grad} shadow-lg ${style.shadow} scale-[1.03]`
                    : isDark ? 'bg-gray-800/70 border border-gray-700/50 hover:border-gray-500' : 'bg-white border border-gray-200 hover:border-gray-400 shadow-sm'
                  }`}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-white/25 rounded-full flex items-center justify-center">
                    <Check size={12} strokeWidth={3} className="text-white" />
                  </div>
                )}
                <div className={`p-3 rounded-xl ${isSelected ? 'bg-white/20' : isDark ? 'bg-gray-700/60' : 'bg-gray-100'}`}>
                  <Icon size={24} className={isSelected ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'} />
                </div>
                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {genre.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className={`fixed bottom-0 inset-x-0 backdrop-blur-md border-t px-5 py-5 safe-area-bottom ${isDark ? 'bg-gray-950/90 border-gray-800/60' : 'bg-white/90 border-gray-200'}`}>
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedGenres.length === 0
                ? 'Select at least one topic'
                : `${selectedGenres.length} topic${selectedGenres.length > 1 ? 's' : ''} selected`}
            </p>
            <div className="flex gap-1 mt-1.5">
              {GENRES.map(g => (
                <div
                  key={g.id}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    selectedGenres.includes(g.id)
                      ? `bg-gradient-to-r ${(GENRE_STYLES[g.id] || {}).grad || 'from-blue-400 to-cyan-400'}`
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleContinue}
            disabled={selectedGenres.length === 0}
            className={`flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 shadow-lg ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}
          >
            Let's go
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default GenreSelection
