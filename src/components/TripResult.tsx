import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { TripStop } from '../data/types'

const POI_ICONS: Record<string, string> = {
  food: '🍜',
  art: '🎨',
  history: '🏛',
  nature: '🌿',
  event: '🎉',
  shopping: '🛍',
  museum: '🖼',
  nightlife: '🌙',
  culture: '🎭',
  photography: '📷',
  default: '📍',
}

const TYPE_COLORS: Record<string, string> = {
  food: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  art: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  history: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  nature: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
  event: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700',
  shopping: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  museum: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  nightlife: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  culture: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  photography: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700',
  default: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
}

const BOOKING_LINKS: Record<string, { label: string; url: string }> = {
  LIRR:       { label: 'Buy LIRR Tickets on MTA.info', url: 'https://www.mta.info/lirr' },
  MetroNorth: { label: 'Buy Metro-North Tickets on MTA.info', url: 'https://www.mta.info/mnr' },
  PATH:       { label: 'PATH Fares & Schedules', url: 'https://www.panynj.gov/path/en/index.html' },
  Amtrak:     { label: 'View All Routes on Amtrak.com', url: 'https://www.amtrak.com' },
}

// Maps interest keywords from the prompt to OSM tags for Overpass API
const INTEREST_OSM: Record<string, string[]> = {
  food:         ['amenity=restaurant', 'amenity=cafe', 'amenity=bar', 'amenity=food_court', 'amenity=fast_food'],
  art:          ['amenity=arts_centre', 'tourism=gallery', 'amenity=studio'],
  history:      ['tourism=museum', 'historic=monument', 'historic=memorial', 'historic=building', 'historic=ruins'],
  culture:      ['amenity=theatre', 'amenity=cinema', 'tourism=attraction', 'amenity=community_centre'],
  events:       ['amenity=theatre', 'amenity=events_venue', 'amenity=concert_hall', 'amenity=convention_centre'],
  nature:       ['leisure=park', 'leisure=garden', 'leisure=nature_reserve', 'leisure=dog_park'],
  architecture: ['tourism=attraction', 'historic=building', 'amenity=place_of_worship', 'tourism=artwork'],
  museums:      ['tourism=museum', 'amenity=museum'],
  shopping:     ['shop=mall', 'shop=department_store', 'amenity=marketplace', 'shop=market'],
  nightlife:    ['amenity=bar', 'amenity=pub', 'amenity=nightclub'],
  traditions:   ['tourism=attraction', 'historic=monument', 'tourism=museum'],
  photography:  ['tourism=viewpoint', 'tourism=attraction', 'natural=peak'],
}

const OSM_TO_TYPE: Record<string, string> = {
  restaurant: 'food', cafe: 'food', bar: 'food', fast_food: 'food', food_court: 'food',
  arts_centre: 'art', gallery: 'art', studio: 'art',
  museum: 'museum',
  monument: 'history', memorial: 'history', ruins: 'history',
  theatre: 'culture', cinema: 'culture', community_centre: 'culture', concert_hall: 'event', events_venue: 'event', convention_centre: 'event',
  park: 'nature', garden: 'nature', nature_reserve: 'nature', dog_park: 'nature',
  place_of_worship: 'architecture', artwork: 'architecture',
  mall: 'shopping', department_store: 'shopping', marketplace: 'shopping', market: 'shopping',
  pub: 'nightlife', nightclub: 'nightlife',
  viewpoint: 'photography',
  attraction: 'culture',
}

export interface FetchedPOI {
  id: number
  name: string
  lat: number
  lng: number
  type: string
  address?: string
  tags: Record<string, string>
}

function parseInterests(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  return Object.keys(INTEREST_OSM).filter(key =>
    lower.includes(key) || lower.includes('#' + key)
  )
}

