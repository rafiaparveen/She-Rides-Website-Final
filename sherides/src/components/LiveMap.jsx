import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { KARACHI_CENTER, KARACHI_LOCATIONS, jitter, lerpLatLng } from '../lib/geo.js'

// Keep the original dark CARTO map as the default so the app works without any API key.
// If a real Mapbox token is later added in .env, the app can switch automatically.
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim()
const MAP_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const MAP_ATTRIBUTION = MAPBOX_TOKEN
  ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
  : '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors'

// Build a colored div-icon so we never depend on Leaflet's default marker
// image assets (which break under bundlers without extra config).
function pinIcon(color, size = 16) {
  return L.divIcon({
    className: '',
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${color};border:2px solid white;
        box-shadow:0 0 10px ${color};
      "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function avatarIcon(imageUrl, ring = '#EC4899', moving = false) {
  const size = 34
  return L.divIcon({
    className: '',
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:#0f172a url('${imageUrl}') center/cover no-repeat;
        border:2.5px solid ${ring};
        box-shadow:0 0 10px ${ring}${moving ? ', 0 0 0 6px rgba(236,72,153,0.15)' : ''};
        transition: box-shadow 0.6s ease;
      "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const PICKUP_ICON = pinIcon('#EC4899', 18)
const DROPOFF_ICON = pinIcon('#8B5CF6', 18)

// Recenters/fits the map whenever the relevant bounds change.
function ViewController({ bounds, focusPoint }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
    } else if (focusPoint) {
      map.flyTo([focusPoint.lat, focusPoint.lng], 13, { duration: 0.8 })
    }
  }, [JSON.stringify(bounds), JSON.stringify(focusPoint)]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

function ClickCapture({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// Exposes the underlying Leaflet map instance to the parent so the
// floating "Locate Me" / zoom buttons (rendered outside MapContainer) can
// drive real map behavior instead of being decorative.
function MapRefBridge({ mapRef }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])
  return null
}

/**
 * Live interactive map centered on Karachi.
 * - pickup / dropoff: {lat,lng,name} or null
 * - driverPos: {lat,lng} of the actively assigned captain (animates when trip is live)
 * - phase: booking phase, used to decide what to render
 * - onMapClick: optional handler to let the rider set pickup/drop-off by tapping the map
 */
export default function LiveMap({ pickup, dropoff, driverPos, phase, onMapClick, mapRef }) {
  // Ambient "nearby drivers" that gently drift around the city regardless
  // of the active booking, to sell the live-map feeling.
  const [ambient, setAmbient] = useState(() => [
    '/reference-visuals/driver-1.png',
    '/reference-visuals/driver-2.png',
    '/reference-visuals/driver-3.png',
    '/reference-visuals/driver-4.png',
  ].map((imageUrl, i) => ({
    imageUrl,
    pos: jitter(KARACHI_LOCATIONS[i * 2 % KARACHI_LOCATIONS.length], 0.02),
  })))

  useEffect(() => {
    const id = setInterval(() => {
      setAmbient((prev) => prev.map((d) => ({ ...d, pos: jitter(d.pos, 0.004) })))
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const bounds = useMemo(() => {
    if (pickup && dropoff) {
      return [
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]
    }
    return null
  }, [pickup, dropoff])

  const routeLine = useMemo(() => {
    if (!pickup || !dropoff) return []
    // Slight midpoint offset so the line reads as a road route, not a
    // perfectly straight ruler line.
    const mid = lerpLatLng(pickup, dropoff, 0.5)
    const offset = { lat: mid.lat + 0.006, lng: mid.lng - 0.004 }
    return [
      [pickup.lat, pickup.lng],
      [offset.lat, offset.lng],
      [dropoff.lat, dropoff.lng],
    ]
  }, [pickup, dropoff])

  return (
    <MapContainer
      center={[KARACHI_CENTER.lat, KARACHI_CENTER.lng]}
      zoom={12}
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full"
      style={{ background: '#0d1424' }}
    >
      <TileLayer
        attribution=""
        url={MAP_TILE_URL}
      />

      <ViewController bounds={bounds} focusPoint={!pickup && !dropoff ? KARACHI_CENTER : null} />
      <ClickCapture onMapClick={onMapClick} />
      {mapRef && <MapRefBridge mapRef={mapRef} />}

      {routeLine.length > 0 && (
        <Polyline
          positions={routeLine}
          pathOptions={{ color: '#EC4899', weight: 4, opacity: 0.85, dashArray: '10 8' }}
        />
      )}

      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={PICKUP_ICON} />}
      {dropoff && <Marker position={[dropoff.lat, dropoff.lng]} icon={DROPOFF_ICON} />}

      {/* Assigned driver — only shown once matched, animates along the route */}
      {driverPos && phase && phase !== 'idle' && phase !== 'searching' && (
        <Marker
          position={[driverPos.lat, driverPos.lng]}
          icon={avatarIcon('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', '#22d3ee', true)}
        />
      )}

      {/* Ambient nearby drivers */}
      {ambient.map((d, index) => (
        <Marker key={index} position={[d.pos.lat, d.pos.lng]} icon={avatarIcon(d.imageUrl)} />
      ))}
    </MapContainer>
  )
}
