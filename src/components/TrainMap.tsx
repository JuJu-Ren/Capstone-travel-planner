import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { cities, trainLines } from '../data/trainData'
import { allMTAStops, mtaLines, SYSTEM_COLORS } from '../data/mtaData'
import { cityToTripStop, mtaStopToTripStop } from '../data/types'
import type { TripStop } from '../data/types'

const NY_CENTER: [number, number] = [40.80, -73.90]
const NY_ZOOM = 9
const US_BOUNDS: L.LatLngBoundsExpression = [[24.0, -125.0], [49.5, -66.0]]

// ─── Wikimedia photo fetcher ──────────────────────────────────────────────────

const _photoCache: Record<string, string[]> = {}
const _inFlight: Record<string, Promise<string[]>> = {}

async function fetchWikimediaPhotos(name: string, system: string): Promise<string[]> {
  const key = `${system}:${name}`
  if (_photoCache[key] !== undefined) return _photoCache[key]
  // Return the same promise for concurrent callers — avoids race where the second
  // caller reads an empty pre-set cache entry before the first fetch completes.
  if (_inFlight[key]) return _inFlight[key]

  _inFlight[key] = (async () => {
    const results: string[] = []

    // 1. Wikipedia representative thumbnail
    try {
      const r = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}` +
        `&prop=pageimages&format=json&pithumbsize=640&origin=*`
      )
      const d = await r.json()
      const pg = Object.values(d.query?.pages ?? {})[0] as { thumbnail?: { source: string } } | undefined
      if (pg?.thumbnail?.source) results.push(pg.thumbnail.source)
    } catch { /* ignore */ }

    // 2. Wikimedia Commons image search for more photos
    try {
      const q = system === 'Amtrak' ? name : `${name} train station`
      const r = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6` +
        `&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url&iiurlwidth=640` +
        `&format=json&origin=*&gsrlimit=10`
      )
      const d = await r.json()
      const pages = Object.values(d.query?.pages ?? {}) as { imageinfo?: { url: string }[] }[]
      const urls = pages
        .map(p => p.imageinfo?.[0]?.url)
        .filter((u): u is string => !!u && /\.(jpe?g|png|webp)/i.test(u))
      results.push(...urls)
    } catch { /* ignore */ }

    const unique = [...new Set(results)].slice(0, 12)
    _photoCache[key] = unique
    delete _inFlight[key]
    return unique
  })()

  return _inFlight[key]
}

// ─── Tooltip card with photo carousel ────────────────────────────────────────

interface CardProps {
  name: string; system: string; lines: string[]
  color: string; selected: boolean; selIdx: number; blocked: boolean
  keepOpen: () => void; startClose: () => void
}

function TooltipCard({ name, system, lines, color, selected, selIdx, blocked, keepOpen, startClose }: CardProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setIdx(0)
    fetchWikimediaPhotos(name, system).then(p => {
      if (alive) { setPhotos(p); setLoading(false) }
    })
    return () => { alive = false }
  }, [name, system])

  const ICON: Record<string, string> = { Amtrak: '🚂', LIRR: '🚋', MetroNorth: '🚉', PATH: '🚇' }
  const sysLabel = system === 'MetroNorth' ? 'Metro-North' : system

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)) }
  const nxt  = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => Math.min(photos.length - 1, i + 1)) }

  const btnBase: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 4,
    color: 'white', padding: '4px 9px', fontSize: 17, lineHeight: 1,
    cursor: 'pointer', transition: 'opacity .15s',
  }

  return (
    <div
      onMouseEnter={keepOpen}
      onMouseLeave={startClose}
      style={{
        width: 240,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        userSelect: 'none',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,.18)',
      }}
    >
      {/* ── Photo zone ── */}
      <div style={{ position: 'relative', height: 130, background: '#e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
            Loading photos…
          </div>
        ) : photos.length === 0 ? (
          <>
            <img
              src={`https://picsum.photos/seed/${encodeURIComponent(name)}/480/260`}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.75)' }}
            />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, textAlign: 'center', padding: '0 18px', textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
              {name}
            </div>
          </>
        ) : (
          <>
            <img
              src={photos[idx]}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {photos.length > 1 && (
              <>
                <button onClick={prev} disabled={idx === 0}
                  style={{ ...btnBase, left: 5, opacity: idx === 0 ? 0.25 : 0.85 }}>‹</button>
                <button onClick={nxt} disabled={idx === photos.length - 1}
                  style={{ ...btnBase, right: 5, opacity: idx === photos.length - 1 ? 0.25 : 0.85 }}>›</button>
                <div style={{
                  position: 'absolute', bottom: 6, right: 8,
                  background: 'rgba(0,0,0,.55)', borderRadius: 8,
                  padding: '1px 7px', fontSize: 10, color: 'white', fontWeight: 600,
                }}>
                  {idx + 1} / {photos.length}
                </div>
              </>
            )}
            <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 9, color: 'rgba(255,255,255,.7)' }}>
              📷 Wikimedia Commons
            </div>
          </>
        )}
      </div>

      {/* ── Info zone ── */}
      <div style={{ padding: '9px 11px 11px', background: 'white' }}>
        <p style={{ fontWeight: 800, fontSize: 13.5, margin: '0 0 3px', color: '#0f172a', letterSpacing: '0.01em' }}>{name}</p>
        <p style={{ fontSize: 11, margin: '0 0 2px', fontWeight: 700, color }}>
          {ICON[system] ?? '🚂'} {sysLabel}
        </p>
        {lines.length > 0 && (
          <p style={{ fontSize: 10, margin: '0 0 6px', color: '#94a3b8' }}>{lines.slice(0, 2).join(' · ')}</p>
        )}
        <p style={{
          fontSize: 11, margin: 0, fontWeight: 700,
          color: selected ? '#d97706' : blocked ? '#ef4444' : '#3b82f6',
        }}>
          {selected ? `✓ Stop ${selIdx + 1} selected · click to remove`
            : blocked ? 'Max 3 stops reached'
            : 'Click marker to add to trip'}
        </p>
      </div>
    </div>
  )
}