function buildOverpassQuery(lat: number, lng: number, interests: string[]): string {
  const radius = 1500 // meters
  const tags = interests.length > 0
    ? [...new Set(interests.flatMap(i => INTEREST_OSM[i] ?? []))]
    : [...new Set(Object.values(INTEREST_OSM).flat())]

  const nodeQueries = tags.map(tag => {
    const [k, v] = tag.split('=')
    return `node["${k}"="${v}"](around:${radius},${lat},${lng});`
  }).join('\n  ')

  return `[out:json][timeout:15];
(
  ${nodeQueries}
);
out body 40;`
}

async function fetchPOIs(lat: number, lng: number, interests: string[]): Promise<FetchedPOI[]> {
  const query = buildOverpassQuery(lat, lng, interests)
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' },
  })
  if (!res.ok) throw new Error('Overpass API error')
  const data = await res.json()

  return (data.elements as Record<string, unknown>[])
    .filter((el: Record<string, unknown>) => (el.tags as Record<string, string>)?.name)
    .map((el: Record<string, unknown>) => {
      const tags = el.tags as Record<string, string>
      const amenity = tags.amenity || tags.shop || tags.leisure || tags.tourism || tags.historic || tags.natural || ''
      return {
        id: el.id as number,
        name: tags.name,
        lat: el.lat as number,
        lng: el.lon as number,
        type: OSM_TO_TYPE[amenity] ?? 'default',
        address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || undefined,
        tags,
      }
    })
    .slice(0, 30)
}

// Re-center map when active stop changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.flyTo([lat, lng], 14, { duration: 1 }) }, [lat, lng, map])
  return null
}

interface Props {
  selectedStops: TripStop[]
  prompt: string
  onBack: () => void
}

const ALL_CATEGORIES = Object.keys(POI_ICONS).filter(k => k !== 'default')

