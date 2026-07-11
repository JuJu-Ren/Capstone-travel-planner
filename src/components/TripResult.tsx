import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripStop } from '../data/types'
import type { GeminiModel } from './PromptSection'

// ─── API keys ─────────────────────────────────────────────────────────────────
const OW_KEY     = import.meta.env.VITE_OPENWEATHER_KEY  as string
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY as string
const TM_KEY     = import.meta.env.VITE_TICKETMASTER_KEY  as string
const GEM_KEY    = import.meta.env.VITE_GEMINI_KEY        as string

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherDay {
  date: string
  condition: string
  icon: string
  high: number
  low: number
  avg: number
  precipitation: number
  windSpeed: number
  humidity: number
  isForecast: boolean
}

interface GooglePlace {
  id: string
  displayName: { text: string }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  formattedAddress?: string
  location: { latitude: number; longitude: number }
  photos?: { name: string }[]
  primaryType?: string
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  websiteUri?: string
  googleMapsUri?: string
}

interface TMEvent {
  id: string
  name: string
  url: string
  dates: { start: { localDate: string; localTime?: string } }
  _embedded?: { venues?: { name: string; location?: { latitude: string; longitude: string } }[] }
  classifications?: { segment?: { name: string }; genre?: { name: string } }[]
  images?: { url: string; width: number }[]
  priceRanges?: { min: number; max: number; currency: string }[]
}

interface GeminiItinerary {
  overview: string
  highlights: string[]
  stops: {
    stopName: string
    day1: { time: string; activity: string; tip?: string }[]
    day2: { time: string; activity: string; tip?: string }[]
    localTips: string[]
  }[]
  packingList: string[]
  bestTimeToGo: string
}

// ─── Category config ──────────────────────────────────────────────────────────

interface CatConfig { label: string; icon: string; textQuery: (city: string) => string; visitDuration: string; minRating?: number }

const CATEGORIES: Record<string, CatConfig> = {
  weather:       { label: 'Weather',       icon: '🌤', textQuery: () => '',    visitDuration: '' },
  'fine-dining': { label: 'Fine Dining',   icon: '🍽', textQuery: c => `fine dining highly rated restaurants in ${c}`,             visitDuration: '1–2 hrs',    minRating: 4.5 },
  'local-food':  { label: 'Local Food',    icon: '🍜', textQuery: c => `authentic local food regional specialties restaurants ${c}`, visitDuration: '45–90 min',  minRating: 4.0 },
  'arts-culture':{ label: 'Arts & Culture',icon: '🎨', textQuery: c => `museums art galleries cultural centers historic landmarks ${c}`, visitDuration: '1–3 hrs', minRating: 4.0 },
  shopping:      { label: 'Shopping',      icon: '🛍', textQuery: c => `boutiques vintage antique shops local stores bookstores ${c}`,  visitDuration: '1–2 hrs', minRating: 4.0 },
  markets:       { label: 'Markets',       icon: '🏪', textQuery: c => `farmers market flea market food hall local market ${c}`,        visitDuration: '1–2 hrs', minRating: 4.0 },
  events:        { label: 'Events',        icon: '🎭', textQuery: () => '',    visitDuration: '2–3 hrs' },
  nightlife:     { label: 'Nightlife',     icon: '🌙', textQuery: c => `cocktail bars jazz clubs rooftop bars wine bars speakeasies ${c}`, visitDuration: '2–4 hrs', minRating: 4.0 },
  scenic:        { label: 'Scenic',        icon: '🌿', textQuery: c => `scenic parks gardens waterfront viewpoints walking trails ${c}`,   visitDuration: '30–90 min', minRating: 4.0 },
  'hidden-gems': { label: 'Hidden Gems',   icon: '💎', textQuery: c => `hidden gems local favorites unique spots secret places ${c}`,     visitDuration: '30–60 min', minRating: 4.0 },
  itinerary:     { label: 'AI Plan',       icon: '✨', textQuery: () => '',    visitDuration: '' },
}

const CATEGORY_ORDER = ['weather','fine-dining','local-food','arts-culture','shopping','markets','events','nightlife','scenic','hidden-gems','itinerary']

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE:           'Free',
  PRICE_LEVEL_INEXPENSIVE:    '$',
  PRICE_LEVEL_MODERATE:       '$$',
  PRICE_LEVEL_EXPENSIVE:      '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

