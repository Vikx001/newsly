import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Globe2, Bookmark, ShieldCheck, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const FEATURES = [
  {
    icon: Zap,
    title: 'Personalized Feed',
    desc: 'News tailored to your interests, topics, and country — updated in real time.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Globe2,
    title: 'Multiple Sources',
    desc: 'Aggregated from hundreds of publishers worldwide so you always get the full picture.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Bookmark,
    title: 'Save & Share',
    desc: 'Bookmark articles for later and share the stories that matter to you.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Bias Awareness',
    desc: 'Every article is analyzed for bias so you can read with full context.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
]

const Landing = () => {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className={`min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`} style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4 z-10">
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
            Skip →
          </button>
        </div>
      </header>

      {/* Hero image — kept exactly as-is per user request */}
      <div className="mx-4 mt-2 rounded-3xl overflow-hidden relative" style={{ minHeight: 300 }}>
        <div
          className="flex min-h-[300px] flex-col gap-4 bg-cover bg-center bg-no-repeat items-center justify-center p-6"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD4J18NiXS0kACFhmiW8xPkTXw1pshWyxz9nJe7xznkiuPCTiLTbdW97aLsxi87oYVFW_LdAZTe0CWCvq_oqsGyTiBMMXQM-XaVu5k9M-SaIzgIlQuSiqh1w36ur9Pv_9C-RMcD26wDl4-LN5-SdFHf2U-2dEFCSgYyKL7Bg94OfUaYrmnrO5Cknr62c1ZmjNDzIhIotqSQBGCXzQYn_flzIzjsZ_XV61xTiQuUAi1Q_0lCIchDufjRbSKtr1m9X168Oaz9v48zfjc")`
          }}
        >
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-white text-3xl font-black leading-tight tracking-tight drop-shadow-lg">
              Newsly
            </h1>
            <p className="text-white/80 text-sm font-normal leading-relaxed">
              Stay informed with personalized news
            </p>
          </div>
          <button
            onClick={() => navigate('/genres')}
            className="mt-2 flex items-center justify-center rounded-xl h-11 px-8 bg-[#3880f4] text-white text-sm font-bold tracking-wide shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Tagline */}
      <div className="px-6 pt-8 pb-2">
        <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Everything you need</h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Built for people who want news done right.</p>
      </div>

      {/* Feature cards */}
      <div className="px-5 pt-4 pb-12 grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className={`rounded-2xl p-4 flex flex-col gap-3 border transition-colors ${isDark ? 'bg-gray-900 border-gray-800/60' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <h3 className={`text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
              <p className={`text-xs leading-relaxed mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`pb-10 text-center px-6 pt-6 border-t ${isDark ? 'border-gray-800/50' : 'border-gray-200'}`}>
        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>© 2026 Newsly · <span className="hover:underline cursor-pointer">Privacy</span> · <span className="hover:underline cursor-pointer">Terms</span></p>
      </div>
    </div>
  )
}

export default Landing