// ─── Marker icon builders ─────────────────────────────────────────────────────

function makeStationPill(name: string, color: string, selected: boolean, selIdx: number): L.DivIcon {
  const bg    = selected ? '#fffbeb' : '#ffffff'
  const bdr   = selected ? '#f59e0b' : color
  const txt   = selected ? '#78350f' : '#0f172a'
  const dot   = selected ? '#f59e0b' : color
  const label = name.length > 20 ? name.slice(0, 20) + '…' : name
  const w     = Math.min(label.length * 7.8 + 34, 190)

  return L.divIcon({
    className: '',
    html: `<div style="
      display:flex;align-items:center;gap:5px;
      background:${bg};border:2px solid ${bdr};border-radius:20px;
      padding:4px 11px 4px 7px;
      box-shadow:0 2px 10px rgba(0,0,0,.32),0 0 0 1px rgba(0,0,0,.06);
      cursor:pointer;white-space:nowrap;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
    ">
      <span style="
        width:11px;height:11px;border-radius:50%;
        background:${dot};border:1.5px solid rgba(0,0,0,.14);
        display:inline-flex;align-items:center;justify-content:center;
        font-size:8px;font-weight:900;color:white;flex-shrink:0;
      ">${selected ? selIdx : ''}</span>
      <span style="
        font-size:12px;font-weight:700;color:${txt};
        letter-spacing:0.015em;
      ">${label}</span>
    </div>`,
    iconSize: [w, 26],
    iconAnchor: [w / 2, 13],
  })
}

function makeHubPill(name: string, color: string, selected: boolean, selIdx: number): L.DivIcon {
  const bg  = selected ? '#fffbeb' : '#ffffff'
  const bdr = selected ? '#f59e0b' : color
  const txt = selected ? '#78350f' : '#1e293b'
  const dot = selected ? '#f59e0b' : color
  const label = name.length > 17 ? name.slice(0, 17) + '…' : name
  const w   = Math.min(label.length * 7 + 26, 155)

  return L.divIcon({
    className: '',
    html: `<div style="
      display:flex;align-items:center;gap:4px;
      background:${bg};border:1.5px solid ${bdr};border-radius:12px;
      padding:2px 7px 2px 5px;
      box-shadow:0 1px 6px rgba(0,0,0,.26),0 0 0 1px rgba(0,0,0,.05);
      cursor:pointer;white-space:nowrap;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
    ">
      <span style="
        width:8px;height:8px;border-radius:50%;
        background:${dot};flex-shrink:0;
      "></span>
      <span style="
        font-size:10.5px;font-weight:700;color:${txt};
      ">${selected ? selIdx + '·' : ''}${label}</span>
    </div>`,
    iconSize: [w, 20],
    iconAnchor: [w / 2, 10],
  })
}