const BOOKING_LINKS: Record<string, { label: string; url: string }> = {
  LIRR:       { label: 'Buy LIRR Tickets',        url: 'https://www.mta.info/lirr' },
  MetroNorth: { label: 'Buy Metro-North Tickets',  url: 'https://www.mta.info/mnr' },
  PATH:       { label: 'PATH Fares & Schedules',   url: 'https://www.panynj.gov/path/en/index.html' },
  Amtrak:     { label: 'View Routes on Amtrak.com',url: 'https://www.amtrak.com' },
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

async function fetchWeather(lat: number, lng: number, startDate: string): Promise<WeatherDay[]> {
  try {
    const days = daysUntil(startDate)

    if (startDate && days > 0 && days <= 5) {
      // 5-day forecast (3-hour intervals)
      const r = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=imperial`
      )
      if (!r.ok) throw new Error('forecast failed')
      const d = await r.json()
      // Group by date
      const grouped: Record<string, { highs: number[]; lows: number[]; icons: string[]; winds: number[]; pops: number[]; humids: number[]; descs: string[] }> = {}
      for (const item of d.list) {
        const date = item.dt_txt.slice(0, 10)
        if (!grouped[date]) grouped[date] = { highs: [], lows: [], icons: [], winds: [], pops: [], humids: [], descs: [] }
        grouped[date].highs.push(item.main.temp_max)
        grouped[date].lows.push(item.main.temp_min)
        grouped[date].icons.push(item.weather[0].icon)
        grouped[date].winds.push(item.wind.speed)
        grouped[date].pops.push((item.pop ?? 0) * 100)
        grouped[date].humids.push(item.main.humidity)
        grouped[date].descs.push(item.weather[0].description)
      }
      return Object.entries(grouped).slice(0, 5).map(([date, v]) => ({
        date,
        condition: v.descs[Math.floor(v.descs.length / 2)],
        icon: `https://openweathermap.org/img/wn/${v.icons[Math.floor(v.icons.length / 2)]}@2x.png`,
        high: Math.round(Math.max(...v.highs)),
        low:  Math.round(Math.min(...v.lows)),
        avg:  Math.round(v.highs.reduce((a, b) => a + b, 0) / v.highs.length),
        precipitation: Math.round(Math.max(...v.pops)),
        windSpeed: Math.round(v.winds.reduce((a, b) => a + b, 0) / v.winds.length),
        humidity:  Math.round(v.humids.reduce((a, b) => a + b, 0) / v.humids.length),
        isForecast: true,
      }))
    }

    // Current weather
    const r = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=imperial`
    )
    if (!r.ok) return []
    const d = await r.json()
    return [{
      date: new Date().toISOString().slice(0, 10),
      condition: d.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`,
      high: Math.round(d.main.temp_max),
      low:  Math.round(d.main.temp_min),
      avg:  Math.round(d.main.temp),
      precipitation: 0,
      windSpeed: Math.round(d.wind.speed),
      humidity: d.main.humidity,
      isForecast: false,
    }]
  } catch { return [] }
}

async function fetchGooglePlaces(lat: number, lng: number, cityName: string, category: string): Promise<GooglePlace[]> {
  if (!GOOGLE_KEY || GOOGLE_KEY === 'your_google_places_api_key') return []
  const cfg = CATEGORIES[category]
  if (!cfg?.textQuery) return []
  const query = cfg.textQuery(cityName)
  if (!query) return []
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': [
          'places.id','places.displayName','places.rating','places.userRatingCount',
          'places.priceLevel','places.formattedAddress','places.location','places.photos',
          'places.primaryType','places.regularOpeningHours','places.websiteUri','places.googleMapsUri',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 } },
        maxResultCount: 20,
        ...(cfg.minRating ? { minRating: cfg.minRating } : {}),
      }),
    })
    if (!r.ok) { console.error('Google Places error', r.status, await r.json().catch(() => ({}))); return [] }
    const d = await r.json()
    return d.places ?? []
  } catch (e) { console.error('Google Places fetch failed', e); return [] }
}

