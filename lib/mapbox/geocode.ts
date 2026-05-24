import { env } from "@/lib/env";
import { restaurantLocation, siteConfig } from "@/lib/config/site";
import {
  isWithinDeliveryRadiusMiles,
  milesBetweenCoordinates,
  type Coordinates,
} from "@/lib/utils/distance";

export type GeocodeDeliveryResult =
  | {
      ok: true;
      address: string;
      lat: number;
      lng: number;
      milesFromRestaurant: number;
      withinRadius: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

interface MapboxContextEntry {
  id?: string;
  text?: string;
  short_code?: string;
}

interface MapboxFeature {
  id?: string;
  place_name: string;
  text?: string;
  center: [number, number]; // [lng, lat]
  context?: MapboxContextEntry[];
  properties?: { accuracy?: string };
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

// Approx Glasgow G31 3BU coordinates used only as Mapbox search bias.
// These are NOT used as the restaurant origin for the radius check —
// that origin is resolved via Mapbox once and cached at runtime.
const GLASGOW_PROXIMITY_LNG = -4.2026;
const GLASGOW_PROXIMITY_LAT = 55.8642;

const MAPBOX_BASE =
  "https://api.mapbox.com/geocoding/v5/mapbox.places";

let cachedRestaurantCoords: Coordinates | null = null;
let cachedRestaurantPromise: Promise<Coordinates | null> | null = null;

function getMapboxToken(): string | null {
  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN.trim();
  if (!token) return null;
  return token;
}

async function callMapbox(
  query: string,
  token: string,
  opts: { limit?: number; proximity?: [number, number]; autocomplete?: boolean } = {},
): Promise<MapboxFeature[]> {
  const encoded = encodeURIComponent(query);
  const params = new URLSearchParams({
    access_token: token,
    country: "gb",
    limit: String(opts.limit ?? 1),
    autocomplete: opts.autocomplete ? "true" : "false",
    types: "address,postcode,place,locality,neighborhood",
  });
  if (opts.proximity) {
    params.set("proximity", `${opts.proximity[0]},${opts.proximity[1]}`);
  }
  const url = `${MAPBOX_BASE}/${encoded}.json?${params.toString()}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Mapbox responded with HTTP ${res.status}`);
  }
  const data = (await res.json()) as MapboxResponse;
  return Array.isArray(data.features) ? data.features : [];
}

async function resolveRestaurantCoordinates(): Promise<Coordinates | null> {
  if (cachedRestaurantCoords) return cachedRestaurantCoords;
  if (cachedRestaurantPromise) return cachedRestaurantPromise;

  const token = getMapboxToken();
  if (!token) return null;

  cachedRestaurantPromise = (async () => {
    try {
      const features = await callMapbox(
        restaurantLocation.fullAddress,
        token,
        { limit: 1 },
      );
      const first = features[0];
      if (!first) return null;
      const [lng, lat] = first.center;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      cachedRestaurantCoords = { lat, lng };
      return cachedRestaurantCoords;
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("[mapbox] restaurant geocode failed:", err);
      return null;
    } finally {
      cachedRestaurantPromise = null;
    }
  })();

  return cachedRestaurantPromise;
}

export async function geocodeAddressForDelivery(
  address: string,
): Promise<GeocodeDeliveryResult> {
  const token = getMapboxToken();
  if (!token) {
    return {
      ok: false,
      code: "MAPBOX_NOT_CONFIGURED",
      message: "Address lookup is unavailable right now. Please try again later.",
    };
  }

  const restaurant = await resolveRestaurantCoordinates();
  if (!restaurant) {
    return {
      ok: false,
      code: "MAPBOX_RESTAURANT_GEOCODE_FAILED",
      message: "We couldn't determine our restaurant coordinates. Please try again later.",
    };
  }

  let features: MapboxFeature[] = [];
  try {
    features = await callMapbox(address, token, {
      limit: 1,
      proximity: [GLASGOW_PROXIMITY_LNG, GLASGOW_PROXIMITY_LAT],
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[mapbox] address geocode failed:", err);
    return {
      ok: false,
      code: "MAPBOX_REQUEST_FAILED",
      message: "We couldn't reach our address lookup service. Please try again.",
    };
  }

  const first = features[0];
  if (!first) {
    return {
      ok: false,
      code: "ADDRESS_NOT_FOUND",
      message: "We couldn't find that address. Please check and try again.",
    };
  }

  const [lng, lat] = first.center;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      code: "ADDRESS_INVALID_COORDS",
      message: "We couldn't read the location for that address.",
    };
  }

  const coords: Coordinates = { lat, lng };
  const miles = milesBetweenCoordinates(restaurant, coords);
  const withinRadius = isWithinDeliveryRadiusMiles(
    restaurant,
    coords,
    siteConfig.deliveryRadiusMiles,
  );

  return {
    ok: true,
    address: first.place_name,
    lat,
    lng,
    milesFromRestaurant: Math.round(miles * 100) / 100,
    withinRadius,
  };
}

