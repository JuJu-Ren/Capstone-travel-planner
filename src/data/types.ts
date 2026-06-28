import type { POI, City } from './trainData'
import type { MTAStop } from './mtaData'
import { SYSTEM_COLORS } from './mtaData'

export interface TripStop {
  id: string
  name: string
  displayName: string        // "Boston, MA" | "Jamaica · LIRR"
  lat: number
  lng: number
  photo: string
  system: 'Amtrak' | 'LIRR' | 'MetroNorth' | 'PATH'
  lines: string[]
  dotColor: string
  // Rich data – Amtrak cities only
  state?: string
  tagline?: string
  description?: string
  history?: string
  highlights?: string[]
  pois?: POI[]
  isHub?: boolean
}

const MTA_PHOTOS: Record<string, string> = {
  LIRR:        'https://picsum.photos/seed/lirr-train/400/250',
  MetroNorth:  'https://picsum.photos/seed/metronorth-train/400/250',
  PATH:        'https://picsum.photos/seed/path-train/400/250',
}

export function cityToTripStop(city: City): TripStop {
  return {
    id:          city.id,
    name:        city.name,
    displayName: `${city.name}, ${city.state}`,
    lat:         city.lat,
    lng:         city.lng,
    photo:       city.photo,
    system:      'Amtrak',
    lines:       city.lines,
    dotColor:    '#3b82f6',
    state:       city.state,
    tagline:     city.tagline,
    description: city.description,
    history:     city.history,
    highlights:  city.highlights,
    pois:        city.pois,
  }
}

export function mtaStopToTripStop(stop: MTAStop): TripStop {
  const systemLabel = stop.system === 'MetroNorth' ? 'Metro-North' : stop.system
  return {
    id:          stop.id,
    name:        stop.name,
    displayName: `${stop.name} · ${systemLabel}`,
    lat:         stop.lat,
    lng:         stop.lng,
    photo:       MTA_PHOTOS[stop.system],
    system:      stop.system,
    lines:       stop.lines,
    dotColor:    SYSTEM_COLORS[stop.system],
    isHub:       stop.isHub,
  }
}