async function fetchTicketmaster(lat: number, lng: number, startDate: string, endDate: string): Promise<TMEvent[]> {
  if (!TM_KEY || TM_KEY === 'your_ticketmaster_api_key') return []
  try {
    const params = new URLSearchParams({ apikey: TM_KEY, latlong: `${lat},${lng}`, radius: '25', unit: 'miles', size: '20' })
    if (startDate) params.set('startDateTime', `${startDate}T00:00:00Z`)
    if (endDate)   params.set('endDateTime',   `${endDate}T23:59:59Z`)
    const r = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`)
    if (!r.ok) return []
    const d = await r.json()
    return d._embedded?.events ?? []
  } catch { return [] }
}

async function fetchGeminiItinerary(
  stops: TripStop[], prompt: string, model: GeminiModel,
  weatherMap: Record<string, WeatherDay[]>, startDate: string, endDate: string,
): Promise<GeminiItinerary | null> {
  if (!GEM_KEY || GEM_KEY === 'your_gemini_api_key') return null
  try {
    const stopsText = stops.map(s => {
      const w = weatherMap[s.id]?.[0]
      return `Stop: ${s.displayName} (${s.system})\nLines: ${s.lines.slice(0, 3).join(', ')}\nWeather: ${w ? `${w.avg}°F, ${w.condition}` : 'unavailable'}`
    }).join('\n\n')

    const dateText = startDate ? `Travel dates: ${startDate} to ${endDate || startDate}` : 'Weekend trip'

    const fullPrompt = `You are an expert train travel planner for the US Northeast.
Generate a detailed, personalized weekend trip itinerary. Respond ONLY with valid JSON.

${dateText}
${stopsText}

User request: "${prompt || 'A fun weekend trip'}"

Respond with this exact JSON structure (no markdown, no explanation):
{
  "overview": "2-3 sentence trip overview",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "stops": [
    {
      "stopName": "exact stop name",
      "day1": [{"time": "9:00 AM", "activity": "specific activity", "tip": "optional local tip"}],
      "day2": [{"time": "9:00 AM", "activity": "specific activity", "tip": "optional local tip"}],
      "localTips": ["tip 1", "tip 2"]
    }
  ],
  "packingList": ["item 1", "item 2"],
  "bestTimeToGo": "season/timing recommendation"
}`

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEM_KEY}`
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    })
    if (!r.ok) { const e = await r.json().catch(() => ({})); console.error('Gemini error', r.status, e); return null }
    const d = await r.json()
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) return null
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    return JSON.parse(cleaned) as GeminiItinerary
  } catch (e) { console.error('Gemini failed', e); return null }
}

function photoUrl(photoName: string) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${GOOGLE_KEY}`
}

function googleMapsLink(place: GooglePlace) {
  return place.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName.text)}`
}

// ─── Map helper ───────────────────────────────────────────────────────────────

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.flyTo([lat, lng], 14, { duration: 1 }) }, [lat, lng, map])
  return null
}

// ─── Place card ───────────────────────────────────────────────────────────────

