import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Cpu, Building, Trophy, Beaker, Heart, Film, Megaphone, Newspaper, Globe } from 'lucide-react'
import { setStoredGenres } from '../utils/storage'
import { GENRES } from '../utils/genres'

const GenreSelection = () => {
  const [selectedGenres, setSelectedGenres] = useState(['technology', 'business', 'sports'])
  const navigate = useNavigate()

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

  const handleSkip = () => {
    navigate('/feed')
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Newsreader, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f1f2f4] px-10 py-3">
          <div className="flex items-center gap-4 text-[#121417]">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-[#121417] text-lg font-bold leading-tight tracking-[-0.015em]">Newsly</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f1f2f4] text-[#121417] text-sm font-bold leading-normal tracking-[0.015em]"
            >
              <span className="truncate">Skip</span>
            </button>
            <button
              onClick={handleBack}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 bg-[#f1f2f4] text-[#121417] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </header>
        
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
            <h2 className="text-[#121417] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">Choose Your Interests</h2>
            
            <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              {GENRES.map((genre) => {
                const Icon = genre.icon
                const isSelected = selectedGenres.includes(genre.id)
                return (
                  <div 
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`flex flex-1 gap-3 rounded-lg border p-4 items-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#346dca] bg-[#e8f0fe]' 
                        : 'border-[#dde0e4] bg-white hover:border-[#346dca]'
                    }`}
                  >
                    <div className={`${isSelected ? 'text-[#346dca]' : 'text-[#121417]'}`}>
                      <Icon size={24} />
                    </div>
                    <h2 className={`text-base font-bold leading-tight ${isSelected ? 'text-[#346dca]' : 'text-[#121417]'}`}>
                      {genre.name}
                    </h2>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-between">
                <button
                  onClick={handleContinue}
                  disabled={selectedGenres.length === 0}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#346dca] text-white text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">Continue</span>
                </button>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f1f2f4] text-[#121417] text-sm font-bold leading-normal tracking-[0.015em]">
                  <span className="truncate">{selectedGenres.length} categories selected</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenreSelection
