import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import Header from './components/Header'
import type { GoogleProfile } from './components/Header'
import TrainMap from './components/TrainMap'
import PromptSection from './components/PromptSection'
import type { MapMarker } from './components/GoogleResultMap'
import { CATEGORY_COLORS } from './components/GoogleResultMap'
import type { GeminiModel, LocationSuggestion } from './components/PromptSection'
import type { TripStop } from './data/types'

// ─── API keys ─────────────────────────────────────────────────────────────────
const OW_KEY     = import.meta.env.VITE_OPENWEATHER_KEY   as string
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY as string
const TM_KEY     = import.meta.env.VITE_TICKETMASTER_KEY  as string
const GEM_KEY    = import.meta.env.VITE_GEMINI_KEY        as string
const EB_KEY     = import.meta.env.VITE_EVENTBRITE_KEY    as string
const PHQ_KEY    = import.meta.env.VITE_PREDICTHQ_KEY     as string
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

// ─── Google Sign-In ───────────────────────────────────────────────────────────

interface GoogleCredentialResponse { credential: string }
interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void
      renderButton: (el: HTMLElement, opts: { theme: string; size: string; type: string }) => void
      disableAutoSelect: () => void
    }
  }
}

function decodeGoogleJwt(token: string): GoogleProfile | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const d = JSON.parse(json)
    return { name: d.name, email: d.email, picture: d.picture }
  } catch { return null }
}

// Module-level singletons so React StrictMode's double-effect (dev only) never
// injects the GSI script or calls initialize() more than once. The credential
// callback is indirected through a mutable handler so initialize() only ever
// runs once yet still reaches the current component instance's state setter.
let gsiLoadPromise: Promise<GoogleIdApi> | null = null
let gsiInitialized = false
let gsiCredentialHandler: ((r: GoogleCredentialResponse) => void) | null = null

function loadGoogleIdentityServices(): Promise<GoogleIdApi> {
  if (!gsiLoadPromise) {
    gsiLoadPromise = new Promise(resolve => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => resolve((window as unknown as { google: GoogleIdApi }).google)
      document.head.appendChild(script)
    })
  }
  return gsiLoadPromise
}

async function initGoogleIdentityServices(clientId: string): Promise<GoogleIdApi> {
  const g = await loadGoogleIdentityServices()
  if (!gsiInitialized) {
    g.accounts.id.initialize({
      client_id: clientId,
      callback: r => gsiCredentialHandler?.(r),
    })
    gsiInitialized = true
  }
  return g
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherDay {
  condition: string; icon: string; iconCode: string; high: number; low: number
  precipitation: number; windSpeed: number; humidity: number; isForecast: boolean
  date?: string
  available?: boolean // false when no forecast or historical data could be found at all
  isHistorical?: boolean // true when this is last year's actual weather for the same date, not a forecast
  historicalYear?: number
}

// Local calendar date, not UTC — toISOString() can land on the wrong day
// depending on the user's timezone and time of day.
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function wxEmoji(code: string): string {
  if (code.startsWith('01')) return '☀️'
  if (code.startsWith('02')) return '⛅'
  if (code.startsWith('03') || code.startsWith('04')) return '☁️'
  if (code.startsWith('09') || code.startsWith('10')) return '🌧'
  if (code.startsWith('11')) return '⛈'
  if (code.startsWith('13')) return '❄️'
  if (code.startsWith('50')) return '🌫'
  return '🌤'
}

interface GoogleReview {
  rating: number
  text?: { text: string }
  authorAttribution: { displayName: string; photoUri?: string }
  relativePublishTimeDescription?: string
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
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  websiteUri?: string
  googleMapsUri?: string
  reviews?: GoogleReview[]
}

interface TMRawEvent {
  id: string; name: string; url: string
  dates: { start: { localDate: string; localTime?: string } }
  _embedded?: { venues?: { name: string; location?: { latitude: string; longitude: string }; address?: { line1?: string }; city?: { name?: string }; state?: { stateCode?: string } }[] }
  images?: { url: string; width: number }[]
  priceRanges?: { min: number; max: number; currency: string }[]
}

interface EBRawEvent {
  id: string; name: { text: string }; url: string
  start: { local: string }
  logo?: { url: string }
  venue?: { name: string; latitude: string; longitude: string; address?: { localized_address_display?: string } }
}

interface PHQRawEvent {
  id: string; title: string; category: string
  start: string
  entities?: { name: string; type: string; formatted_address?: string }[]
  location?: [number, number] // [lng, lat]
}

interface UnifiedEvent {
  id: string
  source: 'Ticketmaster' | 'Eventbrite' | 'PredictHQ'
  name: string
  url?: string
  date: string
  time?: string
  venueName?: string
  venueAddress?: string
  lat?: number
  lng?: number
  image?: string
  priceMin?: number
  priceMax?: number
  currency?: string
  category?: string
}

interface GeminiItinerary {
  overview: string; highlights: string[]
  recommendation: { verdict: 'Recommended' | 'Mixed' | 'Not Recommended'; reasoning: string }
  stops: {
    stopName: string
    introduction: string
    landmarks: { name: string; story: string }[]
    gettingAround: string
    whatToWear: string
    hikingRoutes: { name: string; difficulty: string; description: string }[]
    localSpecialties: string[]
    days: { time: string; activity: string; tip?: string }[][]
    localTips: string[]
  }[]
  packingList: string[]; bestTimeToGo: string
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; img: string; textQuery: (c: string) => string; visitDuration: string; minRating?: number }> = {
  'fine-dining':  { label: 'Fine Dining',    icon: '🍽', img: 'https://img.icons8.com/color/96/restaurant.png',      textQuery: c => `fine dining highly rated restaurants in ${c}`,                  visitDuration: '1–2 hrs',   minRating: 4.5 },
  'local-food':   { label: 'Local Food',     icon: '🍜', img: 'https://img.icons8.com/color/96/taco.png',            textQuery: c => `authentic local food regional specialties restaurants ${c}`,    visitDuration: '45–90 min', minRating: 4.0 },
  'arts-culture': { label: 'Arts & Culture', icon: '🎨', img: 'https://img.icons8.com/color/96/museum.png',          textQuery: c => `museums art galleries cultural centers historic landmarks ${c}`, visitDuration: '1–3 hrs',   minRating: 4.0 },
  shopping:       { label: 'Shopping',       icon: '🛍', img: 'https://img.icons8.com/color/96/shopping-bag.png',    textQuery: c => `boutiques vintage antique shops local stores bookstores ${c}`,   visitDuration: '1–2 hrs',   minRating: 4.0 },
  markets:        { label: 'Markets',        icon: '🏪', img: 'https://img.icons8.com/color/96/stall.png',           textQuery: c => `farmers market flea market food hall local market ${c}`,         visitDuration: '1–2 hrs',   minRating: 4.0 },
  events:         { label: 'Events',         icon: '🎭', img: 'https://img.icons8.com/color/96/theatre-mask.png',    textQuery: () => '',                                                               visitDuration: '2–3 hrs' },
  nightlife:      { label: 'Nightlife',      icon: '🌙', img: 'https://img.icons8.com/color/96/cocktail.png',        textQuery: c => `cocktail bars jazz clubs rooftop bars speakeasies ${c}`,         visitDuration: '2–4 hrs',   minRating: 4.0 },
  scenic:         { label: 'Scenic',         icon: '🌿', img: 'https://img.icons8.com/color/96/national-park.png',   textQuery: c => `scenic parks gardens waterfront viewpoints trails ${c}`,         visitDuration: '30–90 min', minRating: 4.0 },
  'hidden-gems':  { label: 'Hidden Gems',    icon: '💎', img: 'https://img.icons8.com/color/96/diamond.png',         textQuery: c => `hidden gems local favorites unique spots secret places ${c}`,    visitDuration: '30–60 min', minRating: 4.0 },
  activities:     { label: 'Activities & Sports', icon: '🤿', img: 'https://img.icons8.com/color/96/scuba-diving.png', textQuery: c => `surfing diving skiing tennis courts axe throwing gun ranges shooting ranges adventure sports activity centers ${c}`, visitDuration: '1–3 hrs', minRating: 4.0 },
  coffee:         { label: 'Coffee & Cafes',      icon: '☕', img: 'https://img.icons8.com/color/96/coffee-to-go.png',   textQuery: c => `coffee shops cafes espresso bars roasters ${c}`,                 visitDuration: '30–60 min', minRating: 4.0 },
  breweries:      { label: 'Breweries & Wineries', icon: '🍺', img: 'https://img.icons8.com/color/96/beer.png',          textQuery: c => `craft breweries taprooms wineries wine bars tasting rooms ${c}`,  visitDuration: '1–2 hrs',   minRating: 4.0 },
  family:         { label: 'Family & Kids',        icon: '🎡', img: 'https://img.icons8.com/color/96/family.png',        textQuery: c => `zoos aquariums children's museums family attractions playgrounds ${c}`, visitDuration: '1–3 hrs', minRating: 4.0 },
  wellness:       { label: 'Wellness & Spa',       icon: '🧘', img: 'https://img.icons8.com/color/96/spa.png',           textQuery: c => `day spas yoga studios wellness centers hot springs massage ${c}`, visitDuration: '1–2 hrs',   minRating: 4.0 },
}

const ALL_CATS = Object.keys(CATEGORY_CONFIG)

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Free', PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$', PRICE_LEVEL_EXPENSIVE: '$$$', PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

const BOOKING_LINKS: Record<string, { label: string; url: string }> = {
  LIRR:       { label: 'Buy LIRR Tickets',         url: 'https://www.mta.info/lirr' },
  MetroNorth: { label: 'Buy Metro-North Tickets',   url: 'https://www.mta.info/mnr' },
  PATH:       { label: 'PATH Fares & Schedules',    url: 'https://www.panynj.gov/path/en/index.html' },
  Amtrak:     { label: 'View Routes on Amtrak.com', url: 'https://www.amtrak.com' },
}

const SYS_ICON: Record<string, string> = { LIRR: '🚋', MetroNorth: '🚉', PATH: '🚇', Amtrak: '🚂', Custom: '📍' }

// ─── API fetchers ─────────────────────────────────────────────────────────────

// Open-Meteo's WMO weather codes → OpenWeatherMap-style 2-digit icon prefixes,
// so historical rows can reuse the same wxEmoji() lookup as forecast rows.
function wmoToIconCode(code: number): string {
  if (code === 0) return '01'
  if (code === 1 || code === 2) return '02'
  if (code === 3) return '04'
  if (code === 45 || code === 48) return '50'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '10'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '13'
  if ([95, 96, 99].includes(code)) return '11'
  return '02'
}

const WMO_CONDITIONS: Record<number, string> = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'depositing rime fog',
  51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
  56: 'light freezing drizzle', 57: 'dense freezing drizzle',
  61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
  66: 'light freezing rain', 67: 'heavy freezing rain',
  71: 'slight snow', 73: 'moderate snow', 75: 'heavy snow', 77: 'snow grains',
  80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
  85: 'slight snow showers', 86: 'heavy snow showers',
  95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail',
}

// OpenWeather's forecast only covers ~5 days from today. For any requested day
// beyond that, fall back to last year's actual recorded weather for the same
// calendar date (Open-Meteo's historical archive — free, no key required) so
// the user still sees a realistic reference instead of nothing.
async function fetchHistoricalWeatherDay(lat: number, lng: number, dateStr: string): Promise<WeatherDay | null> {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const lastYearDate = `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const r = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${lastYearDate}&end_date=${lastYearDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto`)
    if (!r.ok) return null
    const j = await r.json()
    const code = j.daily?.weathercode?.[0]
    const hi   = j.daily?.temperature_2m_max?.[0]
    const lo   = j.daily?.temperature_2m_min?.[0]
    if (code === undefined || hi === undefined || lo === undefined) return null
    return {
      date: dateStr, condition: WMO_CONDITIONS[code] ?? 'unknown', icon: '', iconCode: wmoToIconCode(code),
      high: Math.round(hi), low: Math.round(lo),
      precipitation: Math.round((j.daily.precipitation_sum?.[0] ?? 0) * 10) / 10,
      windSpeed: 0, humidity: 0, isForecast: false, available: true,
      isHistorical: true, historicalYear: y - 1,
    }
  } catch { return null }
}

// Batches every missing day into a single Open-Meteo request (start_date..end_date
// spans the whole gap) instead of one request per day — firing several identical-shape
// single-day requests in parallel is unreliable and occasionally comes back with an
// incomplete `daily` array for one of them.
async function fetchHistoricalWeatherRange(lat: number, lng: number, dateStrs: string[]): Promise<Map<string, WeatherDay>> {
  const map = new Map<string, WeatherDay>()
  if (dateStrs.length === 0) return map
  const toLastYear = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const lastYearDates = dateStrs.map(toLastYear)
  try {
    const r = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${lastYearDates[0]}&end_date=${lastYearDates[lastYearDates.length - 1]}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&temperature_unit=fahrenheit&timezone=auto`)
    if (!r.ok) return map
    const j = await r.json()
    const times: string[] = j.daily?.time ?? []
    times.forEach((t: string, i: number) => {
      const hi = j.daily.temperature_2m_max?.[i]
      const lo = j.daily.temperature_2m_min?.[i]
      const code = j.daily.weathercode?.[i]
      const origIdx = lastYearDates.indexOf(t)
      if (hi === undefined || lo === undefined || code === undefined || origIdx === -1) return
      const [y] = t.split('-').map(Number)
      map.set(dateStrs[origIdx], {
        date: dateStrs[origIdx], condition: WMO_CONDITIONS[code] ?? 'unknown', icon: '', iconCode: wmoToIconCode(code),
        high: Math.round(hi), low: Math.round(lo),
        precipitation: Math.round((j.daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
        windSpeed: 0, humidity: 0, isForecast: false, available: true,
        isHistorical: true, historicalYear: y,
      })
    })
  } catch { /* map stays empty for any date it couldn't resolve — caller falls back to unavailable */ }
  return map
}

async function fetchWeatherRange(lat: number, lng: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  // OpenWeather's free forecast endpoint only covers ~5 days from today, not from
  // startDate — trips further out than that have no real forecast data yet. Every
  // requested day still gets an entry (real forecast, last year's actual weather,
  // or — only if both fail — an unavailable placeholder) so the UI never silently
  // drops days from the range.
  let list: { dt_txt: string; main: { temp_max: number; temp_min: number; humidity: number }; weather: { icon: string; description: string }[]; pop?: number; wind: { speed: number } }[] = []
  try {
    const r = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=imperial`)
    if (r.ok) list = (await r.json()).list ?? []
  } catch { /* fall through — each day below still tries the historical fallback */ }

  const dateStrs: string[] = []
  const cursor = new Date(startDate + 'T00:00:00Z')
  const last   = new Date(endDate   + 'T00:00:00Z')
  while (cursor <= last) {
    dateStrs.push(cursor.toISOString().split('T')[0])
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const missingDates = dateStrs.filter(dateStr => !list.some(i => i.dt_txt.startsWith(dateStr)))
  const historicalMap = await fetchHistoricalWeatherRange(lat, lng, missingDates)

  return dateStrs.map((dateStr): WeatherDay => {
    const items = list.filter(i => i.dt_txt.startsWith(dateStr))
    if (items.length) {
      const highs = items.map(i => i.main.temp_max)
      const lows  = items.map(i => i.main.temp_min)
      const mid   = items[Math.floor(items.length / 2)]
      const iconCode = mid.weather[0].icon
      return { date: dateStr, condition: mid.weather[0].description, icon: `https://openweathermap.org/img/wn/${iconCode}@2x.png`, iconCode, high: Math.round(Math.max(...highs)), low: Math.round(Math.min(...lows)), precipitation: Math.round((mid.pop ?? 0) * 100), windSpeed: Math.round(mid.wind.speed), humidity: mid.main.humidity, isForecast: true, available: true }
    }
    return historicalMap.get(dateStr) ?? { date: dateStr, condition: 'No data available', icon: '', iconCode: '', high: 0, low: 0, precipitation: 0, windSpeed: 0, humidity: 0, isForecast: false, available: false }
  })
}

async function fetchWeather(lat: number, lng: number, startDate: string): Promise<WeatherDay | null> {
  try {
    const daysAhead = startDate ? Math.ceil((new Date(startDate).getTime() - Date.now()) / 86400000) : 0
    if (startDate && daysAhead > 0 && daysAhead <= 5) {
      const r = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=imperial`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      const items = d.list.filter((i: { dt_txt: string }) => i.dt_txt.startsWith(startDate))
      const src = items.length ? items : [d.list[0]]
      const highs = src.map((i: { main: { temp_max: number } }) => i.main.temp_max)
      const lows  = src.map((i: { main: { temp_min: number } }) => i.main.temp_min)
      const mid   = src[Math.floor(src.length / 2)]
      const iconCode = mid.weather[0].icon as string
      return { condition: mid.weather[0].description, icon: `https://openweathermap.org/img/wn/${iconCode}@2x.png`, iconCode, high: Math.round(Math.max(...highs)), low: Math.round(Math.min(...lows)), precipitation: Math.round((mid.pop ?? 0) * 100), windSpeed: Math.round(mid.wind.speed), humidity: mid.main.humidity, isForecast: true }
    }
    if (startDate && daysAhead > 5) {
      const historical = await fetchHistoricalWeatherDay(lat, lng, startDate)
      if (historical) return historical
    }
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OW_KEY}&units=imperial`)
    if (!r.ok) return null
    const d = await r.json()
    const iconCode = d.weather[0].icon as string
    return { condition: d.weather[0].description, icon: `https://openweathermap.org/img/wn/${iconCode}@2x.png`, iconCode, high: Math.round(d.main.temp_max), low: Math.round(d.main.temp_min), precipitation: 0, windSpeed: Math.round(d.wind.speed), humidity: d.main.humidity, isForecast: false }
  } catch { return null }
}

// Plain-text weather summary handed to Gemini so its "should you go" verdict is
// grounded in the same real (or historical-fallback) data shown in the UI,
// rather than the model guessing generic seasonal averages.
function summarizeWeather(single: WeatherDay | null, range: WeatherDay[] | null): string {
  if (range && range.length > 0) {
    const avail = range.filter(d => d.available !== false)
    if (avail.length === 0) return 'No weather data available for these dates.'
    const highs = avail.map(d => d.high)
    const lows = avail.map(d => d.low)
    const conditions = [...new Set(avail.map(d => d.condition))].join(', ')
    const humidities = avail.map(d => d.humidity).filter(h => h > 0)
    const humidityText = humidities.length ? `, humidity around ${Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)}%` : ''
    const sourceNote = avail.some(d => d.isHistorical)
      ? ` (based on actual weather from ${avail.find(d => d.isHistorical)?.historicalYear} on these same dates, since a real forecast isn't available this far out)`
      : ''
    return `Expected highs ${Math.min(...highs)}-${Math.max(...highs)}°F, lows ${Math.min(...lows)}-${Math.max(...lows)}°F${humidityText}, conditions: ${conditions}${sourceNote}.`
  }
  if (single) {
    const humidityText = single.humidity > 0 ? `, humidity around ${single.humidity}%` : ''
    const sourceNote = single.isHistorical
      ? ` (based on actual weather from ${single.historicalYear} on this same date, since a real forecast isn't available this far out)`
      : single.isForecast ? '' : ' (current conditions — the actual forecast for the travel date is not yet available)'
    return `Expected high ${single.high}°F / low ${single.low}°F${humidityText}, ${single.condition}${sourceNote}.`
  }
  return 'No weather data available.'
}

// Text Search's locationRestriction only accepts a rectangle (not a circle, unlike locationBias) —
// approximate a ~5km-radius box around the point using the standard meters-per-degree conversion.
function boundingBox(lat: number, lng: number, radiusMeters: number) {
  const dLat = radiusMeters / 111320
  const dLng = radiusMeters / (111320 * Math.cos(lat * Math.PI / 180))
  return {
    low:  { latitude: lat - dLat, longitude: lng - dLng },
    high: { latitude: lat + dLat, longitude: lng + dLng },
  }
}

async function fetchGooglePlaces(lat: number, lng: number, cityName: string, category: string): Promise<GooglePlace[]> {
  if (!GOOGLE_KEY || GOOGLE_KEY === 'your_google_places_api_key') return []
  const cfg = CATEGORY_CONFIG[category]
  const query = cfg?.textQuery(cityName)
  if (!query) return []
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.formattedAddress,places.location,places.photos,places.regularOpeningHours,places.websiteUri,places.googleMapsUri,places.reviews' },
      // locationRestriction is a hard filter (unlike locationBias, which lets Google pull in
      // farther-away matches to pad out a short result list) — fewer results is preferable to
      // results from a different city/county.
      body: JSON.stringify({ textQuery: query, locationRestriction: { rectangle: boundingBox(lat, lng, 5000.0) }, maxResultCount: 20, ...(cfg.minRating ? { minRating: cfg.minRating } : {}) }),
    })
    if (!r.ok) return []
    return (await r.json()).places ?? []
  } catch { return [] }
}

interface PlacePhoto { thumb: string; full: string }

// Commons filenames use underscores/hyphens/parens as word separators, which are themselves
// regex "word" characters — so `\bmap\b` never matches "Map_of_the..." (no boundary exists
// between two word characters). Normalizing separators to spaces first makes `\b` behave.
function normalizePhotoName(url: string): string {
  return decodeURIComponent(url).toLowerCase().replace(/[_\-().,]/g, ' ')
}

// Commons full-text search can surface tragedy/disaster photos cross-tagged under the same
// landmark (e.g. a 9/11 photo tagged under "Statue of Liberty", or dated "September 2001")
// — filter those out so the travel-planning album stays to scenery/architecture/food.
const UNSAFE_PHOTO_TERMS = /\b(fire|attack|crash|disaster|riot|shooting|explosion|protest|funeral|flood|collapse|wreck|terror|9 11|911|world trade center|wtc|ground zero|twin towers|september 1[0-4] 2001)\b/

// Text search also surfaces scanned maps, historical archive illustrations, and
// administrative/government-document images (a city's own "Landmarks Preservation
// Commission" reliably pollutes a "landmarks" query) — none of which look like the
// scenic, current-day album this is for.
const NON_SCENIC_TERMS = /\b(map|plaque|commission|preservation|document|blueprint|schematic|diagram|logo|seal|certificate|bw|black and white|illustration|engraving)\b/

// Library of Congress Control Numbers ("LCCN2004676647") butt straight up against the
// following digits with no separator, so a `\b`-bounded "lccn" term never matches — check
// this one as a plain substring instead.
const HAS_LCCN = /lccn\d/

// A lone 4-digit year older than ~1990 in the filename is a strong signal of an archival/
// historical scan rather than a current, "beautiful iconic" travel photo.
const OLD_YEAR = /\b(1[4-9]\d{2})s?\b/
function hasOldYear(text: string): boolean {
  const m = text.match(OLD_YEAR)
  return !!m && parseInt(m[1], 10) < 1990
}

