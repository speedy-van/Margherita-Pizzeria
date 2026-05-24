export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates using the Haversine formula.
 * Returns miles.
 */
export function milesBetweenCoordinates(
  a: Coordinates,
  b: Coordinates,
): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_MILES * c;
}

export function isWithinDeliveryRadiusMiles(
  a: Coordinates,
  b: Coordinates,
  radiusMiles: number,
): boolean {
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0) {
    return false;
  }
  return milesBetweenCoordinates(a, b) <= radiusMiles;
}
