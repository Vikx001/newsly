import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Newspaper, List, Bookmark, Sun, Moon } from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate()

  const handleStartReading = () => {
    navigate('/genres')
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{fontFamily: 'Newsreader, "Noto Sans", sans-serif'}}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3">
          <div className="flex items-center gap-4 text-[#111418]">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">Newsly</h2>
          </div>
          <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
            <Sun size={20} />
          </button>
        </header>

        {/* Main Content */}
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            
            {/* Hero Section */}
            <div className="@container">
              <div className="@[480px]:p-4">
                <div
                  className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat @[480px]:gap-8 @[480px]:rounded-lg items-center justify-center p-4"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD4J18NiXS0kACFhmiW8xPkTXw1pshWyxz9nJe7xznkiuPCTiLTbdW97aLsxi87oYVFW_LdAZTe0CWCvq_oqsGyTiBMMXQM-XaVu5k9M-SaIzgIlQuSiqh1w36ur9Pv_9C-RMcD26wDl4-LN5-SdFHf2U-2dEFCSgYyKL7Bg94OfUaYrmnrO5Cknr62c1ZmjNDzIhIotqSQBGCXzQYn_flzIzjsZ_XV61xTiQuUAi1Q_0lCIchDufjRbSKtr1m9X168Oaz9v48zfjc")`
                  }}
                >
                  <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em]">
                      Newsly
                    </h1>
                    <h2 className="text-white text-sm font-normal leading-normal @[480px]:text-base @[480px]:font-normal @[480px]:leading-normal">
                      Stay informed with personalized news
                    </h2>
                  </div>
                  <button
                    onClick={handleStartReading}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 @[480px]:h-12 @[480px]:px-5 bg-[#3880f4] text-white text-sm font-bold leading-normal tracking-[0.015em] @[480px]:text-base @[480px]:font-bold @[480px]:leading-normal @[480px]:tracking-[0.015em]"
                  >
                    <span className="truncate">Get Started</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="flex flex-col gap-10 px-4 py-10 @container">
              <h1 className="text-[#111418] tracking-light text-[32px] font-bold leading-tight @[480px]:text-4xl @[480px]:font-black @[480px]:leading-tight @[480px]:tracking-[-0.033em] max-w-[720px]">
                Features
              </h1>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-0">
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dbdfe6] bg-white p-4 flex-col">
                  <div className="text-[#111418]">
                    <Newspaper size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111418] text-base font-bold leading-tight">Personalized Feed</h2>
                    <p className="text-[#60708a] text-sm font-normal leading-normal">Get news tailored to your interests.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dbdfe6] bg-white p-4 flex-col">
                  <div className="text-[#111418]">
                    <List size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111418] text-base font-bold leading-tight">Multiple Sources</h2>
                    <p className="text-[#60708a] text-sm font-normal leading-normal">Access news from various sources.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-3 rounded-lg border border-[#dbdfe6] bg-white p-4 flex-col">
                  <div className="text-[#111418]">
                    <Bookmark size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[#111418] text-base font-bold leading-tight">Save & Share</h2>
                    <p className="text-[#60708a] text-sm font-normal leading-normal">Save articles for later and share with friends.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                <a className="text-[#60708a] text-base font-normal leading-normal min-w-40" href="#">
                  Privacy Policy
                </a>
                <a className="text-[#60708a] text-base font-normal leading-normal min-w-40" href="#">
                  Terms of Service
                </a>
              </div>
              <p className="text-[#60708a] text-base font-normal leading-normal">
                ©2024 Newsly. All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing
