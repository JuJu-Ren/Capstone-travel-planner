import { useState } from 'react'
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
]

const SYSTEM_ICONS: Record<string, string> = {
  Amtrak: '🚂', LIRR: '🚋', MetroNorth: '🚉', PATH: '🚇',
}

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash' | 'gemini-2.0-flash-lite'

const MODELS: { id: GeminiModel; label: string; badge: string }[] = [
  { id: 'gemini-2.5-flash',      label: '2.5 Flash',      badge: '⚡' },
  { id: 'gemini-2.5-pro',        label: '2.5 Pro',        badge: '✨' },
  { id: 'gemini-2.0-flash',      label: '2.0 Flash',      badge: '🔵' },
  { id: 'gemini-2.0-flash-lite', label: '2.0 Flash Lite', badge: '🪶' },
]

interface Props {
  selectedStops: TripStop[]
  onGenerate: (prompt: string, model: GeminiModel, startDate: string, endDate: string) => void
  onClearStop: (id: string) => void
}

export default function PromptSection({ selectedStops, onGenerate, onClearStop }: Props) {
  const [prompt, setPrompt]       = useState('')
  const [showTip, setShowTip]     = useState(false)
  const [model, setModel]         = useState<GeminiModel>('gemini-2.5-flash')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')

  const addTag = (tag: string) => setPrompt(prev => prev ? `${prev} ${tag}` : tag)

  // Default end date to start date + 1 when start changes and end is empty
  const handleStartDate = (v: string) => {
    setStartDate(v)
    if (v && !endDate) {
      const d = new Date(v); d.setDate(d.getDate() + 1)
      setEndDate(d.toISOString().slice(0, 10))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-t-2 border-blue-100 dark:border-gray-700 px-6 py-5">
      <div className="max-w-4xl mx-auto">

        {/* Selected stops */}
        <div className="flex flex-wrap gap-2 items-center mb-4 min-h-[32px]">
          {selectedStops.length === 0 ? (
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <span className="text-blue-400">🗺</span>
              Select up to <strong>3 stops</strong> on the map above to plan your trip
            </p>
          ) : (
            <>
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mr-1">Your stops:</span>
              {selectedStops.map((stop, i) => (
                <span key={stop.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-sm">→</span>}
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-full text-sm font-medium">
                    {SYSTEM_ICONS[stop.system] || '🚂'} {stop.displayName}
                    <button onClick={() => onClearStop(stop.id)} className="ml-1 text-amber-400 hover:text-amber-600 text-xs leading-none">✕</button>
                  </span>
                </span>
              ))}
              {selectedStops.length < 3 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                  + {3 - selectedStops.length} more stop{selectedStops.length < 2 ? 's' : ''} available
                </span>
              )}
            </>
          )}
        </div>

        {/* Travel dates */}
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => handleStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {!startDate && (
            <div className="flex items-end pb-2">
              <p className="text-xs text-gray-400">Add dates to filter events & check weather forecasts</p>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tell us what you'd like to explore</label>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 text-xs flex items-center justify-center hover:bg-blue-200 transition-colors font-bold"
              >?</button>
              {showTip && (
                <div className="absolute bottom-7 left-0 z-50 bg-gray-900 text-white text-xs rounded-xl p-4 w-64 shadow-2xl pointer-events-none">
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
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
        </div>

        {/* Hashtag chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {INTERESTS.map(({ tag, label }) => {
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
              >{label}</button>
            )
          })}
        </div>

        {/* Model selector + generate */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold pl-2">🤖 AI:</span>
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  model === m.id
                    ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >{m.badge} {m.label}</button>
            ))}
          </div>

          <button
            onClick={() => onGenerate(prompt, model, startDate, endDate)}
            disabled={selectedStops.length === 0}
            className="btn-primary px-8 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span>🚂</span> Plan My Train Weekend
          </button>
          {selectedStops.length === 0 && (
            <p className="text-sm text-gray-400">← Select at least one stop on the map</p>
          )}
        </div>
      </div>
    </div>
  )
}
