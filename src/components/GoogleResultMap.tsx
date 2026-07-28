/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react'

export interface MapMarker {
  id?: string
  lat: number; lng: number; name: string
  category: string; icon: string; color: string
  rating?: number; address?: string; mapsUrl?: string
}

export const CATEGORY_COLORS: Record<string, string> = {
  'fine-dining':  '#ef4444',
  'local-food':   '#f97316',
  'arts-culture': '#8b5cf6',
  shopping:       '#ec4899',
  markets:        '#84cc16',
  events:         '#06b6d4',
  nightlife:      '#1d4ed8',
  scenic:         '#22c55e',
  'hidden-gems':  '#f59e0b',
}

// Singleton promise so the <script> is only injected once
let _loadPromise: Promise<void> | null = null
function loadGoogleMaps(key: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve()
  if (_loadPromise) return _loadPromise
  _loadPromise = new Promise(resolve => {
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
    s.async = true; s.defer = true
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
  return _loadPromise
}

function markerSvg(icon: string, color: string, dim: boolean) {
  const opacity = dim ? '0.25' : '1'
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38">
      <circle cx="19" cy="19" r="17" fill="${color}" stroke="white" stroke-width="2.5" opacity="${opacity}"/>
      <text x="19" y="24" text-anchor="middle" font-size="15">${icon}</text>
    </svg>`
  )}`
}

function stationSvg(icon: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
      <circle cx="22" cy="22" r="20" fill="#7c3aed" stroke="white" stroke-width="3"/>
      <text x="22" y="28" text-anchor="middle" font-size="18">${icon}</text>
    </svg>`
  )}`
}

interface Props {
  center: { lat: number; lng: number }
  centerIcon: string
  centerLabel: string
  markers: MapMarker[]
  activeCategory: string | null
  googleKey: string
}

export default function GoogleResultMap({ center, centerIcon, centerLabel, markers, activeCategory, googleKey }: Props) {
  const divRef    = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<any>(null)
  const gmMarkers = useRef<{ gm: any; m: MapMarker }[]>([])
  const stationGM = useRef<any>(null)
  const infoRef   = useRef<any>(null)
  const initialized = useRef(false)

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!googleKey || googleKey === 'your_google_places_api_key' || !divRef.current) return
    loadGoogleMaps(googleKey).then(() => {
      if (initialized.current || !divRef.current) return
      initialized.current = true
      const g = (window as any).google
      const map = new g.maps.Map(divRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit.station', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
        ],
      })
      mapRef.current = map
      infoRef.current = new g.maps.InfoWindow()
    })
  }, [googleKey])

  // ── Pan to new center ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.panTo({ lat: center.lat, lng: center.lng })
    mapRef.current.setZoom(14)

    // Update station marker
    const g = (window as any).google
    if (!g?.maps) return
    stationGM.current?.setMap(null)
    stationGM.current = new g.maps.Marker({
      position: { lat: center.lat, lng: center.lng },
      map: mapRef.current,
      title: centerLabel,
      zIndex: 999,
      icon: {
        url: stationSvg(centerIcon),
        scaledSize: new g.maps.Size(44, 44),
        anchor: new g.maps.Point(22, 22),
      },
    })
    stationGM.current.addListener('click', () => {
      infoRef.current?.setContent(`<div style="font-family:system-ui;padding:4px"><b style="font-size:13px">${centerLabel}</b></div>`)
      infoRef.current?.open(mapRef.current, stationGM.current)
    })
  }, [center.lat, center.lng, centerLabel, centerIcon])

  // ── Rebuild place markers when markers or filter changes ──────────────────
  useEffect(() => {
    const g = (window as any).google
    if (!g?.maps || !mapRef.current) return

    // Remove old markers
    gmMarkers.current.forEach(({ gm }) => gm.setMap(null))
    gmMarkers.current = []

    markers.forEach(m => {
      const dim = !!activeCategory && activeCategory !== m.category
      const gm = new g.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapRef.current,
        title: m.name,
        zIndex: dim ? 1 : 10,
        icon: {
          url: markerSvg(m.icon, m.color, dim),
          scaledSize: new g.maps.Size(38, 38),
          anchor: new g.maps.Point(19, 19),
        },
      })
      gm.addListener('click', () => {
        infoRef.current?.setContent(`
          <div style="font-family:system-ui;max-width:220px;padding:4px">
            <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#1e293b">${m.name}</p>
            ${m.rating ? `<p style="color:#f59e0b;font-size:11px;margin:0 0 3px">⭐ ${m.rating.toFixed(1)}</p>` : ''}
            ${m.address ? `<p style="color:#94a3b8;font-size:11px;margin:0 0 6px;line-height:1.4">${m.address}</p>` : ''}
            ${m.mapsUrl ? `<a href="${m.mapsUrl}" target="_blank" style="color:#3b82f6;font-size:12px;font-weight:600;text-decoration:none">📌 Open in Google Maps →</a>` : ''}
          </div>
        `)
        infoRef.current?.open(mapRef.current, gm)
      })
      gmMarkers.current.push({ gm, m })
    })
  }, [markers, activeCategory])

  if (!googleKey || googleKey === 'your_google_places_api_key') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 gap-3">
        <p className="text-3xl">🗺</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
          Add <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">VITE_GOOGLE_PLACES_KEY</code> to your .env and enable the <strong>Maps JavaScript API</strong> in Google Cloud Console
        </p>
      </div>
    )
  }

  return <div ref={divRef} style={{ height: '100%', width: '100%' }} />
}
