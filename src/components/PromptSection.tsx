import { useState, useEffect, useRef } from 'react'
import type { TripStop } from '../data/types'

const INTERESTS = [
  { tag: '#fine-dining',  label: '🍽 Fine Dining' },
  { tag: '#local-food',   label: '🍜 Local Food' },
  { tag: '#arts-culture', label: '🎨 Arts & Culture' },
  { tag: '#shopping',     label: '🛍 Shopping' },
  { tag: '#markets',      label: '🏪 Markets' },
  { tag: '#events',       label: '🎭 Events' },
  { tag: '#nightlife',    label: '🌙 Nightlife' },
  { tag: '#scenic',       label: '🌿 Scenic' },
  { tag: '#hidden-gems',  label: '💎 Hidden Gems' },
  { tag: '#activities',   label: '🤿 Activities & Sports' },
  { tag: '#coffee',       label: '☕ Coffee & Cafes' },
  { tag: '#breweries',    label: '🍺 Breweries & Wineries' },
  { tag: '#family',       label: '🎡 Family & Kids' },
  { tag: '#wellness',     label: '🧘 Wellness & Spa' },
]

const SYSTEM_ICONS: Record<string, string> = {
  Amtrak: '🚂', LIRR: '🚋', MetroNorth: '🚉', PATH: '🚇', Custom: '📍',
}

// Local calendar date, not UTC — toISOString() can land on the wrong day
// depending on the user's timezone and time of day.
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type GeminiModel = 'gemini-3.5-flash' | 'gemini-3-flash-preview' | 'gemini-3.1-flash-lite'

const MODELS: { id: GeminiModel; label: string; badge: string }[] = [
  { id: 'gemini-3.5-flash',       label: '3.5 Flash',       badge: '⚡' },
  { id: 'gemini-3-flash-preview', label: '3 Flash Preview', badge: '🔵' },
  { id: 'gemini-3.1-flash-lite',  label: '3.1 Flash Lite',  badge: '🪶' },
]

export interface LocationSuggestion { lat: number; lng: number; displayName: string }

interface Props {
  selectedStops: TripStop[]
  onGenerate: (prompt: string, model: GeminiModel, startDate: string, endDate: string) => void
  onClearStop: (id: string) => void
  onSelectLocation: (loc: LocationSuggestion) => void
}

