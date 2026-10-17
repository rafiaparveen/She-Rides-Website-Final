import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { KARACHI_CENTER, lerpLatLng } from '../lib/geo.js'

// Use OpenStreetMap tiles by default; an optional Mapbox token enables the dark style.
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim()
const MAP_TILE_URL = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const MAP_ATTRIBUTION = MAPBOX_TOKEN
  ? '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'

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
const CURRENT_LOCATION_ICON = pinIcon('#22d3ee', 20)

// Recenters/fits the map whenever the relevant bounds change.
function ViewController({ bounds, focusPoint }) {
  const map = useMap()
  useEffect(() => {
    if (focusPoint) {
      map.panTo([focusPoint.lat, focusPoint.lng], { animate: true, duration: 0.5 })
    } else if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
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
export default function LiveMap({
  pickup,
  dropoff,
  driverPos,
  assignedDriver,
  phase,
  onMapClick,
  mapRef,
  focusPoint,
  liveLocation,
}) {
  const bounds = useMemo(() => {
    if (pickup && dropoff) {
      const points = [
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]
      return points
    }
    return null
  }, [pickup, dropoff, phase, driverPos, assignedDriver])

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
      className="w-full h-full"
      style={{ background: '#0d1424' }}
    >
      <TileLayer
        attribution={MAP_ATTRIBUTION}
        url={MAP_TILE_URL}
      />

      <ViewController bounds={bounds} focusPoint={focusPoint || (!pickup && !dropoff ? KARACHI_CENTER : null)} />
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
      {liveLocation && (
        <Marker
          position={[liveLocation.lat, liveLocation.lng]}
          icon={CURRENT_LOCATION_ICON}
        />
      )}

      {/* Assigned driver — only shown once matched, animates along the route */}
      {driverPos && phase && phase !== 'idle' && phase !== 'searching' && (
        <Marker
          position={[driverPos.lat, driverPos.lng]}
          icon={avatarIcon(assignedDriver?.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', '#22d3ee', true)}
        />
      )}

    </MapContainer>
  )
}
