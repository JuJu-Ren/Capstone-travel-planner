import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripStop } from '../data/types'
import type { GeminiModel } from './PromptSection'

// ─── API keys (set in .env) ───────────────────────────────────────────────────
const OW_KEY  = import.meta.env.VITE_OPENWEATHER_KEY  as string
const FSQ_KEY = import.meta.env.VITE_FOURSQUARE_KEY   as string
const GEM_KEY = import.meta.env.VITE_GEMINI_KEY       as string

// ─── Types ────────────────────────────────────────────────────────────────────

interface Weather {
  temp: number
  feels: number
  desc: string
  icon: string
  humidity: number
  wind: number
}

export interface FoursquarePOI {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  category: string
  address?: string
  distance?: number
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

const POI_ICONS: Record<string, string> = {
  food: '🍜', art: '🎨', history: '🏛', nature: '🌿', event: '🎉',
  shopping: '🛍', museum: '🖼', nightlife: '🌙', culture: '🎭',
  photography: '📷', default: '📍',
}

const FSQ_CATEGORIES: Record<string, string> = {
  food:         '13065,13032,13003,13062',
  art:          '10004,10000',
  history:      '16011,10027',
  culture:      '10000,10028',
  events:       '10012',
  nature:       '16032,16019',
  architecture: '10040,16011',
  museums:      '10027',
  shopping:     '17114,17000',
  nightlife:    '13003,13029',
  traditions:   '10027,10000',
  photography:  '16032,16000',
}

const FSQ_TYPE_MAP: Record<string, string> = {
  '13': 'food', '10004': 'art', '10027': 'museum', '16011': 'history',
  '10000': 'culture', '16032': 'nature', '16019': 'nature', '17': 'shopping',
  '13029': 'nightlife', '10012': 'event', '10040': 'history',
}

const BOOKING_LINKS: Record<string, { label: string; url: string }> = {
  LIRR:       { label: 'Buy LIRR Tickets on MTA.info', url: 'https://www.mta.info/lirr' },
  MetroNorth: { label: 'Buy Metro-North Tickets on MTA.info', url: 'https://www.mta.info/mnr' },
  PATH:       { label: 'PATH Fares & Schedules', url: 'https://www.panynj.gov/path/en/index.html' },
  Amtrak:     { label: 'View All Routes on Amtrak.com', url: 'https://www.amtrak.com' },
}

const ALL_CATEGORIES = Object.keys(POI_ICONS).filter(k => k !== 'default')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseInterests(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  return Object.keys(FSQ_CATEGORIES).filter(k => lower.includes(k) || lower.includes('#' + k))
}

function googleMapsUrl(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

// ─── API fetchers ─────────────────────────────────────────────────────────────

async function fetchWeather(lat: number, lng: number): Promise<Weather | null> {
  try {
    const r = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=imperial`
    )
    if (!r.ok) return null
    const d = await r.json()
    return {
      temp:     Math.round(d.main.temp),
      feels:    Math.round(d.main.feels_like),
      desc:     d.weather[0].description,
      icon:     `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`,
      humidity: d.main.humidity,
      wind:     Math.round(d.wind.speed),
    }
  } catch { return null }
}

async function fetchFoursquarePOIs(lat: number, lng: number, interests: string[]): Promise<FoursquarePOI[]> {
  try {
    const cats = interests.length > 0
      ? [...new Set(interests.flatMap(i => (FSQ_CATEGORIES[i] ?? '').split(',')))].filter(Boolean).join(',')
      : Object.values(FSQ_CATEGORIES).flatMap(v => v.split(',')).filter(Boolean).slice(0, 20).join(',')

    const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=1500&limit=30&categories=${cats}`
    const r = await fetch(url, {
      headers: { Authorization: FSQ_KEY, Accept: 'application/json' },
    })
    if (!r.ok) return []
    const d = await r.json()
    return (d.results ?? []).map((p: Record<string, unknown>) => {
      const cats = (p.categories as { id: number }[] | undefined) ?? []
      const firstCat = String(cats[0]?.id ?? '')
      const type = FSQ_TYPE_MAP[firstCat] ?? FSQ_TYPE_MAP[firstCat.slice(0, 2)] ?? 'default'
      const geo = p.geocodes as { main?: { latitude: number; longitude: number } } | undefined
      const loc = p.location as { formatted_address?: string } | undefined
      return {
        id:       String(p.fsq_id),
        name:     String(p.name),
        lat:      geo?.main?.latitude ?? lat,
        lng:      geo?.main?.longitude ?? lng,
        type,
        category: (cats[0] as unknown as { name: string })?.name ?? '',
        address:  loc?.formatted_address,
        distance: p.distance as number | undefined,
      } as FoursquarePOI
    })
  } catch { return [] }
}

async function fetchGeminiItinerary(
  stops: TripStop[],
  prompt: string,
  weatherMap: Record<string, Weather | null>,
  poisMap: Record<string, FoursquarePOI[]>,
  model: GeminiModel,
): Promise<GeminiItinerary | null> {
  try {
    const stopsText = stops.map(s => {
      const w = weatherMap[s.id]
      const pois = (poisMap[s.id] ?? []).slice(0, 10).map(p => `- ${p.name} (${p.category})`).join('\n')
      return `
Stop: ${s.displayName} (${s.system})
Lines: ${s.lines.slice(0, 3).join(', ')}
Weather: ${w ? `${w.temp}°F, ${w.desc}, ${w.humidity}% humidity` : 'unavailable'}
Nearby places:
${pois || '(no data)'}`
    }).join('\n\n')

    const systemPrompt = `You are an expert train travel planner for the US Northeast.
Generate a detailed, personalized weekend trip itinerary based on the user's request.
Respond ONLY with valid JSON — no markdown, no explanation, just the JSON object.`

    const userPrompt = `Create a weekend trip itinerary for these train stops:

${stopsText}

User's request: "${prompt || 'A fun weekend trip'}"

Respond with this exact JSON structure:
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
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    })
    if (!r.ok) return null
    const d = await r.json()
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) return null
    return JSON.parse(raw) as GeminiItinerary
  } catch { return null }
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.flyTo([lat, lng], 14, { duration: 1 }) }, [lat, lng, map])
  return null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  selectedStops: TripStop[]
  prompt: string
  model: GeminiModel
  onBack: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TripResult({ selectedStops, prompt, model, onBack }: Props) {
  const [activeStop, setActiveStop] = useState<TripStop>(selectedStops[0])
  const [weatherMap, setWeatherMap]   = useState<Record<string, Weather | null>>({})
  const [poisMap, setPoisMap]         = useState<Record<string, FoursquarePOI[]>>({})
  const [itinerary, setItinerary]     = useState<GeminiItinerary | null>(null)
  const [itinLoading, setItinLoading] = useState(true)
  const [itinError, setItinError]     = useState(false)
  const [poisLoading, setPoisLoading] = useState(false)
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES))

  const interests = parseInterests(prompt)
  const booking   = BOOKING_LINKS[activeStop.system]
  const systemIcon = { LIRR: '🚋', MetroNorth: '🚉', PATH: '🚇', Amtrak: '🚂' }[activeStop.system] ?? '🚂'
  const systemLabel = activeStop.system === 'MetroNorth' ? 'Metro-North' : activeStop.system

  const activePois = poisMap[activeStop.id] ?? []
  const visiblePois = activePois.filter(p => activeCategories.has(p.type) || p.type === 'default')

  const allOn = activeCategories.size === ALL_CATEGORIES.length
  const toggleAll = () => setActiveCategories(allOn ? new Set() : new Set(ALL_CATEGORIES))
  const toggleCat = (c: string) => setActiveCategories(prev => {
    const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n
  })

  // Fetch weather for all stops on mount
  useEffect(() => {
    selectedStops.forEach(stop => {
      fetchWeather(stop.lat, stop.lng).then(w =>
        setWeatherMap(prev => ({ ...prev, [stop.id]: w }))
      )
    })
  }, [])

  // Fetch Foursquare POIs when active stop changes
  useEffect(() => {
    if (poisMap[activeStop.id] !== undefined) return
    setPoisLoading(true)
    fetchFoursquarePOIs(activeStop.lat, activeStop.lng, interests)
      .then(pois => setPoisMap(prev => ({ ...prev, [activeStop.id]: pois })))
      .finally(() => setPoisLoading(false))
  }, [activeStop.id])

  // Call Gemini once all weather + first stop's POIs are ready (or after 4s timeout)
  useEffect(() => {
    setItinLoading(true)
    setItinError(false)

    // Fetch all stops' POIs first then call Gemini
    const fetchAll = async () => {
      const allPois: Record<string, FoursquarePOI[]> = {}
      const allWeather: Record<string, Weather | null> = {}
      await Promise.all(selectedStops.map(async s => {
        allPois[s.id]    = await fetchFoursquarePOIs(s.lat, s.lng, interests)
        allWeather[s.id] = await fetchWeather(s.lat, s.lng)
      }))
      setPoisMap(allPois)
      setWeatherMap(allWeather)

      const result = await fetchGeminiItinerary(selectedStops, prompt, allWeather, allPois, model)
      if (result) { setItinerary(result); setItinError(false) }
      else setItinError(true)
      setItinLoading(false)
    }
    fetchAll()
  }, [])

  const weather = weatherMap[activeStop.id]
  const stopItinerary = itinerary?.stops.find(s =>
    s.stopName.toLowerCase().includes(activeStop.name.toLowerCase()) ||
    activeStop.name.toLowerCase().includes(s.stopName.toLowerCase())
  ) ?? itinerary?.stops[selectedStops.findIndex(s => s.id === activeStop.id)] ?? null

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">

      {/* ── Left info panel ── */}
      <div className="w-full lg:w-[28rem] flex-shrink-0 overflow-y-auto bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <button onClick={onBack} className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 mb-3">
            ← Back to map
          </button>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Your Trip Plan</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-semibold">
              🤖 {model === 'gemini-2.5-pro' ? 'Gemini Pro' : 'Gemini Flash'}
            </span>
          </div>
          {prompt && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic line-clamp-2">"{prompt}"</p>
          )}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {interests.map(i => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full text-[10px] font-semibold">#{i}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {selectedStops.map((s, i) => (
              <button key={s.id} onClick={() => setActiveStop(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  activeStop.id === s.id
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}>
                {i > 0 && <span className="opacity-60 mr-1">→</span>}{s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Stop photo + info */}
          <img src={activeStop.photo} alt={activeStop.name} className="w-full h-36 object-cover rounded-xl" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{systemIcon}</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{activeStop.displayName}</h3>
            </div>
            {activeStop.tagline && <p className="text-blue-500 text-sm font-medium italic">{activeStop.tagline}</p>}
          </div>

          {/* Weather card */}
          {weather ? (
            <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-100 dark:border-sky-800">
              <img src={weather.icon} alt={weather.desc} className="w-12 h-12" />
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{weather.temp}°F
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">feels {weather.feels}°F</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{weather.desc}</p>
                <p className="text-xs text-gray-400">💧 {weather.humidity}% · 💨 {weather.wind} mph</p>
              </div>
            </div>
          ) : (
            <div className="h-16 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800 flex items-center justify-center">
              <span className="text-xs text-sky-400 animate-pulse">Loading weather…</span>
            </div>
          )}

          {/* AI Itinerary */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-2 flex items-center gap-2">
              ✨ AI Itinerary
              {itinLoading && <span className="text-xs text-purple-400 font-normal animate-pulse">Generating with {model === 'gemini-2.5-pro' ? 'Gemini Pro' : 'Gemini Flash'}…</span>}
            </h4>

            {itinError && (
              <p className="text-xs text-red-400">Couldn't generate itinerary — check your Gemini API key in .env</p>
            )}

            {itinerary && !itinLoading && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{itinerary.overview}</p>
                {itinerary.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {itinerary.highlights.map((h, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {stopItinerary && !itinLoading && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1.5">Day 1</p>
                  <div className="space-y-1.5">
                    {stopItinerary.day1.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{item.time}</span>
                        <div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.activity}</p>
                          {item.tip && <p className="text-xs text-gray-400 italic">{item.tip}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1.5">Day 2</p>
                  <div className="space-y-1.5">
                    {stopItinerary.day2.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0 pt-0.5">{item.time}</span>
                        <div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item.activity}</p>
                          {item.tip && <p className="text-xs text-gray-400 italic">{item.tip}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {stopItinerary.localTips.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Local Tips</p>
                    {stopItinerary.localTips.map((t, i) => (
                      <p key={i} className="text-xs text-gray-500 dark:text-gray-400">• {t}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {itinerary && (
              <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800">
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Best time to go</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{itinerary.bestTimeToGo}</p>
                {itinerary.packingList.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Pack</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{itinerary.packingList.join(' · ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Train info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-2">{systemIcon} Getting There by {systemLabel}</h4>
            <div className="flex flex-wrap gap-1 mb-3">
              {activeStop.lines.slice(0, 4).map(line => (
                <span key={line} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">{line}</span>
              ))}
            </div>
            <a href={booking.url} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-white dark:bg-gray-700 text-blue-500 border border-blue-300 dark:border-blue-600 rounded-lg py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-semibold">
              {booking.label}
            </a>
          </div>

          {/* Foursquare places */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                📍 Nearby Places
                <span className="ml-1 font-normal text-gray-400 text-xs">via Foursquare</span>
              </h4>
              {poisLoading && <span className="text-xs text-blue-400 animate-pulse">Loading…</span>}
            </div>
            <div className="space-y-2">
              {visiblePois.slice(0, 20).map((poi, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40">
                  <span className="text-xl flex-shrink-0">{POI_ICONS[poi.type] ?? POI_ICONS.default}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">{poi.name}</p>
                    {poi.category && <p className="text-xs text-gray-400">{poi.category}</p>}
                    {poi.address && <p className="text-xs text-gray-400 mt-0.5">{poi.address}</p>}
                    {poi.distance && <p className="text-xs text-gray-300">{poi.distance}m away</p>}
                  </div>
                  <a href={googleMapsUrl(poi.name + ' near ' + activeStop.displayName)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs px-2 py-1 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50 transition-colors font-medium whitespace-nowrap">
                    📌 Save
                  </a>
                </div>
              ))}
              {!poisLoading && activePois.length === 0 && (
                <p className="text-xs text-gray-400 italic">No places found — check your Foursquare API key in .env</p>
              )}
            </div>
          </div>

          <div className="pb-4" />
        </div>
      </div>

      {/* ── Right: legend + map ── */}
      <div className="flex-1 flex min-h-[400px] lg:min-h-0">

        {/* Filter sidebar */}
        <div className="w-44 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto z-[500]">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Filter Map</p>
            <button onClick={toggleAll}
              className={`w-full text-xs font-semibold py-1.5 rounded-lg border transition-all ${
                allOn
                  ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
              }`}>
              {allOn ? '✓ All On' : 'All Off'}
            </button>
          </div>
          <div className="flex-1 p-2 space-y-1">
            {ALL_CATEGORIES.map(cat => {
              const on = activeCategories.has(cat)
              const count = activePois.filter(p => p.type === cat).length
              return (
                <button key={cat} onClick={() => toggleCat(cat)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all border ${
                    on
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }`}>
                  <span className={on ? '' : 'grayscale opacity-40'}>{POI_ICONS[cat]}</span>
                  <span className="flex-1 text-left capitalize font-medium">{cat}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-bold rounded-full px-1.5 ${
                      on ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'
                    }`}>{count}</span>
                  )}
                </button>
              )
            })}
            <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span>{systemIcon}</span><span>Station</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[activeStop.lat, activeStop.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
            <MapRecenter lat={activeStop.lat} lng={activeStop.lng} />

            {/* Station marker */}
            <Marker position={[activeStop.lat, activeStop.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="font-size:28px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">${systemIcon}</div>`,
                iconSize: [32, 32], iconAnchor: [16, 16],
              })}>
              <Popup>
                <b>{activeStop.displayName}</b><br />
                {weather && <span>{weather.temp}°F, {weather.desc}</span>}
              </Popup>
            </Marker>

            {/* POI markers */}
            {visiblePois.map((poi, i) => (
              <Marker key={i} position={[poi.lat, poi.lng]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="background:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;">${POI_ICONS[poi.type] ?? POI_ICONS.default}</div>`,
                  iconSize: [28, 28], iconAnchor: [14, 14],
                })}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{poi.name}</p>
                    {poi.category && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{poi.category}</p>}
                    {poi.address && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{poi.address}</p>}
                    <a href={googleMapsUrl(poi.name + ' near ' + activeStop.displayName)}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600 }}>
                      📌 Save to Google Maps →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
