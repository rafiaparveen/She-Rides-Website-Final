// Real Karachi neighborhoods with actual coordinates, used to seed
// pickup/drop-off suggestions, the live map, and fare calculation.
export const KARACHI_CENTER = { lat: 24.8607, lng: 67.0011 }

export const KARACHI_LOCATIONS = [
  { name: 'Clifton Beach', lat: 24.8138, lng: 67.0300 },
  { name: 'Saddar Town', lat: 24.8546, lng: 67.0207 },
  { name: 'DHA Phase 5', lat: 24.8000, lng: 67.0450 },
  { name: 'Gulshan-e-Iqbal', lat: 24.9200, lng: 67.0930 },
  { name: 'North Nazimabad', lat: 24.9370, lng: 67.0530 },
  { name: 'PECHS Block 6', lat: 24.8730, lng: 67.0640 },
  { name: 'Tariq Road', lat: 24.8660, lng: 67.0530 },
  { name: 'Korangi Industrial Area', lat: 24.8420, lng: 67.1330 },
  { name: 'Malir Cantt', lat: 24.8930, lng: 67.2070 },
  { name: 'Jinnah International Airport', lat: 24.9065, lng: 67.1608 },
  { name: 'Frere Town', lat: 24.8420, lng: 67.0290 },
  { name: 'Bahadurabad', lat: 24.8770, lng: 67.0610 },
]

// Haversine formula — great-circle distance in kilometres.
export function distanceKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Rough city-traffic ETA: ~22 km/h average speed in Karachi traffic.
export function etaMinutes(km) {
  return Math.max(4, Math.round((km / 22) * 60))
}

export const RIDE_TIERS = [
  { id: 'economy', name: 'Economy', car: 'Suzuki Alto', base: 120, perKm: 42, multiplier: 1 },
  { id: 'comfort', name: 'Comfort', car: 'Toyota Yaris', base: 180, perKm: 58, multiplier: 1.35 },
  { id: 'premier', name: 'Premier', car: 'Honda Civic', base: 260, perKm: 78, multiplier: 1.75 },
]

export function calcFare(tier, km) {
  const raw = tier.base + tier.perKm * km
  return Math.round(raw / 5) * 5 // round to nearest 5 PKR
}

export function formatPKR(amount) {
  return `Rs ${Math.round(amount).toLocaleString('en-PK')}`
}

// Linear interpolation between two lat/lng points, t in [0,1].
export function lerpLatLng(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }
}

// Small deterministic-ish jitter so ambient driver dots don't sit exactly
// on top of named locations.
export function jitter(point, magnitude = 0.01) {
  return {
    lat: point.lat + (Math.random() - 0.5) * magnitude,
    lng: point.lng + (Math.random() - 0.5) * magnitude,
  }
}