function PlaceCard({ place, category }: { place: GooglePlace; category: string }) {
  const cfg = CATEGORIES[category]
  const photo = place.photos?.[0]?.name ? photoUrl(place.photos[0].name) : null
  const isOpen = place.regularOpeningHours?.openNow

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {photo && (
        <img src={photo} alt={place.displayName.text} className="w-full h-32 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-sm text-gray-800 dark:text-white leading-tight">{place.displayName.text}</p>
          {place.priceLevel && (
            <span className="text-xs text-gray-400 flex-shrink-0 font-medium">{PRICE_LABELS[place.priceLevel] ?? ''}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {place.rating && (
            <span className="text-xs font-semibold text-amber-500">⭐ {place.rating.toFixed(1)}</span>
          )}
          {place.userRatingCount && (
            <span className="text-xs text-gray-400">({place.userRatingCount.toLocaleString()} reviews)</span>
          )}
          {isOpen !== undefined && (
            <span className={`text-xs font-semibold ${isOpen ? 'text-green-500' : 'text-red-400'}`}>
              {isOpen ? '● Open' : '● Closed'}
            </span>
          )}
        </div>

        {place.formattedAddress && (
          <p className="text-xs text-gray-400 mb-2 leading-relaxed">{place.formattedAddress}</p>
        )}

        {place.regularOpeningHours?.weekdayDescriptions?.[0] && (
          <p className="text-xs text-gray-400 mb-2 truncate">🕐 {place.regularOpeningHours.weekdayDescriptions[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]}</p>
        )}

        {cfg.visitDuration && (
          <p className="text-xs text-blue-400 mb-2">⏱ Est. visit: {cfg.visitDuration}</p>
        )}

        <div className="flex gap-2 mt-2">
          <a href={googleMapsLink(place)} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-xs py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors font-semibold">
            📌 Google Maps
          </a>
          {place.websiteUri && (
            <a href={place.websiteUri} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center text-xs py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 transition-colors font-semibold">
              🌐 Website
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: TMEvent }) {
  const venue = event._embedded?.venues?.[0]
  const genre = event.classifications?.[0]?.genre?.name
  const seg   = event.classifications?.[0]?.segment?.name
  const img   = event.images?.sort((a, b) => b.width - a.width)[0]?.url
  const price = event.priceRanges?.[0]

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {img && <img src={img} alt={event.name} className="w-full h-32 object-cover" />}
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1 leading-tight">{event.name}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {seg && <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-full font-semibold">{seg}</span>}
          {genre && genre !== seg && <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">{genre}</span>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          📅 {event.dates.start.localDate}{event.dates.start.localTime ? ` · ${event.dates.start.localTime.slice(0, 5)}` : ''}
        </p>
        {venue && <p className="text-xs text-gray-400 mb-1">📍 {venue.name}</p>}
        {price && <p className="text-xs text-green-500 font-semibold mb-2">${price.min}–${price.max} {price.currency}</p>}
        <a href={event.url} target="_blank" rel="noopener noreferrer"
          className="block w-full text-center text-xs py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-colors font-semibold">
          🎟 Get Tickets
        </a>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedStops: TripStop[]
  prompt: string
  model: GeminiModel
  startDate: string
  endDate: string
  onBack: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TripResult({ selectedStops, prompt, model, startDate, endDate, onBack }: Props) {
  const [activeStop, setActiveStop] = useState<TripStop>(selectedStops[0])
  const [activeTab,  setActiveTab]  = useState('weather')

  // Per-stop, per-category cache
  const [placeCache, setPlaceCache]   = useState<Record<string, Record<string, GooglePlace[]>>>({})
  const [eventCache, setEventCache]   = useState<Record<string, TMEvent[]>>({})
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherDay[]>>({})
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set())
  const [itinerary,    setItinerary]  = useState<GeminiItinerary | null>(null)
  const [itinLoading,  setItinLoading]= useState(false)
  const [itinError,    setItinError]  = useState(false)

  const stopKey = activeStop.id

  // Fetch weather for active stop
  useEffect(() => {
    if (weatherCache[stopKey] !== undefined) return
    fetchWeather(activeStop.lat, activeStop.lng, startDate).then(days => {
      setWeatherCache(prev => ({ ...prev, [stopKey]: days }))
    })
  }, [stopKey])

  // Lazy-fetch places/events when tab changes
  useEffect(() => {
    if (activeTab === 'weather' || activeTab === 'itinerary') return
    const cacheKey = `${stopKey}::${activeTab}`

    if (activeTab === 'events') {
      if (eventCache[stopKey] !== undefined) return
      setLoadingTabs(prev => new Set(prev).add(cacheKey))
      fetchTicketmaster(activeStop.lat, activeStop.lng, startDate, endDate).then(events => {
        setEventCache(prev => ({ ...prev, [stopKey]: events }))
        setLoadingTabs(prev => { const n = new Set(prev); n.delete(cacheKey); return n })
      })
    } else {
      if (placeCache[stopKey]?.[activeTab] !== undefined) return
      setLoadingTabs(prev => new Set(prev).add(cacheKey))
      fetchGooglePlaces(activeStop.lat, activeStop.lng, activeStop.displayName, activeTab).then(places => {
        setPlaceCache(prev => ({ ...prev, [stopKey]: { ...(prev[stopKey] ?? {}), [activeTab]: places } }))
        setLoadingTabs(prev => { const n = new Set(prev); n.delete(cacheKey); return n })
      })
    }
  }, [activeTab, stopKey])

  // Fetch Gemini itinerary when itinerary tab opened (once)
  useEffect(() => {
    if (activeTab !== 'itinerary' || itinerary || itinLoading) return
    setItinLoading(true); setItinError(false)
    fetchGeminiItinerary(selectedStops, prompt, model, weatherCache, startDate, endDate).then(result => {
      if (result) setItinerary(result); else setItinError(true)
      setItinLoading(false)
    })
  }, [activeTab])

  const weather  = weatherCache[stopKey] ?? []
  const places   = placeCache[stopKey]?.[activeTab] ?? []
  const events   = eventCache[stopKey] ?? []
  const isLoading = loadingTabs.has(`${stopKey}::${activeTab}`)
  const booking  = BOOKING_LINKS[activeStop.system]
  const systemIcon = { LIRR: '🚋', MetroNorth: '🚉', PATH: '🚇', Amtrak: '🚂' }[activeStop.system] ?? '🚂'

  // Map markers for active tab
  const mapMarkers: { lat: number; lng: number; label: string; icon: string }[] = activeTab === 'events'
    ? events
        .filter(e => e._embedded?.venues?.[0]?.location)
        .map(e => ({
          lat: parseFloat(e._embedded!.venues![0].location!.latitude),
          lng: parseFloat(e._embedded!.venues![0].location!.longitude),
          label: e.name, icon: '🎭',
        }))
    : places.map(p => ({ lat: p.location.latitude, lng: p.location.longitude, label: p.displayName.text, icon: CATEGORIES[activeTab]?.icon ?? '📍' }))

  const stopItinerary = itinerary?.stops.find(s =>
    s.stopName.toLowerCase().includes(activeStop.name.toLowerCase()) ||
    activeStop.name.toLowerCase().includes(s.stopName.toLowerCase())
  ) ?? itinerary?.stops[selectedStops.findIndex(s => s.id === activeStop.id)] ?? null

  return (
    <div className="flex h-[calc(100vh-64px)]">

      {/* ── Left panel ── */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={onBack} className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 mb-3">← Back to map</button>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-800 dark:text-white">Your Trip</h2>
            <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-semibold">
              🤖 {model.replace('gemini-', '').replace('-', ' ')}
            </span>
          </div>
          {prompt && <p className="text-xs text-gray-400 italic mb-2 line-clamp-2">"{prompt}"</p>}
          {startDate && (
            <p className="text-xs text-blue-400 mb-2">📅 {startDate}{endDate && endDate !== startDate ? ` → ${endDate}` : ''}</p>
          )}
          {/* Stop selector */}
          <div className="flex flex-wrap gap-1.5">
            {selectedStops.map((s, i) => (
              <button key={s.id} onClick={() => setActiveStop(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  activeStop.id === s.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}>
                {i > 0 && <span className="opacity-50 mr-1">→</span>}{s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category tabs (vertical) */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
          {CATEGORY_ORDER.map(cat => {
            const cfg = CATEGORIES[cat]
            return (
              <button key={cat} onClick={() => setActiveTab(cat)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-all border-b-2 ${
                  activeTab === cat
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}>
                <span className="text-base">{cfg.icon}</span>
                <span className="font-medium" style={{ fontSize: 9 }}>{cfg.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-3">

          {/* Weather tab */}
          {activeTab === 'weather' && (
            <div className="space-y-3">
              <img src={activeStop.photo} alt={activeStop.name} className="w-full h-28 object-cover rounded-xl" />
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">{systemIcon} {activeStop.displayName}</h3>
                {activeStop.tagline && <p className="text-xs text-blue-400 italic mt-0.5">{activeStop.tagline}</p>}
              </div>

              {weather.length === 0 && (
                <div className="h-20 bg-sky-50 dark:bg-sky-900/20 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-sky-400 animate-pulse">Loading weather…</span>
                </div>
              )}

              {weather.map((day, i) => (
                <div key={i} className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-100 dark:border-sky-800">
                  {weather.length > 1 && (
                    <p className="text-xs font-bold text-sky-600 dark:text-sky-400 mb-2">
                      {i === 0 ? 'Today' : new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {day.isForecast && <span className="ml-2 text-[10px] bg-sky-100 dark:bg-sky-800 px-1.5 py-0.5 rounded-full">Forecast</span>}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <img src={day.icon} alt={day.condition} className="w-12 h-12 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 dark:text-white">
                        {day.high}°<span className="text-gray-400 font-normal"> / {day.low}°F</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{day.condition}</p>
                      <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                        <span>💧 {day.humidity}%</span>
                        <span>💨 {day.windSpeed} mph</span>
                        {day.precipitation > 0 && <span>🌧 {day.precipitation}% rain</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!startDate && weather.length > 0 && (
                <p className="text-[10px] text-gray-400 text-center">Add travel dates above for a 5-day forecast</p>
              )}

              {/* Train booking */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{systemIcon} {activeStop.system === 'MetroNorth' ? 'Metro-North' : activeStop.system}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {activeStop.lines.slice(0, 4).map(l => (
                    <span key={l} className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 rounded font-medium">{l}</span>
                  ))}
                </div>
                <a href={booking.url} target="_blank" rel="noopener noreferrer"
                  className="block text-center text-xs py-2 bg-white dark:bg-gray-700 text-blue-500 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold">
                  {booking.label} →
                </a>
              </div>
            </div>
          )}

          {/* Places tabs (Google Places) */}
          {activeTab !== 'weather' && activeTab !== 'events' && activeTab !== 'itinerary' && (
            <div>
              {!GOOGLE_KEY || GOOGLE_KEY === 'your_google_places_api_key' ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">{CATEGORIES[activeTab]?.icon}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Google Places API key required</p>
                  <p className="text-xs text-gray-400">Add <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_GOOGLE_PLACES_KEY</code> to your .env</p>
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
                </div>
              ) : places.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">{CATEGORIES[activeTab]?.icon}</p>
                  <p className="text-sm text-gray-400">No results found near {activeStop.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-2">{places.length} places found near {activeStop.name}</p>
                  {places.map(p => <PlaceCard key={p.id} place={p} category={activeTab} />)}
                </div>
              )}
            </div>
          )}

          {/* Events tab (Ticketmaster) */}
          {activeTab === 'events' && (
            <div>
              {!TM_KEY || TM_KEY === 'your_ticketmaster_api_key' ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎭</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ticketmaster API key required</p>
                  <p className="text-xs text-gray-400">Add <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">VITE_TICKETMASTER_KEY</code> to your .env</p>
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🎭</p>
                  <p className="text-sm text-gray-400">No events found{startDate ? ' for these dates' : ''} near {activeStop.name}</p>
                  {!startDate && <p className="text-xs text-gray-400 mt-1">Add travel dates to filter events</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 mb-2">{events.length} events near {activeStop.name}</p>
                  {events.map(e => <EventCard key={e.id} event={e} />)}
                </div>
              )}
            </div>
          )}

          {/* AI Itinerary tab */}
          {activeTab === 'itinerary' && (
            <div className="space-y-4">
              {itinLoading && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3 animate-spin">✨</div>
                  <p className="text-sm text-purple-500 font-semibold">Generating with {model}…</p>
                  <p className="text-xs text-gray-400 mt-1">Building your personalized itinerary</p>
                </div>
              )}
              {itinError && (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">🤖</p>
                  <p className="text-sm text-red-400">Couldn't generate itinerary</p>
                  <p className="text-xs text-gray-400 mt-1">Check your Gemini API key in .env</p>
                </div>
              )}
              {itinerary && !itinLoading && (
                <>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Overview</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{itinerary.overview}</p>
                    {itinerary.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {itinerary.highlights.map((h, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">{h}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {stopItinerary && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{activeStop.name} Schedule</h4>

                      {[{ label: 'Day 1', items: stopItinerary.day1 }, { label: 'Day 2', items: stopItinerary.day2 }].map(({ label, items }) => (
                        <div key={label} className="bg-white dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
                          <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-2">{label}</p>
                          <div className="space-y-2">
                            {items.map((item, i) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5 font-medium">{item.time}</span>
                                <div>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.activity}</p>
                                  {item.tip && <p className="text-[10px] text-gray-400 italic mt-0.5">{item.tip}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {stopItinerary.localTips.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800">
                          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2">Local Tips</p>
                          {stopItinerary.localTips.map((t, i) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400">• {t}</p>)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Best Time</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{itinerary.bestTimeToGo}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Pack</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{itinerary.packingList.join(' · ')}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <MapContainer center={[activeStop.lat, activeStop.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <MapRecenter lat={activeStop.lat} lng={activeStop.lng} />

          {/* Station */}
          <Marker position={[activeStop.lat, activeStop.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="font-size:28px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">${{ LIRR:'🚋',MetroNorth:'🚉',PATH:'🚇',Amtrak:'🚂' }[activeStop.system] ?? '🚂'}</div>`,
              iconSize: [32, 32], iconAnchor: [16, 16],
            })}>
            <Popup><b>{activeStop.displayName}</b></Popup>
          </Marker>

          {/* POI / event markers */}
          {mapMarkers.map((m, i) => (
            <Marker key={i} position={[m.lat, m.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="background:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${m.icon}</div>`,
                iconSize: [28, 28], iconAnchor: [14, 14],
              })}>
              <Popup><b>{m.label}</b></Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Active tab label overlay */}
        <div className="absolute top-3 left-3 z-[500] bg-white dark:bg-gray-800 rounded-xl px-3 py-1.5 shadow-md border border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <span>{CATEGORIES[activeTab]?.icon}</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{CATEGORIES[activeTab]?.label}</span>
          {mapMarkers.length > 0 && (
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full px-1.5 font-bold">{mapMarkers.length}</span>
          )}
        </div>
      </div>
    </div>
  )
}
