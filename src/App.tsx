import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import TrainMap from './components/TrainMap'
import PromptSection from './components/PromptSection'
import TripResult from './components/TripResult'
import type { TripStop } from './data/types'

type Page = 'map' | 'loading' | 'result'

export default function App() {
  const [page, setPage] = useState<Page>('map')
  const [selectedStops, setSelectedStops] = useState<TripStop[]>([])
  const [prompt, setPrompt] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationRequested, setLocationRequested] = useState(false)
  const [legendOpen, setLegendOpen] = useState(true)

  useEffect(() => {
    if (!locationRequested && 'geolocation' in navigator) {
      setLocationRequested(true)
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      )
    }
  }, [])

  const handleSelectStop = (stop: TripStop) => {
    setSelectedStops(prev => {
      if (prev.some(s => s.id === stop.id)) {
        return prev.filter(s => s.id !== stop.id)
      }
      if (prev.length >= 3) return prev
      return [...prev, stop]
    })
  }

  const handleClearStop = (id: string) => {
    setSelectedStops(prev => prev.filter(s => s.id !== id))
  }

  const handleGenerate = (p: string) => {
    if (selectedStops.length === 0) return
    setPrompt(p)
    setPage('loading')
    setTimeout(() => setPage('result'), 1800)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header onNavigate={() => { setPage('map'); setSelectedStops([]) }} />

      <main className="flex-1 flex flex-col">
        {(page === 'map' || page === 'loading') && (
          <>
            <div className="relative" style={{ height: 'calc(100vh - 64px - 220px)', minHeight: 380 }}>
              <TrainMap
                selectedStops={selectedStops}
                onSelectStop={handleSelectStop}
                userLocation={userLocation}
              />

              {/* Legend overlay */}
              <div className={`absolute top-3 left-3 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg text-xs ${legendOpen ? 'overflow-y-auto' : ''}`} style={{ maxWidth: 230, maxHeight: legendOpen ? 'calc(100% - 24px)' : 'none' }}>
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <p className="font-bold text-gray-800 dark:text-white">🗺 Train Network</p>
                  <button
                    onClick={() => setLegendOpen(o => !o)}
                    className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-base leading-none flex-shrink-0"
                    title={legendOpen ? 'Minimize' : 'Expand'}
                  >
                    {legendOpen ? '−' : '+'}
                  </button>
                </div>

                {legendOpen && <><p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px] mb-1.5 px-3">MTA (New York)</p>
                <div className="space-y-1 mb-3 px-3">
                  {[
                    { color: '#003087', label: 'LIRR – Main & Branches' },
                    { color: '#0099CC', label: 'LIRR – Port Jefferson' },
                    { color: '#6B2C91', label: 'LIRR – Port Washington' },
                    { color: '#009E60', label: 'LIRR – Babylon / South Shore' },
                    { color: '#EE7623', label: 'LIRR – Montauk' },
                    { color: '#DA291C', label: 'LIRR – Far Rockaway' },
                    { color: '#00A3E0', label: 'LIRR – Long Beach' },
                    { color: '#A2003E', label: 'LIRR – Hempstead / W. Hempstead' },
                    { color: '#009B3A', label: 'Metro-North – Hudson Line' },
                    { color: '#7B2D8B', label: 'Metro-North – Harlem Line' },
                    { color: '#0060A9', label: 'Metro-North – New Haven Line' },
                    { color: '#FF6600', label: 'Metro-North – Port Jervis Line' },
                    { color: '#FF9900', label: 'Metro-North – Pascack Valley' },
                    { color: '#DA291C', label: 'PATH – NWK–WTC' },
                    { color: '#0052A5', label: 'PATH – JSQ–33rd St' },
                    { color: '#009A44', label: 'PATH – HOB–33rd St' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <span style={{ display: 'inline-block', width: 20, height: 3, background: l.color, borderRadius: 2, flexShrink: 0 }} />
                      <span className="text-gray-600 dark:text-gray-400 leading-tight">{l.label}</span>
                    </div>
                  ))}
                </div>

                <p className="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px] mb-1.5 px-3">Amtrak (National)</p>
                <div className="space-y-1 mb-3 px-3">
                  {[
                    { color: '#CE1126', label: 'Northeast Corridor (Acela)' },
                    { color: '#CC9900', label: 'Crescent' },
                    { color: '#006400', label: 'Empire Builder' },
                    { color: '#FF6600', label: 'California Zephyr' },
                    { color: '#CC0000', label: 'Southwest Chief' },
                    { color: '#009900', label: 'Coast Starlight' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <span style={{ display: 'inline-block', width: 20, height: 3, background: l.color, borderRadius: 2, flexShrink: 0 }} />
                      <span className="text-gray-600 dark:text-gray-400">{l.label}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 space-y-1 px-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#003087] border border-white inline-block" />
                    <span className="text-gray-500 dark:text-gray-400">LIRR stop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7B2D8B] border border-white inline-block" />
                    <span className="text-gray-500 dark:text-gray-400">Metro-North stop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DA291C] border border-white inline-block" />
                    <span className="text-gray-500 dark:text-gray-400">PATH stop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-700 inline-block" />
                    <span className="text-gray-500 dark:text-gray-400">Amtrak city (selectable)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-600 inline-block" />
                    <span className="text-gray-500 dark:text-gray-400">Selected stop</span>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-1.5 italic">Zoom in to see individual MTA stops</p>
                </div>
                <div className="pb-1" /></>}
              </div>

              {/* Selection counter */}
              {selectedStops.length > 0 && (
                <div className="absolute top-3 right-3 z-[1000] bg-amber-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
                  {selectedStops.length}/3 stops selected
                </div>
              )}

              {/* Loading overlay */}
              {page === 'loading' && (
                <div className="absolute inset-0 z-[2000] bg-black/50 flex flex-col items-center justify-center gap-4">
                  <div className="text-5xl animate-bounce">🚂</div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-5 shadow-2xl text-center">
                    <p className="font-bold text-gray-800 dark:text-white text-lg">Planning your route...</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      {selectedStops.map(s => s.name).join(' → ')}
                    </p>
                    <div className="mt-4 flex gap-1.5 justify-center">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <PromptSection
              selectedStops={selectedStops}
              onGenerate={handleGenerate}
              onClearStop={handleClearStop}
            />
          </>
        )}

        {page === 'result' && (
          <TripResult
            selectedStops={selectedStops}
            prompt={prompt}
            onBack={() => setPage('map')}
          />
        )}
      </main>

      {page !== 'result' && <Footer />}
    </div>
  )
}