/**
 * Server-only helper used by /api/orders/create to re-verify that an
 * incoming delivery coordinate is genuinely within the radius from the
 * restaurant. Never trust the client-side check.
 */
export async function verifyCoordinatesWithinRadius(
  coords: Coordinates,
): Promise<{ ok: true; milesFromRestaurant: number } | { ok: false; code: string; message: string }> {
  const measurement = await measureCoordinatesAgainstDelivery(coords);
  if (!measurement.ok) {
    return measurement;
  }
  if (!measurement.withinRadius) {
    return {
      ok: false,
      code: "OUTSIDE_DELIVERY_RADIUS",
      message: `Sorry — this address is outside our ${siteConfig.deliveryRadiusMiles}-mile delivery zone.`,
    };
  }
  return { ok: true, milesFromRestaurant: measurement.milesFromRestaurant };
}

/**
 * Like {@link verifyCoordinatesWithinRadius} but always returns the miles and
 * a boolean, even when outside the radius. Used by /api/validate-address so
 * the UI can render an informative "X miles away" message either way.
 */
export async function measureCoordinatesAgainstDelivery(
  coords: Coordinates,
): Promise<
  | { ok: true; milesFromRestaurant: number; withinRadius: boolean }
  | { ok: false; code: string; message: string }
> {
  const token = getMapboxToken();
  if (!token) {
    return {
      ok: false,
      code: "MAPBOX_NOT_CONFIGURED",
      message: "Delivery verification is unavailable right now.",
    };
  }
  const restaurant = await resolveRestaurantCoordinates();
  if (!restaurant) {
    return {
      ok: false,
      code: "MAPBOX_RESTAURANT_GEOCODE_FAILED",
      message: "We couldn't verify the delivery distance. Please try again later.",
    };
  }
  const miles = milesBetweenCoordinates(restaurant, coords);
  const within = isWithinDeliveryRadiusMiles(
    restaurant,
    coords,
    siteConfig.deliveryRadiusMiles,
  );
  return {
    ok: true,
    milesFromRestaurant: Math.round(miles * 100) / 100,
    withinRadius: within,
  };
}

export interface AutocompleteSuggestion {
  id: string;
  label: string;
  address: string;
  postcode?: string;
  lat: number;
  lng: number;
}

export type AutocompleteResult =
  | { ok: true; suggestions: AutocompleteSuggestion[] }
  | { ok: false; code: string; message: string };

function extractPostcode(feature: MapboxFeature): string | undefined {
  if (Array.isArray(feature.context)) {
    for (const entry of feature.context) {
      if (typeof entry.id === "string" && entry.id.startsWith("postcode")) {
        return entry.text;
      }
    }
  }
  // If the feature itself is a postcode feature.
  if (typeof feature.id === "string" && feature.id.startsWith("postcode")) {
    return feature.text;
  }
  return undefined;
}

/**
 * Returns Mapbox address suggestions biased to Glasgow, restricted to GB.
 * Used by the public order page autocomplete dropdown. Safe to call from a
 * server route — the access token never leaves the server in the response.
 */
export async function autocompleteAddressSuggestions(
  query: string,
  opts: { limit?: number } = {},
): Promise<AutocompleteResult> {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    return { ok: true, suggestions: [] };
  }
  const token = getMapboxToken();
  if (!token) {
    return {
      ok: false,
      code: "MAPBOX_NOT_CONFIGURED",
      message: "Address lookup is unavailable right now.",
    };
  }
  let features: MapboxFeature[] = [];
  try {
    features = await callMapbox(trimmed, token, {
      limit: Math.min(Math.max(opts.limit ?? 6, 1), 10),
      proximity: [GLASGOW_PROXIMITY_LNG, GLASGOW_PROXIMITY_LAT],
      autocomplete: true,
    });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[mapbox] autocomplete failed:", err);
    return {
      ok: false,
      code: "MAPBOX_REQUEST_FAILED",
      message: "We couldn't reach the address lookup service. Please try again.",
    };
  }

  const suggestions: AutocompleteSuggestion[] = [];
  features.forEach((f, idx) => {
    const [lng, lat] = f.center ?? [Number.NaN, Number.NaN];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    suggestions.push({
      id: typeof f.id === "string" && f.id.length > 0 ? f.id : `${idx}-${f.place_name}`,
      label: f.place_name,
      address: f.place_name,
      postcode: extractPostcode(f),
      lat,
      lng,
    });
  });

  return { ok: true, suggestions };
}
