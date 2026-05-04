// Free OpenStreetMap Nominatim geocoder.
// Per usage policy: keep volume low (<1 req/s), include a meaningful Referer (default in browser),
// and never use it for bulk geocoding. We debounce calls in the UI layer and abort in-flight
// requests on each new keystroke.

export interface GeocodeResult {
  display_name: string;
  latitude: number;
  longitude: number;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface RawNominatimSearch {
  display_name: string;
  lat: string;
  lon: string;
}

interface RawNominatimReverse {
  display_name?: string;
  lat?: string;
  lon?: string;
  error?: string;
}

const parseLatLon = (lat: string | undefined, lon: string | undefined) => {
  const latitude = Number.parseFloat(lat ?? '');
  const longitude = Number.parseFloat(lon ?? '');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

export const searchAddress = async (
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'fi',
    'accept-language': 'en',
    q: trimmed,
  });

  const res = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

  const raw = (await res.json()) as RawNominatimSearch[];
  return raw
    .map(item => {
      const coords = parseLatLon(item.lat, item.lon);
      if (!coords) return null;
      return { display_name: item.display_name, ...coords };
    })
    .filter((x): x is GeocodeResult => x !== null);
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> => {
  const params = new URLSearchParams({
    format: 'json',
    lat: latitude.toString(),
    lon: longitude.toString(),
    'accept-language': 'en',
  });

  const res = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!res.ok) throw new Error(`Reverse geocoding failed (${res.status})`);

  const raw = (await res.json()) as RawNominatimReverse;
  if (raw.error || !raw.display_name) return null;
  const coords = parseLatLon(raw.lat, raw.lon);
  if (!coords) return null;
  return { display_name: raw.display_name, ...coords };
};