export default function TripResult({ selectedStops, prompt, onBack }: Props) {
  const [activeStop, setActiveStop] = useState<TripStop>(selectedStops[0])
  const [poisByStop, setPoisByStop] = useState<Record<string, FetchedPOI[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES))

  const interests = parseInterests(prompt)
  const activePois = poisByStop[activeStop.id] ?? []

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }
  const allOn = activeCategories.size === ALL_CATEGORIES.length
  const toggleAll = () => setActiveCategories(allOn ? new Set() : new Set(ALL_CATEGORIES))

  useEffect(() => {
    if (poisByStop[activeStop.id] !== undefined) return
    setLoading(true)
    setError(false)
    fetchPOIs(activeStop.lat, activeStop.lng, interests)
      .then(pois => setPoisByStop(prev => ({ ...prev, [activeStop.id]: pois })))
      .catch(() => { setError(true); setPoisByStop(prev => ({ ...prev, [activeStop.id]: [] })) })
      .finally(() => setLoading(false))
  }, [activeStop.id])

  const isAmtrak = activeStop.system === 'Amtrak'
  const booking  = BOOKING_LINKS[activeStop.system]

  const googleMapsUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

  const systemIcon = activeStop.system === 'LIRR' ? '🚋'
    : activeStop.system === 'MetroNorth' ? '🚉'
    : activeStop.system === 'PATH' ? '🚇'
    : '🚂'

  const systemLabel = activeStop.system === 'MetroNorth' ? 'Metro-North' : activeStop.system

  // Merge hardcoded city POIs (Amtrak) with fetched OSM POIs
  const hardcodedPois = activeStop.pois ?? []
  const allPois: Array<{ name: string; lat: number; lng: number; type: string; description?: string; address?: string; isOSM?: boolean }> = [
    ...hardcodedPois.map(p => ({ ...p, isOSM: false })),
    ...activePois
      .filter(op => !hardcodedPois.some(hp => hp.name.toLowerCase() === op.name.toLowerCase()))
      .map(op => ({ name: op.name, lat: op.lat, lng: op.lng, type: op.type, address: op.address, isOSM: true })),
  ]
  const visiblePois = allPois.filter(p => activeCategories.has(p.type) || (p.type === 'default' && activeCategories.has('default')))

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">

      {/* Left info panel */}
      <div className="w-full lg:w-[26rem] flex-shrink-0 overflow-y-auto bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 flex flex-col">

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <button onClick={onBack} className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 mb-3">
            ← Back to map
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Your Trip Plan</h2>
          {prompt && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic line-clamp-2">"{prompt}"</p>
          )}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {interests.map(i => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full text-[10px] font-semibold">
                  #{i}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {selectedStops.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveStop(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  activeStop.id === s.id
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                {i > 0 && <span className="opacity-60 mr-1">→</span>}{s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <img
            src={activeStop.photo}
            alt={activeStop.name}
            className="w-full h-36 object-cover rounded-xl"
          />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{systemIcon}</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{activeStop.displayName}</h3>
            </div>
            {activeStop.tagline && (
              <p className="text-blue-500 text-sm font-medium italic">{activeStop.tagline}</p>
            )}
            {!isAmtrak && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold"
                style={{ background: activeStop.dotColor + '22', color: activeStop.dotColor, border: `1px solid ${activeStop.dotColor}44` }}>
                {systemLabel}
              </span>
            )}
          </div>

          {activeStop.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{activeStop.description}</p>
          )}

          {activeStop.history && (
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-1.5">History & Culture</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{activeStop.history}</p>
            </div>
          )}

          {activeStop.highlights && activeStop.highlights.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-2">Why People Visit</h4>
              <ul className="space-y-1.5">
                {activeStop.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">✦</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Train info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-2 flex items-center gap-2">
              {systemIcon} Getting There by {systemLabel}
            </h4>
            <div className="flex flex-wrap gap-1 mb-3">
              {activeStop.lines.slice(0, 4).map(line => (
                <span key={line} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                  {line}
                </span>
              ))}
            </div>
            {isAmtrak ? (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Prices vary by date and class. Book early for best fares — Amtrak offers discounts for advance purchase.
                </p>
                {selectedStops.length > 1 && activeStop.id !== selectedStops[0].id && (
                  <a href="https://www.amtrak.com/tickets/departure.html" target="_blank" rel="noopener noreferrer"
                    className="block w-full text-center btn-primary text-sm py-2 mb-2">
                    🎫 Book Amtrak: {selectedStops[0].name} → {activeStop.name}
                  </a>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {activeStop.system === 'PATH'
                  ? 'PATH runs 24/7. Use OMNY contactless — tap your card or phone, no paper tickets.'
                  : 'Buy tickets at station machines or via the MTA app. Off-peak fares available weekends.'}
              </p>
            )}
            <a href={booking.url} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-white dark:bg-gray-700 text-blue-500 border border-blue-300 dark:border-blue-600 rounded-lg py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-semibold">
              {booking.label}
            </a>
          </div>

          {/* Travel notes */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
            <h4 className="font-bold text-gray-800 dark:text-white text-sm mb-2">⚠️ Travel Notes</h4>
            <ul className="space-y-1">
              {isAmtrak ? (
                <>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Book Amtrak tickets at least 2 weeks ahead for best prices</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Trains can run late — allow buffer time between activities</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Amtrak allows 2 carry-on bags + 2 personal items (free)</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Many cities have transit apps for local subway/bus connections</li>
                </>
              ) : activeStop.system === 'PATH' ? (
                <>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• PATH runs 24/7 including weekends and holidays</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Use OMNY contactless — no MetroCard needed</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Off-peak fares same as peak on PATH</li>
                </>
              ) : (
                <>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Weekend schedules differ from weekday — check MTA.info</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Off-peak fares available Sat, Sun & weekday off-hours</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Buy round-trip for a discount vs. two one-ways</li>
                  <li className="text-xs text-gray-600 dark:text-gray-400">• Bikes allowed on trains with a bicycle permit</li>
                </>
              )}
            </ul>
          </div>

          {/* Places to visit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                📍 Places Near {activeStop.name}
                {interests.length > 0 && <span className="font-normal text-gray-400 ml-1">(filtered by your interests)</span>}
              </h4>
              {loading && (
                <span className="text-xs text-blue-400 animate-pulse">Loading…</span>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-400 mb-2">Couldn't load local places — check your connection.</p>
            )}

            {!loading && allPois.length === 0 && !error && (
              <p className="text-xs text-gray-400 italic">No matching places found nearby.</p>
            )}

            <div className="space-y-2">
              {allPois.map((poi, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${TYPE_COLORS[poi.type] ?? TYPE_COLORS.default}`}
                >
                  <span className="text-xl flex-shrink-0">{POI_ICONS[poi.type] ?? POI_ICONS.default}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{poi.name}</p>
                    {poi.description && <p className="text-xs mt-0.5 opacity-80 leading-snug">{poi.description}</p>}
                    {poi.address && <p className="text-xs mt-0.5 opacity-60">{poi.address}</p>}
                    {poi.isOSM && (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-medium">
                        OpenStreetMap
                      </span>
                    )}
                  </div>
                  <a
                    href={googleMapsUrl(poi.name + ' near ' + activeStop.displayName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs px-2 py-1 bg-white/70 dark:bg-black/20 rounded-lg hover:bg-white dark:hover:bg-black/40 transition-colors font-medium whitespace-nowrap"
                  >
                    📌 Save
                  </a>
                </div>
              ))}
            </div>

            {allPois.length === 0 && !loading && (
              <div className="mt-3 text-center">
                <a
                  href={googleMapsUrl('things to do near ' + activeStop.name + ' train station')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  🗺 Explore on Google Maps
                </a>
              </div>
            )}
          </div>

          <div className="pb-4" />
        </div>
      </div>

      {/* Right: legend sidebar + map */}
      <div className="flex-1 flex min-h-[400px] lg:min-h-0">

        {/* Legend filter panel */}
        <div className="w-44 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto z-[500]">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
              Filter Map
              {loading && <span className="ml-1 text-blue-400 font-normal normal-case animate-pulse">loading…</span>}
            </p>
            <button
              onClick={toggleAll}
              className={`w-full text-xs font-semibold py-1.5 rounded-lg border transition-all ${
                allOn
                  ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300'
              }`}
            >
              {allOn ? '✓ All On' : 'All Off'}
            </button>
          </div>

          <div className="flex-1 p-2 space-y-1">
            {ALL_CATEGORIES.map(cat => {
              const on = activeCategories.has(cat)
              const count = allPois.filter(p => p.type === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all border ${
                    on
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                  }`}
                >
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
                <span>{systemIcon}</span>
                <span>Station</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[activeStop.lat, activeStop.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
            <MapRecenter lat={activeStop.lat} lng={activeStop.lng} />

            {/* Station marker */}
            <Marker
              position={[activeStop.lat, activeStop.lng]}
              icon={L.divIcon({
                className: '',
                html: `<div style="font-size:26px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">${systemIcon}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              })}
            >
              <Popup>
                <b>{activeStop.displayName}</b><br />
                <a href={booking.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs">
                  {systemLabel} info →
                </a>
              </Popup>
            </Marker>

            {/* POI markers — filtered by active categories */}
            {visiblePois.map((poi, i) => (
              <Marker
                key={i}
                position={[poi.lat, poi.lng]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="
                    background:white;
                    border-radius:50%;
                    width:28px;height:28px;
                    display:flex;align-items:center;justify-content:center;
                    font-size:14px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.3);
                    cursor:pointer;
                  ">${POI_ICONS[poi.type] ?? POI_ICONS.default}</div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                })}
              >
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <p style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{poi.name}</p>
                    {poi.description && <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{poi.description}</p>}
                    {poi.address && <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{poi.address}</p>}
                    <a
                      href={googleMapsUrl(poi.name + ' near ' + activeStop.displayName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600 }}
                    >
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