function makeDot(color: string, size: number, selected: boolean): L.DivIcon {
  const bdr = selected ? '#b45309' : 'rgba(255,255,255,0.9)'
  const bg  = selected ? '#f59e0b' : color
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:2px solid ${bdr};
      box-shadow:0 1px 5px rgba(0,0,0,.4);cursor:pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

function LocationZoom({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 10, { duration: 1.5 })
  }, [location, map])
  return null
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap()
  useMapEvents({ zoomend: () => onZoom(map.getZoom()) })
  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  selectedStops: TripStop[]
  onSelectStop: (stop: TripStop) => void
  userLocation: { lat: number; lng: number } | null
}

export default function TrainMap({ selectedStops, onSelectStop, userLocation }: Props) {
  const [zoom, setZoom] = useState(NY_ZOOM)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSelected = (id: string) => selectedStops.some(s => s.id === id)
  const selIndex   = (id: string) => selectedStops.findIndex(s => s.id === id)
  const atMax      = selectedStops.length >= 3

  const showHubStops = zoom >= 10
  const showAllStops = zoom >= 11

  const keepOpen = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
  }
  const startClose = () => {
    leaveTimer.current = setTimeout(() => setHoveredId(null), 2000)
  }
  const handleOver = (id: string) => { keepOpen(); setHoveredId(id) }
  const handleOut  = () => startClose()

  return (
    <MapContainer
      center={NY_CENTER}
      zoom={NY_ZOOM}
      maxBounds={US_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={5}
      maxZoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
      />
      <LocationZoom location={userLocation} />
      <ZoomTracker onZoom={setZoom} />

      {/* Amtrak lines */}
      {trainLines.map(line => (
        <Polyline key={line.id} positions={line.stops} color={line.color}
          weight={zoom >= 9 ? 1.5 : 2.5} opacity={zoom >= 9 ? 0.35 : 0.7} />
      ))}

      {/* MTA lines */}
      {mtaLines.map(line => (
        <Polyline key={line.id} positions={line.coords} color={line.color}
          weight={zoom >= 11 ? 3 : 2} opacity={0.85} />
      ))}

      {/* MTA stops */}
      {allMTAStops.map(stop => {
        if (!showHubStops) return null
        if (!showAllStops && !stop.isHub) return null

        const sel     = isSelected(stop.id)
        const idx     = selIndex(stop.id)
        const blocked = !sel && atMax
        const color   = SYSTEM_COLORS[stop.system]

        const icon = showAllStops && stop.isHub
          ? makeHubPill(stop.name, color, sel, idx + 1)
          : makeDot(color, sel ? 12 : stop.isHub ? 9 : 7, sel)

        return (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={icon}
            eventHandlers={{
              mouseover: () => handleOver(stop.id),
              mouseout:  handleOut,
              click: () => { if (!blocked) onSelectStop(mtaStopToTripStop(stop)) },
            }}
          >
            <Tooltip interactive permanent={hoveredId === stop.id} direction="top" offset={[0, -8]} opacity={1}>
              {hoveredId === stop.id ? (
                <TooltipCard
                  name={stop.name} system={stop.system} lines={stop.lines}
                  color={color} selected={sel} selIdx={idx + 1} blocked={blocked}
                  keepOpen={keepOpen} startClose={startClose}
                />
              ) : <span />}
            </Tooltip>
          </Marker>
        )
      })}

      {/* Amtrak cities */}
      {cities.map(city => {
        const sel     = isSelected(city.id)
        const idx     = selIndex(city.id)
        const blocked = !sel && atMax
        const color   = sel ? '#f59e0b' : '#2563eb'

        return (
          <Marker
            key={city.id}
            position={[city.lat, city.lng]}
            icon={makeStationPill(city.name, color, sel, idx + 1)}
            eventHandlers={{
              mouseover: () => handleOver(city.id),
              mouseout:  handleOut,
              click: () => { if (!blocked) onSelectStop(cityToTripStop(city)) },
            }}
          >
            <Tooltip interactive permanent={hoveredId === city.id} direction="top" offset={[0, -13]} opacity={1}>
              {hoveredId === city.id ? (
                <TooltipCard
                  name={city.name} system="Amtrak" lines={city.lines}
                  color="#2563eb" selected={sel} selIdx={idx + 1} blocked={blocked}
                  keepOpen={keepOpen} startClose={startClose}
                />
              ) : <span />}
            </Tooltip>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
