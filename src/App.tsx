import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import TrainMap from './components/TrainMap'
import PromptSection from './components/PromptSection'
import TripResult from './components/TripResult'
import type { TripStop } from './data/types'
import type { GeminiModel } from './components/PromptSection'

type Page = 'map' | 'loading' | 'result'

export default function App() {
  const [page, setPage] = useState<Page>('map')
  const [selectedStops, setSelectedStops] = useState<TripStop[]>([])
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<GeminiModel>('gemini-2.5-flash')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationRequested, setLocationRequested] = useState(false)

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

  const handleGenerate = (p: string, m: GeminiModel) => {
    if (selectedStops.length === 0) return
    setPrompt(p)
    setModel(m)
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
            model={model}
            onBack={() => setPage('map')}
          />
        )}
      </main>

      {page !== 'result' && <Footer />}
    </div>
  )
}