// Shared Wikimedia Commons image search — free, no API key, and already proven
// CORS-friendly (same endpoint used for train station photos in TrainMap.tsx).
async function fetchWikimediaSearchPhotos(query: string, limit: number): Promise<PlacePhoto[]> {
  try {
    const r = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6` +
      `&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url&iiurlwidth=640` +
      `&format=json&origin=*&gsrlimit=${limit}`
    )
    const d = await r.json()
    const pages = Object.values(d.query?.pages ?? {}) as { imageinfo?: { url: string; thumburl?: string }[] }[]
    return pages
      .map(p => p.imageinfo?.[0])
      .filter((info): info is { url: string; thumburl?: string } => {
        if (!info?.url || !/\.(jpe?g|png|webp)/i.test(info.url)) return false
        const normalized = normalizePhotoName(info.url)
        return !UNSAFE_PHOTO_TERMS.test(normalized) && !NON_SCENIC_TERMS.test(normalized) && !HAS_LCCN.test(normalized) && !hasOldYear(normalized)
      })
      .map(info => ({ thumb: info.thumburl ?? info.url, full: info.url }))
  } catch { return [] }
}

const _placePhotoCache: Record<string, PlacePhoto[]> = {}

// Supplements Google's (often sparse) place photos with community photos from Wikimedia Commons.
async function fetchWikimediaPlacePhotos(placeName: string, cityName: string): Promise<PlacePhoto[]> {
  const key = `${placeName}::${cityName}`
  if (_placePhotoCache[key] !== undefined) return _placePhotoCache[key]
  const photos = (await fetchWikimediaSearchPhotos(`${placeName} ${cityName}`, 8)).slice(0, 8)
  _placePhotoCache[key] = photos
  return photos
}

const _cityPhotoCache: Record<string, PlacePhoto[]> = {}

// Generic filler words to ignore when comparing filenames for same-subject duplicates —
// Commons filenames are full of these plus the city's own name, neither of which help
// tell two different landmarks apart.
const PHOTO_STOPWORDS = new Set([
  'the', 'and', 'of', 'in', 'at', 'on', 'near', 'from', 'with', 'usa', 'photo', 'image', 'img',
  'panoramio', 'view', 'crop', 'cropped', 'bw', 'file', 'pic', 'picture', 'photograph',
  'downtown', 'skyline', 'cityscape', 'landmark', 'landmarks', 'architecture', 'building',
  'buildings', 'famous', 'food', 'street', 'scenic', 'resort', 'city', 'town',
])

// Reduces a Commons filename to the handful of words that actually identify its subject
// (strips the city name, generic photography/category noise, numbers, and dates).
function significantWords(url: string, cityName: string): string[] {
  const filename = decodeURIComponent(url.split('/').pop() ?? '').replace(/\.(jpe?g|png|webp)$/i, '')
  const cityWords = new Set(cityName.toLowerCase().split(/[^a-z]+/).filter(Boolean))
  return filename
    .replace(/[_\-(),.]/g, ' ')
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !/^\d+$/.test(w) && !PHOTO_STOPWORDS.has(w) && !cityWords.has(w))
    .slice(0, 6)
}

// Two photos are treated as the same subject (e.g. two different Statue of Liberty shots)
// if they share 2+ identifying words, or share one long/distinctive word.
function isSameSubject(a: string[], b: string[]): boolean {
  const shared = a.filter(w => b.includes(w))
  return shared.length >= 2 || shared.some(w => w.length >= 6)
}

// The stop card's `photo` field is often a generic stock/placeholder image, not an actual
// photo of that city. This builds a richer album from targeted Commons searches, ordered
// landscape → landmarks → street scenes → scenic/resort → local food, deduplicating photos
// of the same subject (e.g. several Statue of Liberty shots) down to one.
async function fetchCityAlbumPhotos(cityName: string): Promise<PlacePhoto[]> {
  if (_cityPhotoCache[cityName] !== undefined) return _cityPhotoCache[cityName]
  const categories = [
    { query: `${cityName} skyline cityscape`, take: 2 },
    { query: `${cityName} landmarks`,          take: 4 },
    { query: `${cityName} street`,             take: 2 },
    { query: `${cityName} scenic resort`,      take: 2 },
    { query: `${cityName} famous food`,        take: 2 },
  ]
  const groups = await Promise.all(categories.map(c => fetchWikimediaSearchPhotos(c.query, 15)))

  const seenUrls = new Set<string>()
  const seenSubjects: string[][] = []
  const result: PlacePhoto[] = []

  groups.forEach((group, i) => {
    let added = 0
    for (const photo of group) {
      if (added >= categories[i].take) break
      if (seenUrls.has(photo.full)) continue
      const words = significantWords(photo.full, cityName)
      if (seenSubjects.some(prev => isSameSubject(prev, words))) continue
      seenUrls.add(photo.full)
      seenSubjects.push(words)
      result.push(photo)
      added++
    }
  })

  _cityPhotoCache[cityName] = result
  return result
}

// ─── Saved place lists (local, in-app) ─────────────────────────────────────────
// Google has no API to write into a user's Saved Places or My Maps, so there's no
// way to make "save" land in the user's actual Google account. Lists are instead
// saved locally in the browser, grouped into a folder named after the location.

interface SavedPlaceList { locationName: string; savedAt: string; places: GooglePlace[] }

const SAVED_LISTS_KEY = 'savedPlaceLists'

function loadSavedLists(): Record<string, SavedPlaceList> {
  try { return JSON.parse(localStorage.getItem(SAVED_LISTS_KEY) ?? '{}') } catch { return {} }
}

function persistSavedLists(lists: Record<string, SavedPlaceList>) {
  localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(lists))
}

function fmtEventTime(raw?: string): string | undefined {
  if (!raw) return undefined
  const [hStr, mStr] = raw.replace('Z', '').split(':')
  const h = parseInt(hStr, 10)
  if (Number.isNaN(h)) return undefined
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${mStr} ${period}`
}

async function fetchTicketmaster(lat: number, lng: number, startDate: string, endDate: string): Promise<UnifiedEvent[]> {
  if (!TM_KEY || TM_KEY === 'your_ticketmaster_api_key') return []
  try {
    const p = new URLSearchParams({ apikey: TM_KEY, latlong: `${lat},${lng}`, radius: '25', unit: 'miles', size: '20' })
    if (startDate) p.set('startDateTime', `${startDate}T00:00:00Z`)
    if (endDate)   p.set('endDateTime',   `${endDate}T23:59:59Z`)
    const r = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${p}`)
    if (!r.ok) return []
    const events: TMRawEvent[] = (await r.json())._embedded?.events ?? []
    return events.map(e => {
      const venue = e._embedded?.venues?.[0]
      const price = e.priceRanges?.[0]
      return {
        id: `tm-${e.id}`, source: 'Ticketmaster', name: e.name, url: e.url,
        date: e.dates.start.localDate, time: fmtEventTime(e.dates.start.localTime),
        venueName: venue?.name,
        venueAddress: [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(', ') || undefined,
        lat: venue?.location ? parseFloat(venue.location.latitude) : undefined,
        lng: venue?.location ? parseFloat(venue.location.longitude) : undefined,
        image: e.images?.slice().sort((a, b) => b.width - a.width)[0]?.url,
        priceMin: price?.min, priceMax: price?.max, currency: price?.currency,
      }
    })
  } catch { return [] }
}

// Eventbrite's public location-based search endpoint is restricted to approved
// partner accounts (deprecated for general use since 2019) — this returns [] on
// a 401/404 for most keys, but is wired up in case the key has search access.
async function fetchEventbrite(lat: number, lng: number, startDate: string, endDate: string): Promise<UnifiedEvent[]> {
  if (!EB_KEY || EB_KEY === 'your_eventbrite_key') return []
  try {
    const p = new URLSearchParams({
      'location.latitude': String(lat), 'location.longitude': String(lng),
      'location.within': '25mi', expand: 'venue',
    })
    if (startDate) p.set('start_date.range_start', `${startDate}T00:00:00Z`)
    if (endDate)   p.set('start_date.range_end',   `${endDate}T23:59:59Z`)
    const r = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${p}`, {
      headers: { Authorization: `Bearer ${EB_KEY}` },
    })
    if (!r.ok) return []
    const events: EBRawEvent[] = (await r.json()).events ?? []
    return events.map(e => ({
      id: `eb-${e.id}`, source: 'Eventbrite', name: e.name.text, url: e.url,
      date: e.start.local.split('T')[0], time: fmtEventTime(e.start.local.split('T')[1]),
      venueName: e.venue?.name, venueAddress: e.venue?.address?.localized_address_display,
      lat: e.venue ? parseFloat(e.venue.latitude) : undefined,
      lng: e.venue ? parseFloat(e.venue.longitude) : undefined,
      image: e.logo?.url,
    }))
  } catch { return [] }
}

async function fetchPredictHQ(lat: number, lng: number, startDate: string, endDate: string): Promise<UnifiedEvent[]> {
  if (!PHQ_KEY || PHQ_KEY === 'your_predicthq_key') return []
  try {
    const p = new URLSearchParams({
      within: `25km@${lat},${lng}`,
      category: 'concerts,festivals,performing-arts,community,expos,sports',
      sort: 'rank',
      limit: '20',
    })
    if (startDate) p.set('active.gte', startDate)
    if (endDate)   p.set('active.lte', endDate)
    const r = await fetch(`https://api.predicthq.com/v1/events/?${p}`, {
      headers: { Authorization: `Bearer ${PHQ_KEY}`, Accept: 'application/json' },
    })
    if (!r.ok) return []
    const events: PHQRawEvent[] = (await r.json()).results ?? []
    return events.map(e => {
      const venue = e.entities?.find(en => en.type === 'venue')
      return {
        id: `phq-${e.id}`, source: 'PredictHQ', name: e.title,
        date: e.start.split('T')[0], time: fmtEventTime(e.start.split('T')[1]),
        venueName: venue?.name, venueAddress: venue?.formatted_address,
        lat: e.location?.[1], lng: e.location?.[0],
        category: e.category,
      }
    })
  } catch { return [] }
}

async function fetchAllEvents(lat: number, lng: number, startDate: string, endDate: string): Promise<UnifiedEvent[]> {
  if (!startDate) return [] // no user-provided date range — don't call the event APIs at all
  const [tm, phq, eb] = await Promise.all([
    fetchTicketmaster(lat, lng, startDate, endDate),
    fetchPredictHQ(lat, lng, startDate, endDate),
    fetchEventbrite(lat, lng, startDate, endDate),
  ])
  return [...tm, ...phq, ...eb]
}


async function fetchGemini(stops: TripStop[], prompt: string, model: GeminiModel, startDate: string, endDate: string, weatherSummary: string): Promise<GeminiItinerary | null> {
  if (!GEM_KEY || GEM_KEY === 'your_gemini_api_key') return null
  try {
    const stopsText = stops.map(s => `- ${s.displayName} (${s.system})`).join('\n')
    const dateText  = startDate ? `Travel dates: ${startDate} to ${endDate || startDate}` : 'Weekend trip'
    // Trip length drives how many day-by-day schedules to ask for — a 4-day trip must get
    // 4 days back, not a fixed 2, otherwise the itinerary silently falls short of what the
    // user actually selected.
    const numDays = startDate && endDate
      ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
      : 2
    const interestTags = [...new Set((prompt.match(/#[\w-]+/g) ?? []).map(t => t.slice(1)))]
    const tagsText = interestTags.length ? interestTags.join(', ') : 'none specified'
    const text = `You are an expert local travel guide and regional historian for US train-accessible destinations. Generate a rich, personalized itinerary for this trip. Respond ONLY with valid JSON, no markdown, no commentary before or after the JSON.

${dateText}
Stops:
${stopsText}
User's stated interests and preferences (free text): "${prompt || 'A fun weekend trip'}"
User's selected interest tags: ${tagsText}
Actual weather for these dates: ${weatherSummary}

PERSONALIZATION REQUIREMENT: This itinerary must clearly read as written for THIS specific user, not a generic city guide. Explicitly call out their stated interests/tags by name at least once in the recommendation reasoning, and weave at least one of their interests/tags by name into each stop's introduction and into the day-by-day schedule (e.g. "since you're into #nightlife, ..." or "given your interest in fine dining, ..."). If no interests were given, base personalization on the free-text description instead.

First, give an overall recommendation for this trip:
- verdict: "Recommended", "Mixed", or "Not Recommended" — judged by cross-referencing the ACTUAL weather above against the user's stated interests. If the itinerary leans outdoor/hiking-heavy and the weather is hot, humid, stormy, or otherwise harsh, that should pull toward "Mixed" or "Not Recommended." If the plan is mostly indoor (museums, dining, shopping, nightlife) the weather matters much less. If the weather is genuinely pleasant for the planned activities, say so plainly as "Recommended."
- reasoning: 1 sentence only. Keep it concise and to the point. Explain how the weather suits the trip's overall tone without listing individual interests/tags.

Then, for EACH stop, provide all of the following, grounded in real, specific facts about that place (not generic filler):
- introduction: 2-3 sentences on what the place is known for and its historical significance — why it matters, not just what it is. Tie it back to at least one of the user's stated interests/tags by name.
- landmarks: 3-4 specific locations genuinely worth visiting there, each with a short story or piece of history behind it (who built it, what happened there, why it's notable) — not just a name and a one-line description.
- gettingAround: how to get around locally — the specific public transit available (subway/metro line names, bus routes, light rail, streetcar, bikeshare, ferry) and how walkable the area is. Be concrete to that city, not generic advice.
- whatToWear: clothing guidance tailored to the ACTUAL weather above AND the planned activities (e.g. walking-heavy itinerary, nightlife, hiking).
- hikingRoutes: ONLY if the user's stated interests mention or clearly imply hiking, nature trails, or outdoor exploration — list 1-3 real, popular hiking or nature trails near this stop with approximate difficulty and distance. If hiking isn't relevant to this trip, return an empty array.
- localSpecialties: 3-5 things tied to the area's food, industry, or craft economy that a visitor should specifically seek out (a regional dish, a product tied to local manufacturing/agricultural heritage, a farmers-market staple) — go beyond generic tourist recommendations.
- days: the trip is exactly ${numDays} day${numDays > 1 ? 's' : ''} long — return EXACTLY ${numDays} day-schedule${numDays > 1 ? 's' : ''} in the "days" array, one per array element, each a realistic time-blocked schedule built around the user's stated interests, with at least one activity per day explicitly matched to one of their named interests/tags. Never return fewer or more than ${numDays}.
- localTips: 2-3 tips only a local would know.

JSON shape:
{"overview":"...","highlights":["..."],"recommendation":{"verdict":"Recommended|Mixed|Not Recommended","reasoning":"..."},"stops":[{"stopName":"...","introduction":"...","landmarks":[{"name":"...","story":"..."}],"gettingAround":"...","whatToWear":"...","hikingRoutes":[{"name":"...","difficulty":"Easy|Moderate|Hard","description":"..."}],"localSpecialties":["..."],"days":[${Array(numDays).fill('[{"time":"9:00 AM","activity":"...","tip":"..."}]').join(',')}],"localTips":["..."]}],"packingList":["..."],"bestTimeToGo":"..."}`
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEM_KEY}`
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { temperature: 0.7 } }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      console.error('Gemini error', r.status, err)
      const msg = (err as { error?: { message?: string } }).error?.message ?? 'unknown'
      throw Object.assign(new Error(`${r.status}: ${msg}`), { status: r.status })
    }
    const d = await r.json()
    const raw = d.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) return null
    return JSON.parse(raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim())
  } catch (e) { console.error('Gemini failed', e); return null }
}

interface ChatMessage { role: 'user' | 'model'; text: string }

// Multi-turn follow-up chat scoped to a single location — a systemInstruction (kept
// separate from the conversation turns) keeps the model on-topic and gives it a fixed
// refusal script for anything unrelated to visiting this place.
async function fetchChatReply(locationName: string, history: ChatMessage[], model: GeminiModel): Promise<string | null> {
  if (!GEM_KEY || GEM_KEY === 'your_gemini_api_key') return null
  try {
    const systemInstruction = {
      parts: [{ text: `You are a friendly local travel guide chatbot whose ONLY job is helping the user plan and explore a visit to ${locationName}. Answer questions about: places to see, restaurants and food, activities, history and culture, getting around, weather, safety, and itinerary planning — all specifically about ${locationName}.

If the user asks about anything NOT related to visiting ${locationName} — including but not limited to relationships, financial or legal or medical advice, politics, coding help, schoolwork, general trivia, or trip planning for a different city — do NOT answer the question, not even briefly or partially. Instead reply with only something like: "I'm here to help you explore ${locationName} — feel free to ask me about places to visit, food, activities, or things to do here!" Keep on-topic answers conversational and concise (2-4 sentences unless the question clearly calls for more).` }],
    }
    const contents = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEM_KEY}`
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction, contents, generationConfig: { temperature: 0.6 } }),
    })
    if (!r.ok) return null
    const d = await r.json()
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  } catch (e) { console.error('Chat failed', e); return null }
}