export default function PromptSection({ selectedStops, onGenerate, onClearStop, onSelectLocation }: Props) {
  const [prompt, setPrompt]             = useState('')
  const [showTip, setShowTip]           = useState(false)
  const [model, setModel]               = useState<GeminiModel>('gemini-3.5-flash')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [locationQuery, setLocationQuery]     = useState('')
  const [suggestions, setSuggestions]         = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching]             = useState(false)
  const [highlightIdx, setHighlightIdx]       = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addTag = (tag: string) => setPrompt(prev => prev ? `${prev} ${tag}` : tag)

  const allTagsActive = INTERESTS.every(({ tag }) => prompt.includes(tag))
  const toggleAllTags = () => {
    if (allTagsActive) {
      setPrompt(p => INTERESTS.reduce((acc, { tag }) => acc.replace(tag, ''), p).replace(/\s+/g, ' ').trim())
    } else {
      const missing = INTERESTS.filter(({ tag }) => !prompt.includes(tag)).map(({ tag }) => tag)
      setPrompt(p => p ? `${p} ${missing.join(' ')}` : missing.join(' '))
    }
  }

  // Fetch address suggestions as the user types (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const query = locationQuery.trim()
    if (query.length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`)
        const d = r.ok ? await r.json() : []
        setSuggestions((d as { lat: string; lon: string; display_name: string }[]).map(item => ({
          lat: parseFloat(item.lat), lng: parseFloat(item.lon), displayName: item.display_name,
        })))
        setShowSuggestions(true)
        setHighlightIdx(-1)
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [locationQuery])

  const pickSuggestion = (s: LocationSuggestion) => {
    onSelectLocation(s)
    setLocationQuery(''); setSuggestions([]); setShowSuggestions(false)
  }

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); pickSuggestion(suggestions[highlightIdx] ?? suggestions[0]) }
    else if (e.key === 'Escape') { setShowSuggestions(false) }
  }

  const today = todayLocal()
  const endDateRef = useRef<HTMLInputElement>(null)

  // Default end date to start date + 1 when start changes and end is empty
  const handleStartDate = (v: string) => {
    if (v && v < today) return // no past travel dates
    setStartDate(v)
    if (v && !endDate) {
      const d = new Date(v); d.setDate(d.getDate() + 1)
      setEndDate(d.toISOString().slice(0, 10))
    }
    // The native "From" picker closes itself the instant a date is chosen —
    // immediately reopen "To" so the user can carry straight on picking it
    // instead of having to click back into the field themselves.
    if (v) {
      requestAnimationFrame(() => {
        const el = endDateRef.current
        if (!el) return
        el.focus()
        if ('showPicker' in el) { try { (el as unknown as { showPicker: () => void }).showPicker() } catch { /* not supported in this browser */ } }
      })
    }
  }

  const handleEndDate = (v: string) => {
    if (v && v < (startDate || today)) return
    setEndDate(v)
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-t-2 border-blue-100 dark:border-gray-700 px-6 py-3">
      <div className="max-w-4xl mx-auto">

        {/* Location + travel dates, all in one row */}
        <div className="mb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] min-h-[32px] flex items-center">
            {selectedStops.length === 0 ? (
              <div className="relative w-full">
                <svg viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="12" cy="19.3" rx="7.4" ry="2.2" fill="none" stroke="#2f6fed" strokeWidth="1.3" />
                  <path d="M12 2.2c-4.1 0-7.4 3.2-7.4 7.2 0 5.3 7.4 11.4 7.4 11.4s7.4-6.1 7.4-11.4c0-4-3.3-7.2-7.4-7.2z" fill="#8ec2f2" stroke="#2f6fed" strokeWidth="1.3" />
                  <circle cx="12" cy="9.3" r="2.6" fill="#fff" stroke="#2f6fed" strokeWidth="1.3" />
                </svg>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Type any city or address, or pick a stop on the map…"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => pickSuggestion(s)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-start gap-2 transition-colors ${
                            i === highlightIdx
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="text-blue-400 mt-0.5 flex-shrink-0">📍</span>
                          <span className="text-gray-700 dark:text-gray-200 leading-snug">{s.displayName}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">You selected</span>
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-full text-sm font-medium">
                  {SYSTEM_ICONS[selectedStops[0].system] || '🚂'} {selectedStops[0].displayName}
                  <button onClick={() => onClearStop(selectedStops[0].id)} className="ml-1 text-amber-400 hover:text-amber-600 text-xs leading-none">✕</button>
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">From</label>
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={e => handleStartDate(e.target.value)}
              className="px-3 py-[7px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">To</label>
            <input
              ref={endDateRef}
              type="date"
              value={endDate}
              min={startDate || today}
              onChange={e => handleEndDate(e.target.value)}
              className="px-3 py-[7px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        {!startDate && (
          <p className="text-xs text-gray-400 mt-1.5 text-right">Add dates to filter events & check weather forecasts</p>
        )}
        </div>

        {/* Prompt */}
        <div className="relative mb-2">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tell us what you'd like to explore</label>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 text-xs flex items-center justify-center hover:bg-blue-200 transition-colors font-bold"
              >?</button>
              {showTip && (
                <div className="absolute bottom-7 left-0 z-[9999] bg-gray-900 text-white text-sm rounded-xl p-4 w-64 shadow-2xl pointer-events-none">
                  <p className="font-semibold mb-2 text-blue-300">Tips for a great trip prompt</p>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Interests: food, art, history, jazz…</li>
                    <li>• Travel style: relaxed, adventurous, romantic…</li>
                    <li>• Who you're with: solo, partner, family…</li>
                    <li>• Pace: packed itinerary or slow exploration?</li>
                    <li>• Any dietary or accessibility needs</li>
                  </ul>
                  <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-gray-900 rotate-45" />
                </div>
              )}
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. I love fine dining and jazz bars. Weekend trip with my partner — relaxed pace, great cocktails and hidden gems..."
            rows={2}
            className="w-full px-4 py-3 pb-10 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
          <select
            value={model}
            onChange={e => setModel(e.target.value as GeminiModel)}
            className="absolute bottom-2.5 left-2.5 z-10 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg pl-2 pr-1 py-1 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.badge} {m.label}</option>
            ))}
          </select>
        </div>

        {/* Hashtag chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={toggleAllTags}
            className={`px-3 py-1.5 rounded-full text-sm border font-semibold transition-all ${
              allTagsActive
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >{allTagsActive ? '✓ All selected' : 'Select all'}</button>
          {INTERESTS.map(({ tag }) => {
            const active = prompt.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => active
                  ? setPrompt(p => p.replace(tag, '').replace(/\s+/g, ' ').trim())
                  : addTag(tag)
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  active
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >{tag}</button>
            )
          })}
        </div>

        {/* Generate */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onGenerate(prompt, model, startDate, endDate)}
            disabled={selectedStops.length === 0}
            className="btn-primary px-8 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Plan My Trip
          </button>
          {selectedStops.length === 0 && (
            <p className="text-sm text-gray-400">← Select at least one stop on the map</p>
          )}
        </div>
      </div>
    </div>
  )
}