// ─── App ──────────────────────────────────────────────────────────────────────

type Page = 'map' | 'loading' | 'result'

export default function App() {
  const [page, setPage]                 = useState<Page>('map')
  const [selectedStops, setSelectedStops] = useState<TripStop[]>([])
  const [showLines, setShowLines] = useState(true)
  const [prompt, setPrompt]             = useState('')
  const [model, setModel]               = useState<GeminiModel>('gemini-2.5-flash')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationRequested, setLR]      = useState(false)
  const [customFocus, setCustomFocus]   = useState<{ lat: number; lng: number; zoom?: number } | undefined>(undefined)
  const [googleUser, setGoogleUser]     = useState<GoogleProfile | null>(null)
  const [gsiReady, setGsiReady]         = useState(false)
  const signInContainerRef              = useRef<HTMLDivElement>(null)
  const hasGoogleAuth = !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_oauth_client_id'

  // Keep the credential callback pointed at this instance's state setter
  useEffect(() => {
    gsiCredentialHandler = (r: GoogleCredentialResponse) => {
      const profile = decodeGoogleJwt(r.credential)
      if (profile) setGoogleUser(profile)
    }
  }, [])

  // Load + initialize Google Identity Services (both are singletons — safe under StrictMode)
  useEffect(() => {
    if (!hasGoogleAuth) return
    let alive = true
    initGoogleIdentityServices(GOOGLE_CLIENT_ID).then(() => { if (alive) setGsiReady(true) })
    return () => { alive = false }
  }, [hasGoogleAuth])

  // Re-render the Google button whenever its container remounts (map ↔ result page).
  useEffect(() => {
    if (!gsiReady || googleUser) return
    const g = (window as unknown as { google?: GoogleIdApi }).google
    if (!g) return
    if (signInContainerRef.current) {
      signInContainerRef.current.innerHTML = ''
      g.accounts.id.renderButton(signInContainerRef.current, { theme: 'outline', size: 'medium', type: 'standard' })
    }
  }, [gsiReady, googleUser, page])

  const handleSignOut = () => {
    setGoogleUser(null)
    ;(window as unknown as { google?: GoogleIdApi }).google?.accounts.id.disableAutoSelect()
  }

  // Result page state
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [panelMinimized, setPanelMinimized] = useState(false)
  const [resultsPanelMinimized, setResultsPanelMinimized] = useState(false)
  const [selectedPlace, setSelectedPlace]   = useState<GooglePlace | null>(null)
  const [selectedEvent, setSelectedEvent]   = useState<UnifiedEvent | null>(null)
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)
  const [exportSelection, setExportSelection] = useState<Set<string>>(new Set())
  const [savedLists, setSavedLists]     = useState<Record<string, SavedPlaceList>>(() => loadSavedLists())
  const [showSavedPlaces, setShowSavedPlaces] = useState(false)
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null)
  const [placeCache, setPlaceCache]   = useState<Record<string, GooglePlace[]>>({})
  const [eventCache, setEventCache]   = useState<Record<string, UnifiedEvent[]>>({})
  const [loadingKey, setLoadingKey]   = useState<string | null>(null)
  const [weatherCache, setWeatherCache]     = useState<Record<string, WeatherDay | null>>({})
  const [forecastCache, setForecastCache]   = useState<Record<string, WeatherDay[]>>({})
  const [itinerary, setItinerary]     = useState<GeminiItinerary | null>(null)
  const [itinLoading, setItinLoading] = useState(false)
  const [itinError, setItinError]     = useState<'no-key' | 'failed' | 'quota' | null>(null)
  const [editingTrip, setEditingTrip] = useState(false)
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>('F')
  const [showWeatherInfo, setShowWeatherInfo] = useState(false)
  const [cityAlbum, setCityAlbum]     = useState<PlacePhoto[]>([])
  const [cityLightboxIndex, setCityLightboxIndex] = useState<number | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput]     = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const convertTemp = (f: number) => tempUnit === 'C' ? Math.round((f - 32) * 5 / 9) : f

  useEffect(() => {
    if (!locationRequested && 'geolocation' in navigator) {
      setLR(true)
      navigator.geolocation.getCurrentPosition(pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => {})
    }
  }, [])

  const handleSelectStop = (stop: TripStop) => {
    setSelectedStops(prev =>
      prev.some(s => s.id === stop.id) ? [] : [stop]
    )
  }

  const handleClearStop = (_id: string) => setSelectedStops([])

  const handleSelectLocation = (loc: LocationSuggestion) => {
    const shortName = loc.displayName.split(',')[0]?.trim() || loc.displayName
    const stop: TripStop = {
      id: `custom-${Date.now()}`,
      name: shortName,
      displayName: loc.displayName.split(',').slice(0, 2).join(',').trim() || loc.displayName,
      lat: loc.lat, lng: loc.lng,
      photo: `https://picsum.photos/seed/${encodeURIComponent(loc.displayName)}/400/250`,
      system: 'Custom',
      lines: [],
      dotColor: '#7c3aed',
    }
    setSelectedStops([stop])
    setCustomFocus({ lat: loc.lat, lng: loc.lng, zoom: 12 })
  }

  const handleGenerate = (p: string, m: GeminiModel, sd: string, ed: string) => {
    if (selectedStops.length === 0) return
    // Capture values immediately so the result-page effect sees them
    const stops = selectedStops
    setPrompt(p); setModel(m); setStartDate(sd); setEndDate(ed)
    setActiveCategory(null); setSelectedPlace(null); setSelectedEvent(null)
    setItinerary(null); setItinError(null); setWeatherCache({}); setForecastCache({})
    setPage('loading')
    setTimeout(() => {
      setPage('result')
      // Kick off fetches directly here so we don't rely on stale-closure useEffect
      const stop = stops[0]
      const isRange = !!(sd && ed && ed !== sd)
      const weatherPromise = stop ? fetchWeather(stop.lat, stop.lng, sd) : Promise.resolve(null)
      const rangePromise   = (stop && isRange) ? fetchWeatherRange(stop.lat, stop.lng, sd, ed) : Promise.resolve(null)
      if (stop) weatherPromise.then(w => setWeatherCache(prev => ({ ...prev, [stop.id]: w })))
      if (stop && isRange) rangePromise.then(days => { if (days) setForecastCache(prev => ({ ...prev, [stop.id]: days })) })
      stops.slice(1).forEach(s => fetchWeather(s.lat, s.lng, sd).then(w => setWeatherCache(prev => ({ ...prev, [s.id]: w }))))
      if (isRange) stops.slice(1).forEach(s => fetchWeatherRange(s.lat, s.lng, sd, ed).then(days => setForecastCache(prev => ({ ...prev, [s.id]: days }))))

      setItinLoading(true)
      const hasKey = GEM_KEY && GEM_KEY !== 'your_gemini_api_key'
      if (!hasKey) { setItinLoading(false); setItinError('no-key') }
      else Promise.all([weatherPromise, rangePromise])
        .then(([w, days]) => fetchGemini(stops, p, m, sd, ed, summarizeWeather(w, days)))
        .then(r => { setItinerary(r); setItinLoading(false); if (!r) setItinError('failed') })
        .catch((e: Error & { status?: number }) => { setItinLoading(false); setItinError(e.status === 429 ? 'quota' : 'failed'); console.error(e) })
      const cats = ALL_CATS.filter(c => p.includes(`#${c}`))
      if (stop) cats.forEach(cat => {
        const key = `${stop.id}::${cat}`
        if (cat === 'events') fetchAllEvents(stop.lat, stop.lng, sd, ed).then(ev => setEventCache(prev => ({ ...prev, [key]: ev })))
        else fetchGooglePlaces(stop.lat, stop.lng, stop.displayName, cat).then(ps => setPlaceCache(prev => ({ ...prev, [key]: ps })))
      })
    }, 1500)
  }

  const goBack = () => {
    setPage('map'); setActiveCategory(null)
  }

  // Result page derived values
  const selectedCategories = ALL_CATS.filter(c => prompt.includes(`#${c}`))
  const currentStop = selectedStops[0] ?? null
  const cityPhotos: PlacePhoto[] = cityAlbum.length > 0 ? cityAlbum : (currentStop ? [{ thumb: currentStop.photo, full: currentStop.photo }] : [])
  const cacheKey    = currentStop && activeCategory ? `${currentStop.id}::${activeCategory}` : null
  const places      = (cacheKey && activeCategory !== 'events') ? (placeCache[cacheKey] ?? []) : []
  const events      = (cacheKey && activeCategory === 'events') ? (eventCache[cacheKey] ?? []) : []
  const isLoading   = loadingKey === cacheKey
  const catCfg      = activeCategory ? CATEGORY_CONFIG[activeCategory] : null

  useEffect(() => {
    setCityAlbum([])
    if (currentStop) {
      const cityQuery = currentStop.state ? `${currentStop.name}, ${currentStop.state}` : currentStop.name
      fetchCityAlbumPhotos(cityQuery).then(setCityAlbum)
    }
  }, [currentStop?.id])

  // Reset the chat when the location changes — the conversation is scoped to one place
  useEffect(() => {
    setChatMessages([])
    setChatInput('')
  }, [currentStop?.id])

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const question = chatInput.trim()
    if (!question || !currentStop || chatLoading) return
    const newHistory: ChatMessage[] = [...chatMessages, { role: 'user', text: question }]
    setChatMessages(newHistory)
    setChatInput('')
    setChatLoading(true)
    const reply = await fetchChatReply(currentStop.name, newHistory, model)
    setChatMessages(prev => [...prev, { role: 'model', text: reply ?? "Sorry, I couldn't get a response — please try again." }])
    setChatLoading(false)
  }

  // All POI markers from every fetched category, for Google Maps
  const allMapMarkers: MapMarker[] = currentStop ? ALL_CATS.flatMap(cat => {
    if (!selectedCategories.includes(cat)) return []
    const key = `${currentStop.id}::${cat}`
    if (cat === 'events') {
      return (eventCache[key] ?? [])
        .filter((e): e is UnifiedEvent & { lat: number; lng: number } => e.lat !== undefined && e.lng !== undefined)
        .map(e => ({
          id: e.id,
          lat: e.lat, lng: e.lng,
          name: e.name, category: cat,
          icon: CATEGORY_CONFIG[cat].img,
          color: CATEGORY_COLORS[cat] ?? '#06b6d4',
          mapsUrl: e.url,
        }))
    }
    return (placeCache[key] ?? []).map(p => ({
      id: p.id,
      lat: p.location.latitude, lng: p.location.longitude,
      name: p.displayName.text, category: cat,
      icon: CATEGORY_CONFIG[cat].img,
      color: CATEGORY_COLORS[cat] ?? '#7c3aed',
      rating: p.rating, address: p.formattedAddress,
      mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName.text)}`,
    }))
  }) : []

  const activeCategoryCount = activeCategory === 'all'
    ? allMapMarkers.length
    : allMapMarkers.filter(m => m.category === activeCategory).length


  const handleMarkerClick = (markerId: string) => {
    for (const places of Object.values(placeCache)) {
      const found = places.find(p => p.id === markerId)
      if (found) {
        setSelectedPlace(found)
        setPanelMinimized(false)
        if (!activeCategory) setActiveCategory('all')
        return
      }
    }
    for (const events of Object.values(eventCache)) {
      const found = events.find(e => e.id === markerId)
      if (found) {
        setSelectedEvent(found)
        setPanelMinimized(false)
        if (!activeCategory) setActiveCategory('all')
        return
      }
    }
  }

  const handleCategoryClick = (cat: string) => {
    if (!currentStop) return
    const key = `${currentStop.id}::${cat}`
    if (activeCategory === cat) { setPanelMinimized(p => !p); return }
    setActiveCategory(cat); setPanelMinimized(false); setSelectedPlace(null); setSelectedEvent(null); setExportSelection(new Set())
    if (cat === 'events') {
      if (eventCache[key] !== undefined) return
      setLoadingKey(key)
      fetchAllEvents(currentStop.lat, currentStop.lng, startDate, endDate).then(ev => { setEventCache(prev => ({ ...prev, [key]: ev })); setLoadingKey(null) })
    } else {
      if (placeCache[key] !== undefined) return
      setLoadingKey(key)
      fetchGooglePlaces(currentStop.lat, currentStop.lng, currentStop.displayName, cat).then(ps => { setPlaceCache(prev => ({ ...prev, [key]: ps })); setLoadingKey(null) })
    }
  }

  const handleUpdateTrip = (stop: TripStop, sd: string, ed: string) => {
    setSelectedStops([stop])
    setStartDate(sd); setEndDate(ed)
    setActiveCategory(null); setSelectedPlace(null); setSelectedEvent(null); setExportSelection(new Set())
    setItinerary(null); setItinError(null); setWeatherCache({}); setForecastCache({})
    setPlaceCache({}); setEventCache({})
    setEditingTrip(false)

    const isRange = !!(sd && ed && ed !== sd)
    const weatherPromise = fetchWeather(stop.lat, stop.lng, sd)
    const rangePromise   = isRange ? fetchWeatherRange(stop.lat, stop.lng, sd, ed) : Promise.resolve(null)
    weatherPromise.then(w => setWeatherCache(prev => ({ ...prev, [stop.id]: w })))
    if (isRange) rangePromise.then(days => { if (days) setForecastCache(prev => ({ ...prev, [stop.id]: days })) })

    setItinLoading(true)
    const hasKey = GEM_KEY && GEM_KEY !== 'your_gemini_api_key'
    if (!hasKey) { setItinLoading(false); setItinError('no-key') }
    else Promise.all([weatherPromise, rangePromise])
      .then(([w, days]) => fetchGemini([stop], prompt, model, sd, ed, summarizeWeather(w, days)))
      .then(r => { setItinerary(r); setItinLoading(false); if (!r) setItinError('failed') })
      .catch((e: Error & { status?: number }) => { setItinLoading(false); setItinError(e.status === 429 ? 'quota' : 'failed'); console.error(e) })
    const cats = ALL_CATS.filter(c => prompt.includes(`#${c}`))
    cats.forEach(cat => {
      const key = `${stop.id}::${cat}`
      if (cat === 'events') fetchAllEvents(stop.lat, stop.lng, sd, ed).then(ev => setEventCache(prev => ({ ...prev, [key]: ev })))
      else fetchGooglePlaces(stop.lat, stop.lng, stop.displayName, cat).then(ps => setPlaceCache(prev => ({ ...prev, [key]: ps })))
    })
  }

  const toggleExportSelect = (id: string) => {
    setExportSelection(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSaveSelectedPlaces = (places: GooglePlace[]) => {
    if (places.length === 0 || !currentStop) return
    const locationName = currentStop.name
    setSavedLists(prev => {
      const existingPlaces = prev[locationName]?.places ?? []
      const merged = [...existingPlaces]
      for (const p of places) {
        if (!merged.some(m => m.id === p.id)) merged.push(p)
      }
      const next = { ...prev, [locationName]: { locationName, savedAt: new Date().toISOString(), places: merged } }
      persistSavedLists(next)
      return next
    })
    setExportSelection(new Set())
    setSaveConfirmation(`Saved ${places.length} place${places.length > 1 ? 's' : ''} to "${locationName}"`)
    setTimeout(() => setSaveConfirmation(null), 2500)
  }

  const handleRemoveSavedPlace = (locationName: string, placeId: string) => {
    setSavedLists(prev => {
      const list = prev[locationName]
      if (!list) return prev
      const remaining = list.places.filter(p => p.id !== placeId)
      const next = { ...prev }
      if (remaining.length === 0) delete next[locationName]
      else next[locationName] = { ...list, places: remaining }
      persistSavedLists(next)
      return next
    })
  }

  const handleRemoveSavedFolder = (locationName: string) => {
    setSavedLists(prev => {
      const next = { ...prev }
      delete next[locationName]
      persistSavedLists(next)
      return next
    })
  }

  // (fetching is handled inside handleGenerate's setTimeout to avoid stale closure)

  // ── MAP PAGE ───────────────────────────────────────────────────────────────
  if (page === 'map' || page === 'loading') {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
        <Header
          onNavigate={() => { setPage('map'); setSelectedStops([]) }}
          googleUser={googleUser}
          hasGoogleAuth={hasGoogleAuth}
          signInContainerRef={signInContainerRef}
          onSignOut={handleSignOut}
          savedPlacesCount={Object.values(savedLists).reduce((n, l) => n + l.places.length, 0)}
          onOpenSavedPlaces={() => setShowSavedPlaces(true)}
          showRoutesToggle
          routesOn={showLines}
          onToggleRoutes={() => setShowLines(v => !v)}
        />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="relative flex-shrink-0" style={{ height: '40vh', minHeight: 200 }}>
            <TrainMap
              selectedStops={selectedStops}
              onSelectStop={handleSelectStop}
              userLocation={userLocation}
              focusLocation={customFocus}
              externalMarkers={selectedStops.filter(s => s.system === 'Custom').map(s => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.displayName, icon: '📍', color: '#f59e0b' }))}
              showLines={showLines}
              onToggleLines={() => setShowLines(v => !v)}
            />
            {selectedStops.length > 0 && (
              <div className="absolute top-3 right-3 z-[1000] bg-amber-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
                ✓ {selectedStops[0].name} selected
              </div>
            )}
            {page === 'loading' && (
              <div className="absolute inset-0 z-[2000] bg-black/50 flex flex-col items-center justify-center gap-4">
                <div className="text-5xl animate-bounce">🚂</div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-8 py-5 shadow-2xl text-center">
                  <p className="font-bold text-gray-800 dark:text-white text-lg">Planning your route...</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{selectedStops.map(s => s.name).join(' → ')}</p>
                  <div className="mt-4 flex gap-1.5 justify-center">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <PromptSection selectedStops={selectedStops} onGenerate={handleGenerate} onClearStop={handleClearStop} onSelectLocation={handleSelectLocation} />
        </main>
        <SavedPlacesModal
          show={showSavedPlaces} onClose={() => setShowSavedPlaces(false)}
          savedLists={savedLists} onRemovePlace={handleRemoveSavedPlace} onRemoveFolder={handleRemoveSavedFolder}
        />
      </div>
    )
  }

  // ── RESULT PAGE ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Header
        onNavigate={goBack}
        googleUser={googleUser}
        hasGoogleAuth={hasGoogleAuth}
        signInContainerRef={signInContainerRef}
        onSignOut={handleSignOut}
        savedPlacesCount={Object.values(savedLists).reduce((n, l) => n + l.places.length, 0)}
        onOpenSavedPlaces={() => setShowSavedPlaces(true)}
        showRoutesToggle
        routesOn={showLines}
        onToggleRoutes={() => setShowLines(v => !v)}
      />
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left 60%: map + category browsing ── */}
        <div className="flex flex-col overflow-hidden transition-all duration-200" style={{ width: resultsPanelMinimized ? 'calc(100% - 44px)' : '60%' }}>
        <div className="flex flex-1 overflow-hidden">

        {/* ── Left category column ── */}
        <div className="w-28 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto z-10">
          {/* Back button */}
          <button onClick={goBack} title="Back to map"
            className="flex flex-col items-center gap-0.5 py-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <span className="text-base">←</span>
            <span className="text-xs font-semibold">Back</span>
          </button>

          {/* Category icons — only selected hashtags */}
          <div className="flex flex-col gap-1 p-1.5 flex-1">
            {selectedCategories.length === 0 ? (
              <p className="text-xs text-gray-400 text-center mt-2 leading-tight">Pick hashtags to explore</p>
            ) : (
              <>
                {/* All button */}
                <button
                  onClick={() => { setActiveCategory('all'); setPanelMinimized(false) }}
                  title="All places"
                  className={`w-full flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all border ${
                    activeCategory === 'all'
                      ? 'bg-blue-500 border-blue-500 shadow-md'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}>
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#2f6fed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {/* Top layer */}
                    <path d="M12 2L22 8V12L12 18L2 12V8L12 2Z" />
                    {/* Middle layer */}
                    <path d="M12 8L22 14V18L12 24L2 18V14L12 8Z" opacity="0.7" />
                    {/* Bottom layer */}
                    <path d="M12 14L22 20V24L12 30L2 24V20L12 14Z" opacity="0.4" />
                  </svg>
                  <span className={`text-xs font-semibold leading-tight text-center ${activeCategory === 'all' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>All</span>
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
              </>
            )}
            {selectedCategories.map(cat => {
                const cfg = CATEGORY_CONFIG[cat]
                const active = activeCategory === cat
                const color = CATEGORY_COLORS[cat] || '#7c3aed'
                return (
                  <button key={cat} onClick={() => handleCategoryClick(cat)} title={cfg.label}
                    className={`w-full flex flex-col items-center gap-1.5 py-2 rounded-xl transition-all border ${
                      active
                        ? 'bg-blue-500 border-blue-500 shadow-md'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}>
                    <div className="w-6 h-6 flex items-center justify-center" style={{ fontSize: '22px', color: color }}>
                      {cfg.icon}
                    </div>
                    <span className={`text-xs font-semibold leading-tight text-center ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {cfg.label.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)}
                    </span>
                  </button>
                )
              })
            }
          </div>
        </div>

        {/* ── Centre + right: map + panel + below ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Map row — takes up maximum space */}
          <div className="relative flex-1 bg-white dark:bg-gray-800">
            <TrainMap
              selectedStops={selectedStops}
              onSelectStop={() => {}}
              userLocation={userLocation}
              focusLocation={selectedPlace
                ? { lat: selectedPlace.location.latitude, lng: selectedPlace.location.longitude, zoom: 16 }
                : currentStop ? { lat: currentStop.lat, lng: currentStop.lng, zoom: 14 } : undefined}
              externalMarkers={allMapMarkers
                .filter(m => !activeCategory || activeCategory === 'all' || activeCategory === m.category)
                .map(m => ({
                  id: m.id,
                  lat: m.lat, lng: m.lng, label: m.name,
                  icon: m.icon,
                  color: m.color,
                  highlighted: m.id === hoveredPlaceId || m.id === selectedPlace?.id,
                  iconMode: (activeCategory && activeCategory !== 'all' ? 'dot' : 'icon') as 'dot' | 'icon',
                }))}
              onMarkerClick={handleMarkerClick}
              showLines={showLines}
              onToggleLines={() => setShowLines(v => !v)}
            />

            {/* Category label overlay */}
            {activeCategory && !panelMinimized && (
              <div className="absolute top-3 left-3 z-[500] bg-white dark:bg-gray-800 rounded-xl px-3 py-1.5 shadow-md border border-gray-100 dark:border-gray-700 flex items-center gap-2 pointer-events-none">
                {activeCategory === 'all' ? (
                  <div className="w-5 h-5 flex items-center justify-center" style={{ fontSize: '14px', color: '#2f6fed' }}>🗂</div>
                ) : (
                  <div className="w-5 h-5 flex items-center justify-center" style={{ fontSize: '14px', color: CATEGORY_COLORS[activeCategory] || '#7c3aed' }}>{CATEGORY_CONFIG[activeCategory]?.icon}</div>
                )}
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{activeCategory === 'all' ? 'All Places' : catCfg?.label}</span>
                {activeCategoryCount > 0 && <span className="text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full px-1.5 font-bold">{activeCategoryCount}</span>}
              </div>
            )}

            {/* Right panel — overlays map */}
            {activeCategory && (
              <div className={`absolute top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 z-[500] ${panelMinimized ? 'w-10' : 'w-96'}`}>
                {/* Minimize toggle */}
                <button onClick={() => setPanelMinimized(p => !p)}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10"
                  title={panelMinimized ? 'Expand' : 'Collapse'}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {panelMinimized ? (
                      <polyline points="15 18 9 12 15 6" />
                    ) : (
                      <polyline points="9 18 15 12 9 6" />
                    )}
                  </svg>
                </button>

                {panelMinimized ? (
                  <div className="flex-1 flex flex-col items-center pt-16">
                    {activeCategory === 'all' ? (
                      <div className="w-6 h-6 flex items-center justify-center" style={{ fontSize: '20px', color: '#2f6fed' }}>🗂</div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center" style={{ fontSize: '20px', color: CATEGORY_COLORS[activeCategory] || '#7c3aed' }}>{CATEGORY_CONFIG[activeCategory]?.icon}</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {activeCategory === 'all' ? (
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center" style={{ fontSize: '20px', color: '#2f6fed' }}>🗂</div>
                        ) : (
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center" style={{ fontSize: '20px', color: CATEGORY_COLORS[activeCategory] || '#7c3aed' }}>{CATEGORY_CONFIG[activeCategory]?.icon}</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{activeCategory === 'all' ? 'All Places' : catCfg?.label}</p>
                          <p className="text-sm text-gray-400 truncate">near {currentStop?.name}</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveCategory(null)} className="text-gray-300 hover:text-gray-500 text-lg flex-shrink-0 ml-1">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {selectedPlace ? (
                        <PlaceDetail
                          place={selectedPlace}
                          googleKey={GOOGLE_KEY}
                          visitDuration={activeCategory && activeCategory !== 'all' ? CATEGORY_CONFIG[activeCategory]?.visitDuration : undefined}
                          onBack={() => setSelectedPlace(null)}
                        />
                      ) : selectedEvent ? (
                        <EventDetail
                          event={selectedEvent}
                          googleKey={GOOGLE_KEY}
                          onBack={() => setSelectedEvent(null)}
                        />
                      ) : activeCategory === 'all' ? (
                        allMapMarkers.length === 0
                          ? <EmptyState icon="🗂" msg="No places loaded yet — select hashtags and wait a moment" />
                          : selectedCategories.map(cat => {
                              if (!currentStop) return null
                              const key = `${currentStop.id}::${cat}`
                              const cfg = CATEGORY_CONFIG[cat]
                              const catPlaces = cat === 'events' ? [] : (placeCache[key] ?? [])
                              const catEvents = cat === 'events' ? (eventCache[key] ?? []) : []
                              if (catPlaces.length === 0 && catEvents.length === 0) return null
                              return (
                                <div key={cat}>
                                  <div className="flex items-center gap-1.5 mb-1.5"><div className="w-4 h-4 flex items-center justify-center" style={{ fontSize: '12px', color: CATEGORY_COLORS[cat] || '#7c3aed' }}>{cfg.icon}</div><p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{cfg.label}</p></div>
                                  <div className="space-y-2">
                                    {cat === 'events'
                                      ? catEvents.slice(0, 3).map(e => <EventCard key={e.id} event={e} onSelect={setSelectedEvent} />)
                                      : catPlaces.slice(0, 6).map(p => <PlaceCard key={p.id} place={p} visitDuration={cfg.visitDuration} googleKey={GOOGLE_KEY} onSelect={setSelectedPlace} onHoverChange={setHoveredPlaceId} />)
                                    }
                                  </div>
                                </div>
                              )
                            })
                      ) : isLoading ? (
                        [1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)
                      ) : activeCategory === 'events' ? (
                        events.length === 0
                          ? <EmptyState icon="🎭" msg={
                              !startDate
                                ? 'Add travel dates on the map page to search for events'
                                : [TM_KEY, EB_KEY, PHQ_KEY].every(k => !k || k.startsWith('your_'))
                                  ? 'Add a Ticketmaster, Eventbrite, or PredictHQ key to .env'
                                  : `No events near ${currentStop?.name}`
                            } />
                          : events.map(e => <EventCard key={e.id} event={e} onSelect={setSelectedEvent} />)
                      ) : (
                        places.length === 0
                          ? <EmptyState icon={catCfg?.icon ?? '📍'} msg={!GOOGLE_KEY || GOOGLE_KEY === 'your_google_places_api_key' ? 'Add VITE_GOOGLE_PLACES_KEY to .env' : `No results near ${currentStop?.name}`} />
                          : (
                            <>
                              <div className="flex items-center justify-between gap-2 pb-1">
                                <button
                                  onClick={() => setExportSelection(exportSelection.size === places.length ? new Set() : new Set(places.map(p => p.id)))}
                                  className="text-sm font-semibold text-blue-500 hover:text-blue-700"
                                >
                                  {exportSelection.size === places.length ? 'Clear selection' : `Select all (${places.length})`}
                                </button>
                                {exportSelection.size > 0 && (
                                  <button
                                    onClick={() => handleSaveSelectedPlaces(places.filter(p => exportSelection.has(p.id)))}
                                    className="text-sm font-semibold px-2.5 py-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                                  >💾 Save ({exportSelection.size})</button>
                                )}
                              </div>
                              {places.map(p => (
                                <PlaceCard
                                  key={p.id} place={p} visitDuration={catCfg?.visitDuration} googleKey={GOOGLE_KEY} onSelect={setSelectedPlace}
                                  selectable selected={exportSelection.has(p.id)} onToggleSelect={toggleExportSelect}
                                  onHoverChange={setHoveredPlaceId}
                                />
                              ))}
                            </>
                          )
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* White space below map + Location/Time edit bar at bottom — aligned with right panel */}
          <div className="flex-shrink-0 flex flex-col bg-white dark:bg-gray-800">
            
            {/* Trip summary + edit — at the bottom */}
            {editingTrip ? (
              <TripEditBar
                currentStop={currentStop}
                startDate={startDate}
                endDate={endDate}
                onSearch={handleUpdateTrip}
                onCancel={() => setEditingTrip(false)}
              />
            ) : (
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 min-w-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="12" cy="19.3" rx="7.4" ry="2.2" fill="none" stroke="#2f6fed" strokeWidth="1.3" />
                    <path d="M12 2.2c-4.1 0-7.4 3.2-7.4 7.2 0 5.3 7.4 11.4 7.4 11.4s7.4-6.1 7.4-11.4c0-4-3.3-7.2-7.4-7.2z" fill="#8ec2f2" stroke="#2f6fed" strokeWidth="1.3" />
                    <circle cx="12" cy="9.3" r="2.6" fill="#fff" stroke="#2f6fed" strokeWidth="1.3" />
                  </svg>
                  <span className="font-semibold truncate">{currentStop?.displayName}</span>
                  {startDate && (
                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">· {startDate}{endDate && endDate !== startDate ? ` → ${endDate}` : ''}</span>
                  )}
                </div>
                <button onClick={() => setEditingTrip(true)} className="text-sm font-semibold text-blue-500 hover:text-blue-700 flex-shrink-0 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#2f6fed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              </div>
            )}

            {/* Weather bar — at the bottom */}
            {currentStop && startDate && (() => {
              const isRange = startDate && endDate && endDate !== startDate
              const days = isRange ? forecastCache[currentStop.id] : null
              const w    = weatherCache[currentStop.id]
              const mmdd = (iso: string) => { const [,m,d] = iso.split('-'); return `${m}/${d}` }

              const unitToggle = (
                <button
                  onClick={() => setTempUnit(u => u === 'F' ? 'C' : 'F')}
                  title="Switch temperature unit"
                  className="flex-shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >°{tempUnit}</button>
              )

              if (isRange && days && days.length > 0) {
                return (
                  <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    {unitToggle}
                    <div className="flex items-center justify-center gap-1 flex-1 overflow-x-auto">
                      {days.map((day, i) => (
                        <div key={i} className="flex flex-col items-center px-2 min-w-[44px]">
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{mmdd(day.date!)}</span>
                          {day.available === false ? (
                            <>
                              <span className="text-lg leading-none my-0.5 opacity-30">❔</span>
                              <span className="text-xs text-gray-400 leading-tight text-center">TBD</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg leading-none my-0.5">{wxEmoji(day.iconCode)}</span>
                              <span className="text-sm font-bold text-gray-800 dark:text-white">{convertTemp(day.high)}°</span>
                              <span className="text-xs text-gray-400">{convertTemp(day.low)}°</span>
                              <span className="text-xs text-blue-400">
                                💧{day.precipitation}{day.isHistorical ? 'mm' : '%'}
                              </span>
                              {day.isHistorical && (
                                <span className="flex items-center gap-0.5 mt-0.5">
                                  <span className="text-xs text-amber-500 font-semibold leading-tight text-center">{day.historicalYear} data</span>
                                  <button
                                    onClick={() => setShowWeatherInfo(true)}
                                    title="Why is this historical data?"
                                    aria-label="Why is this historical data?"
                                    className="w-3.5 h-3.5 flex-shrink-0 rounded-full border border-amber-400 text-amber-500 text-[9px] font-bold flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                  >i</button>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              if (!w) return null
              return (
                <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                  {unitToggle}
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{wxEmoji(w.iconCode)}</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-white">{convertTemp(w.high)}° / {convertTemp(w.low)}°{tempUnit}</span>
                      {startDate && <>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-xs text-gray-400">{mmdd(startDate)}</span>
                      </>}
                    </div>
                    <span className="text-sm text-blue-500 mt-0.5">* Chance of precipitation: {w.precipitation}%</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
        </div>
        </div>

        {/* ── Right 40%: AI itinerary results ── */}
        {resultsPanelMinimized ? (
          <div className="flex flex-col items-center border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0" style={{ width: '44px' }}>
            {/* Expand button - fixed on screen, centered vertically */}
            <button
              onClick={() => setResultsPanelMinimized(false)}
              title="Expand AI suggestions"
              aria-label="Expand AI suggestions"
              className="fixed w-6 h-6 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              style={{ right: 'calc(44px - 6px)', top: '50%', transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        ) : (
        <div className="flex flex-col overflow-y-auto border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-200" style={{ width: '40%' }}>
            {/* Minimize button - fixed on screen, centered vertically, stays visible when scrolling */}
            <button
              onClick={() => setResultsPanelMinimized(true)}
              title="Minimize panel and expand map"
              aria-label="Minimize panel and expand map"
              className="fixed w-6 h-6 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors z-40"
              style={{ right: 'calc(40% - 6px)', top: '50%', transform: 'translateY(-50%)' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <div className="p-5 space-y-6">

              {/* Stop summary cards */}
              <div>
                <h3 className="text-base font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                  {currentStop?.displayName || 'Your Stops'}
                  {startDate && <span className="text-sm font-normal text-gray-400">· {startDate}{endDate && endDate !== startDate ? ` → ${endDate}` : ''}</span>}
                </h3>
                {currentStop && (() => {
                  const booking = currentStop.system === 'Custom'
                    ? { label: 'Open in Google Maps', url: `https://www.google.com/maps/search/?api=1&query=${currentStop.lat},${currentStop.lng}` }
                    : BOOKING_LINKS[currentStop.system]
                  return (
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-700/40">
                      <div className="flex gap-1.5 overflow-x-auto p-2">
                        {cityPhotos.map((p, i) => (
                          <img
                            key={i} src={p.thumb} alt={i === 0 ? currentStop.name : ''} loading={i === 0 ? undefined : 'lazy'}
                            onClick={() => setCityLightboxIndex(i)}
                            className="h-24 w-32 flex-shrink-0 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onError={e => (e.currentTarget.style.display='none')}
                          />
                        ))}
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {currentStop.lines.slice(0, 4).map(l => <span key={l} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded font-medium">{l}</span>)}
                        </div>
                        <a href={booking.url} target="_blank" rel="noopener noreferrer"
                          className="block text-center text-sm py-2 bg-white dark:bg-gray-600 text-blue-500 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold">
                          {booking.label} →
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Gemini suggestions */}
              <div>

                {itinLoading && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800 text-center">
                    <p className="text-sm text-purple-500 animate-pulse font-semibold">Generating your personalized itinerary…</p>
                  </div>
                )}
                {!itinLoading && !itinerary && itinError === 'no-key' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-semibold mb-1">Gemini API key missing</p>
                    <p>Add <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">VITE_GEMINI_KEY=AIza...</code> to your <code>.env</code> file and restart the dev server.</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-amber-600 dark:text-amber-400 underline">Get a free key at Google AI Studio →</a>
                  </div>
                )}
                {!itinLoading && !itinerary && itinError === 'quota' && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-3 text-sm text-orange-700 dark:text-orange-300">
                    <p className="font-semibold mb-1">Gemini credits depleted</p>
                    <p>Your prepaid API credits are exhausted. Get a free-tier key from Google AI Studio (no billing required).</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-orange-600 dark:text-orange-400 underline">Get a free API key →</a>
                  </div>
                )}
                {!itinLoading && !itinerary && itinError === 'failed' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
                    <p className="font-semibold mb-1">Couldn't generate itinerary</p>
                    <p>Something went wrong. Check the browser console for details.</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-red-600 dark:text-red-400 underline">Check your key at Google AI Studio →</a>
                  </div>
                )}
                {itinerary && !itinLoading && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{itinerary.overview}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {itinerary.highlights.map((h, i) => <span key={i} className="text-xs px-2.5 py-1 bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-full font-medium">{h}</span>)}
                      </div>
                    </div>

                    {currentStop && (() => {
                      const si = itinerary.stops.find(s => s.stopName.toLowerCase().includes(currentStop.name.toLowerCase()) || currentStop.name.toLowerCase().includes(s.stopName.toLowerCase())) ?? itinerary.stops[0]
                      if (!si) return null
                      return (
                        <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 p-4 space-y-4 divide-y divide-gray-100 dark:divide-gray-600 [&>*+*]:pt-4">
                          <p className="text-base font-bold text-gray-800 dark:text-white">{SYS_ICON[currentStop.system]} {currentStop.name}</p>

                          {si.introduction && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{si.introduction}</p>
                          )}

                          {si.landmarks?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-2">📍 Worth Visiting</p>
                              <div className="space-y-2">
                                {si.landmarks.slice(0, 4).map((l, i) => (
                                  <div key={i} className="bg-purple-50/60 dark:bg-purple-900/10 rounded-lg px-2.5 py-2">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{l.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{l.story}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {si.gettingAround && (
                            <div>
                              <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">🚇 Getting Around</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{si.gettingAround}</p>
                            </div>
                          )}

                          {si.whatToWear && (
                            <div>
                              <p className="text-xs font-bold text-teal-500 uppercase tracking-wide mb-1">👕 What to Wear</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{si.whatToWear}</p>
                            </div>
                          )}

                          {si.hikingRoutes?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">🥾 Hiking Routes</p>
                              <div className="space-y-2">
                                {si.hikingRoutes.map((h, i) => (
                                  <div key={i} className="bg-green-50/60 dark:bg-green-900/10 rounded-lg px-2.5 py-2">
                                    <p className="text-sm"><span className="font-semibold text-gray-800 dark:text-white">{h.name}</span> <span className="text-xs font-bold text-green-600 dark:text-green-400">({h.difficulty})</span></p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{h.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {si.localSpecialties?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1.5">🍴 Try Locally</p>
                              <div className="flex flex-wrap gap-1.5">
                                {si.localSpecialties.map((s, i) => (
                                  <span key={i} className="text-xs font-medium px-2.5 py-1 bg-orange-100 dark:bg-orange-800/30 text-orange-700 dark:text-orange-300 rounded-full">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-2">📅 Day-by-Day</p>
                            <div className="grid grid-cols-2 gap-4">
                              {si.days.map((items, dayIdx)=>(
                                <div key={dayIdx}>
                                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Day {dayIdx + 1}</p>
                                  <div className="space-y-2 border-l-2 border-purple-200 dark:border-purple-700 pl-2.5">
                                    {items.slice(0,4).map((item,i)=>(
                                      <div key={i}>
                                        <span className="text-xs font-bold text-purple-400">{item.time}</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{item.activity}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {si.localTips.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1.5">💡 Local Tips</p>
                              <div className="space-y-1">
                                {si.localTips.slice(0,3).map((t,i)=><p key={i} className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">💬 {t}</p>)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">☀️ Best Time</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{itinerary.bestTimeToGo}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">🎒 Pack</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{itinerary.packingList.slice(0,4).join(' · ')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {currentStop && (
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 pt-2 pb-3">
                {chatMessages.length > 0 && (
                  <div className="max-h-56 overflow-y-auto space-y-2 mb-2 pr-1">
                    {chatMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`text-sm rounded-xl px-3 py-2 max-w-[85%] leading-relaxed ${
                          m.role === 'user'
                            ? 'ml-auto bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >{m.text}</div>
                    ))}
                    {chatLoading && <div className="text-sm text-gray-400 italic">Thinking…</div>}
                  </div>
                )}
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={`💬 Ask about ${currentStop.name}...`}
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    aria-label="Send"
                    className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition-colors"
                  >➤</button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {cityLightboxIndex !== null && cityPhotos[cityLightboxIndex] && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 cursor-pointer"
          onClick={e => {
            const goLeft = e.clientX < window.innerWidth / 2
            const len = cityPhotos.length
            setCityLightboxIndex(i => i === null ? i : goLeft ? (i - 1 + len) % len : (i + 1) % len)
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setCityLightboxIndex(null) }}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg hover:bg-white/10 transition-colors"
          >✕</button>
          {cityPhotos.length > 1 && (
            <>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-3xl pointer-events-none select-none">‹</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 text-3xl pointer-events-none select-none">›</span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs pointer-events-none select-none">{cityLightboxIndex + 1} / {cityPhotos.length}</span>
            </>
          )}
          <img src={cityPhotos[cityLightboxIndex].full} alt="" className="max-w-full max-h-full rounded-lg object-contain pointer-events-none" />
        </div>
      )}

      <SavedPlacesModal
        show={showSavedPlaces} onClose={() => setShowSavedPlaces(false)}
        savedLists={savedLists} onRemovePlace={handleRemoveSavedPlace} onRemoveFolder={handleRemoveSavedFolder}
      />

      {saveConfirmation && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl">
          ✓ {saveConfirmation}
        </div>
      )}

      {showWeatherInfo && (() => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() + 5)
        const cutoffText = cutoff.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowWeatherInfo(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowWeatherInfo(false)}
                aria-label="Close"
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >✕</button>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌤️</span>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">About this weather data</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                Real weather forecasts are only available for the next <span className="font-semibold text-gray-800 dark:text-white">5 days</span> (through <span className="font-semibold text-gray-800 dark:text-white">{cutoffText}</span>) — that's the limit of the free forecast data this app uses.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                For any trip date beyond that, there's no real forecast yet, so we show <span className="font-semibold text-gray-800 dark:text-white">last year's actual recorded weather</span> for that same calendar date instead — clearly labeled with the year it came from. It's not a prediction, but it's a realistic reference for what the weather is typically like around that date, so you're not left with no information at all.
              </p>
              <button
                onClick={() => setShowWeatherInfo(false)}
                className="btn-primary text-sm px-4 py-2 mt-5 w-full"
              >Got it</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TripEditBar({ currentStop, startDate, endDate, onSearch, onCancel }: {
  currentStop: TripStop | null
  startDate: string
  endDate: string
  onSearch: (stop: TripStop, startDate: string, endDate: string) => void
  onCancel: () => void
}) {
  const [query, setQuery]             = useState(currentStop?.displayName ?? '')
  const [pendingStop, setPendingStop] = useState<TripStop | null>(null)
  const [sd, setSd]                   = useState(startDate)
  const [ed, setEd]                   = useState(endDate)
  const [suggestions, setSuggestions]         = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const edRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (q.length < 3 || q === currentStop?.displayName) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`)
        const d = r.ok ? await r.json() : []
        setSuggestions((d as { lat: string; lon: string; display_name: string }[]).map(item => ({
          lat: parseFloat(item.lat), lng: parseFloat(item.lon), displayName: item.display_name,
        })))
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, currentStop?.displayName])

  const pickSuggestion = (s: LocationSuggestion) => {
    const shortName = s.displayName.split(',')[0]?.trim() || s.displayName
    setPendingStop({
      id: `custom-${Date.now()}`, name: shortName,
      displayName: s.displayName.split(',').slice(0, 2).join(',').trim() || s.displayName,
      lat: s.lat, lng: s.lng,
      photo: `https://picsum.photos/seed/${encodeURIComponent(s.displayName)}/400/250`,
      system: 'Custom', lines: [], dotColor: '#7c3aed',
    })
    setQuery(s.displayName)
    setSuggestions([]); setShowSuggestions(false)
  }

  const finalStop = pendingStop ?? currentStop
  const today = todayLocal()

  const handleSd = (v: string) => {
    if (v && v < today) return
    setSd(v)
    if (v && ed && ed < v) setEd(v)
    // Same fix as the initial planning page: the native "from" picker closes
    // itself on selection, so reopen "to" immediately to keep the flow going.
    if (v) {
      requestAnimationFrame(() => {
        const el = edRef.current
        if (!el) return
        el.focus()
        if ('showPicker' in el) { try { (el as unknown as { showPicker: () => void }).showPicker() } catch { /* not supported in this browser */ } }
      })
    }
  }
  const handleEd = (v: string) => {
    if (v && v < (sd || today)) return
    setEd(v)
  }

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-3 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[160px]">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setPendingStop(null) }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search a new location…"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pickSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                  📍 {s.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input type="date" value={sd} min={today} onChange={e => handleSd(e.target.value)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-sm text-gray-800 dark:text-white" />
      <span className="text-gray-400 text-sm">→</span>
      <input ref={edRef} type="date" value={ed} min={sd || today} onChange={e => handleEd(e.target.value)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-sm text-gray-800 dark:text-white" />
      <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2">Cancel</button>
      <button
        onClick={() => finalStop && onSearch(finalStop, sd, ed)}
        disabled={!finalStop}
        className="btn-primary text-base px-8 py-2 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
      >Search</button>
    </div>
  )
}

function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-xs text-gray-400">{msg}</p>
    </div>
  )
}

function SavedPlacesModal({ show, onClose, savedLists, onRemovePlace, onRemoveFolder }: {
  show: boolean
  onClose: () => void
  savedLists: Record<string, SavedPlaceList>
  onRemovePlace: (locationName: string, placeId: string) => void
  onRemoveFolder: (locationName: string) => void
}) {
  if (!show) return null
  const folders = Object.values(savedLists).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >✕</button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📁 Saved Places</h2>
        {folders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nothing saved yet — select places from a category list on a trip and hit Save.</p>
        ) : (
          <div className="space-y-4">
            {folders.map(folder => (
              <div key={folder.locationName} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {folder.locationName} <span className="text-gray-400 font-normal">({folder.places.length})</span>
                  </p>
                  <button onClick={() => onRemoveFolder(folder.locationName)} className="text-xs text-red-400 hover:text-red-600 font-semibold">Remove all</button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {folder.places.map(p => {
                    const mapsUrl = p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName.text)}`
                    return (
                      <div
                        key={p.id}
                        onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
                        title="Open in Google Maps"
                        className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{p.displayName.text}</p>
                          {p.formattedAddress && <p className="text-xs text-gray-400 truncate">{p.formattedAddress}</p>}
                          <p className="text-xs font-semibold text-blue-500 mt-0.5">🗺️ Open in Google Maps →</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={e => { e.stopPropagation(); onRemovePlace(folder.locationName, p.id) }}
                            aria-label={`Remove ${p.displayName.text}`}
                            className="text-gray-300 hover:text-red-500 text-sm"
                          >✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlaceCard({ place, visitDuration, googleKey, onSelect, selectable, selected, onToggleSelect, onHoverChange }: { place: GooglePlace; visitDuration?: string; googleKey: string; onSelect?: (p: GooglePlace) => void; selectable?: boolean; selected?: boolean; onToggleSelect?: (id: string) => void; onHoverChange?: (id: string | null) => void }) {
  const photo  = place.photos?.[0]?.name ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=300&key=${googleKey}` : null
  const isOpen = place.regularOpeningHours?.openNow
  return (
    <div
      className={`relative rounded-xl border overflow-hidden bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-all ${selected ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-100 dark:border-gray-700 hover:border-blue-300'}`}
      onClick={() => onSelect?.(place)}
      onMouseEnter={() => onHoverChange?.(place.id)}
      onMouseLeave={() => onHoverChange?.(null)}
    >
      {selectable && (
        <button
          onClick={e => { e.stopPropagation(); onToggleSelect?.(place.id) }}
          className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center text-sm font-bold transition-colors ${
            selected ? 'bg-green-500 border-green-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-500 text-transparent'
          }`}
        >✓</button>
      )}
      {photo && <img src={photo} alt={place.displayName.text} className="w-full h-24 object-cover" onError={e => (e.currentTarget.style.display='none')} />}
      <div className="p-2.5">
        <div className="flex justify-between items-start gap-1 mb-1">
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{place.displayName.text}</p>
          {place.priceLevel && <span className="text-sm text-gray-400 flex-shrink-0">{PRICE_LABELS[place.priceLevel] ?? ''}</span>}
        </div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {place.rating && <span className="text-sm font-bold text-amber-500">⭐ {place.rating.toFixed(1)}</span>}
          {place.userRatingCount && <span className="text-sm text-gray-400">({place.userRatingCount.toLocaleString()})</span>}
          {isOpen !== undefined && <span className={`text-sm font-bold ${isOpen ? 'text-green-500' : 'text-red-400'}`}>{isOpen ? '● Open' : '● Closed'}</span>}
        </div>
        {place.formattedAddress && <p className="text-sm text-gray-400 leading-relaxed">{place.formattedAddress}</p>}
        {visitDuration && <p className="text-sm text-blue-400 mt-0.5">⏱ {visitDuration}</p>}
        <p className="text-sm text-blue-400 mt-1.5 font-semibold">Tap for details & reviews →</p>
      </div>
    </div>
  )
}

function PlaceDetail({ place, visitDuration, googleKey, onBack }: { place: GooglePlace; visitDuration?: string; googleKey: string; onBack: () => void }) {
  const googlePhotos: PlacePhoto[] = place.photos?.slice(0, 6).map(p => ({
    thumb: `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=400&key=${googleKey}`,
    full:  `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=1600&key=${googleKey}`,
  })) ?? []
  const [wikiPhotos, setWikiPhotos] = useState<PlacePhoto[]>([])
  const [lightbox, setLightbox]     = useState<string | null>(null)
  const mapsUrl = place.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName.text)}`
  const isOpen  = place.regularOpeningHours?.openNow
  const reviews = place.reviews ?? []
  const stars   = (n: number) => '⭐'.repeat(Math.round(n))

  useEffect(() => {
    setWikiPhotos([])
    const cityName = place.formattedAddress?.split(',').map(s => s.trim())[1] ?? ''
    fetchWikimediaPlacePhotos(place.displayName.text, cityName).then(setWikiPhotos)
  }, [place.id])

  const album = [...googlePhotos, ...wikiPhotos]

  return (
    <div className="space-y-3">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors">
        ← Back to list
      </button>

      {/* Photo album */}
      {album.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {album.map((p, i) => (
            <img
              key={i} src={p.thumb} alt="" loading="lazy"
              onClick={() => setLightbox(p.full)}
              className="h-28 w-36 flex-shrink-0 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onError={e => (e.currentTarget.style.display='none')}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg hover:bg-white/10 transition-colors"
          >✕</button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Name + price */}
      <div>
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{place.displayName.text}</h3>
          {place.priceLevel && <span className="text-xs text-gray-400 flex-shrink-0 font-semibold">{PRICE_LABELS[place.priceLevel]}</span>}
        </div>
        {visitDuration && <p className="text-sm text-blue-400 mt-0.5">⏱ {visitDuration}</p>}
      </div>

      {/* Rating bar */}
      {place.rating && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
          <span className="text-xl font-bold text-amber-500">{place.rating.toFixed(1)}</span>
          <div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(place.rating!) ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
            </div>
            {place.userRatingCount && <p className="text-xs text-gray-400">{place.userRatingCount.toLocaleString()} reviews</p>}
          </div>
        </div>
      )}

      {/* Status + address */}
      <div className="space-y-1">
        {isOpen !== undefined && (
          <p className={`text-xs font-bold ${isOpen ? 'text-green-500' : 'text-red-400'}`}>{isOpen ? '● Open now' : '● Closed'}</p>
        )}
        {place.formattedAddress && (
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">📍 {place.formattedAddress}</p>
        )}
      </div>

      {/* Hours */}
      {place.regularOpeningHours?.weekdayDescriptions && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Hours</p>
          {place.regularOpeningHours.weekdayDescriptions.map((d, i) => (
            <p key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{d}</p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center text-xs py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
          📌 Open in Maps
        </a>
        {place.websiteUri && (
          <a href={place.websiteUri} target="_blank" rel="noopener noreferrer"
            className="flex-1 text-center text-xs py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            🌐 Website
          </a>
        )}
      </div>

      {/* Reviews */}
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {reviews.length > 0 ? `Reviews (${reviews.length})` : 'No reviews available'}
        </p>
        {reviews.length === 0 ? (
          <a href={`${mapsUrl}#reviews`} target="_blank" rel="noopener noreferrer"
            className="block text-center text-sm text-blue-500 font-semibold py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            See reviews on Google Maps →
          </a>
        ) : (
          <div className="space-y-2">
            {reviews.map((r, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div className="mb-1.5">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{r.authorAttribution.displayName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{stars(r.rating)}</span>
                    {r.relativePublishTimeDescription && <span className="text-xs text-gray-400">{r.relativePublishTimeDescription}</span>}
                  </div>
                </div>
                {r.text?.text && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.text.text}</p>}
              </div>
            ))}
            <a href={`${mapsUrl}#reviews`} target="_blank" rel="noopener noreferrer"
              className="block text-center text-sm text-blue-500 font-semibold py-1">
              See all reviews on Google Maps →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

const EVENT_SOURCE_BADGE: Record<UnifiedEvent['source'], string> = {
  Ticketmaster: '🎟 Ticketmaster',
  Eventbrite:   '🟠 Eventbrite',
  PredictHQ:    '📊 PredictHQ',
}

function EventCard({ event, onSelect }: { event: UnifiedEvent; onSelect?: (e: UnifiedEvent) => void }) {
  return (
    <div
      className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
      onClick={() => onSelect?.(event)}
    >
      {event.image && <img src={event.image} alt={event.name} className="w-full h-24 object-cover" />}
      <div className="p-2.5">
        <p className="text-sm font-bold text-gray-800 dark:text-white mb-1 leading-tight">{event.name}</p>
        <p className="text-xs text-gray-400 font-semibold mb-0.5">{EVENT_SOURCE_BADGE[event.source]}</p>
        <p className="text-sm text-gray-400">📅 {event.date}{event.time ? ` · ${event.time}` : ''}</p>
        {event.venueName && <p className="text-sm text-gray-400">📍 {event.venueName}</p>}
        {event.priceMin !== undefined && <p className="text-sm text-green-500 font-semibold">${event.priceMin}–${event.priceMax}</p>}
        <p className="text-sm text-blue-400 mt-1.5 font-semibold">Tap for details →</p>
      </div>
    </div>
  )
}

function EventDetail({ event, googleKey, onBack }: { event: UnifiedEvent; googleKey: string; onBack: () => void }) {
  const [venuePlace, setVenuePlace] = useState<GooglePlace | null>(null)
  const [venueLoading, setVenueLoading] = useState(false)
  const [venueChecked, setVenueChecked] = useState(false)

  useEffect(() => {
    setVenuePlace(null); setVenueChecked(false)
    if (!event.venueName || !googleKey || googleKey === 'your_google_places_api_key') return
    let alive = true
    setVenueLoading(true)
    fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'X-Goog-Api-Key': googleKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri',
      },
      body: JSON.stringify({
        textQuery: event.venueName,
        ...(event.lat && event.lng ? { locationBias: { circle: { center: { latitude: event.lat, longitude: event.lng }, radius: 3000.0 } } } : {}),
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) setVenuePlace(d?.places?.[0] ?? null) })
      .catch(() => { if (alive) setVenuePlace(null) })
      .finally(() => { if (alive) { setVenueLoading(false); setVenueChecked(true) } })
    return () => { alive = false }
  }, [event.venueName, event.lat, event.lng, googleKey])

  const stars = (n: number) => '⭐'.repeat(Math.round(n))
  const reviews = venuePlace?.reviews ?? []

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors">
        ← Back to list
      </button>

      {event.image && <img src={event.image} alt={event.name} className="w-full h-32 rounded-xl object-cover" />}

      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{event.name}</h3>
        <p className="text-sm text-gray-400 font-semibold mt-0.5">{EVENT_SOURCE_BADGE[event.source]}</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1.5">
        <p className="text-xs text-gray-700 dark:text-gray-300">📅 {event.date}{event.time ? ` · ${event.time}` : ''}</p>
        {event.venueName && (
          <p className="text-xs text-gray-700 dark:text-gray-300">
            📍 {event.venueName}{event.venueAddress ? ` — ${event.venueAddress}` : ''}
          </p>
        )}
        {event.priceMin !== undefined && (
          <p className="text-xs text-green-500 font-semibold">
            💲 {event.priceMin === event.priceMax ? `${event.priceMin}` : `${event.priceMin}–${event.priceMax}`} {event.currency ?? ''}
          </p>
        )}
      </div>

      {event.url ? (
        <a href={event.url} target="_blank" rel="noopener noreferrer"
          className="block text-center text-xs py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors">
          🎟 Get Tickets
        </a>
      ) : (
        <p className="text-sm text-gray-400 text-center">No ticket link available from {event.source}</p>
      )}


      {/* Reviews — proxied via the venue's Google Places listing, since none of our event sources provide event-level reviews */}
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Venue Reviews {venuePlace?.userRatingCount ? `(${venuePlace.userRatingCount.toLocaleString()})` : ''}
        </p>
        {venueLoading ? (
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
        ) : !event.venueName ? (
          <p className="text-sm text-gray-400">No venue information available for this event.</p>
        ) : venuePlace ? (
          <div className="space-y-2">
            {venuePlace.rating && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">
                <span className="text-lg font-bold text-amber-500">{venuePlace.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{stars(venuePlace.rating)} at {venuePlace.displayName.text}</span>
              </div>
            )}
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{r.authorAttribution.displayName}</span>
                    <span className="text-sm">{stars(r.rating)}</span>
                  </div>
                  {r.text?.text && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.text.text}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No written reviews available for this venue.</p>
            )}
            {venuePlace.googleMapsUri && (
              <a href={venuePlace.googleMapsUri} target="_blank" rel="noopener noreferrer"
                className="block text-center text-sm text-blue-500 font-semibold py-1">
                See all reviews on Google Maps →
              </a>
            )}
          </div>
        ) : venueChecked ? (
          <p className="text-sm text-gray-400">No review data found for this venue.</p>
        ) : (
          <p className="text-sm text-gray-400">Add VITE_GOOGLE_PLACES_KEY to .env to show venue reviews.</p>
        )}
      </div>
    </div>
  )
}
