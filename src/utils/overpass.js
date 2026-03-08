const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_KEY = "pawcoach_nearby_parks";
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fetch nearby dog-friendly parks using Overpass API (OpenStreetMap).
 * Returns cached results if available and within TTL + radius.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusM - search radius in meters (default 3000)
 * @returns {Promise<Array<{name, lat, lng, distanceKm, type, tags}>>}
 */
export async function fetchNearbyParks(lat, lng, radiusM = 3000) {
  // Check cache
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      const drift = haversineKm(lat, lng, cached.lat, cached.lng);
      if (drift < 1) {
        // User hasn't moved much — reuse cache, just recalculate distances
        return cached.parks.map(p => ({
          ...p,
          distanceKm: haversineKm(lat, lng, p.lat, p.lng),
        })).sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }
  } catch {}

  // Overpass QL query: dog parks + parks that accept dogs
  // Note: relations excluded — `out center tags` doesn't return coordinates for relations
  const query = `[out:json][timeout:10];
(
  node["leisure"="dog_park"](around:${radiusM},${lat},${lng});
  way["leisure"="dog_park"](around:${radiusM},${lat},${lng});
  node["leisure"="park"]["dog"="yes"](around:${radiusM},${lat},${lng});
  way["leisure"="park"]["dog"="yes"](around:${radiusM},${lat},${lng});
  node["leisure"="park"]["dog"="leashed"](around:${radiusM},${lat},${lng});
  way["leisure"="park"]["dog"="leashed"](around:${radiusM},${lat},${lng});
);
out center tags;`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  let resp;
  try {
    resp = await fetch(OVERPASS_URL, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!resp.ok) throw new Error(`Overpass API error: ${resp.status}`);
  const data = await resp.json();

  const parks = (data.elements || []).map(el => {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) return null;
    const tags = el.tags || {};
    const isDogPark = tags.leisure === "dog_park";
    return {
      id: `${el.type}/${el.id}`,
      name: tags.name || (isDogPark ? "Parc canin" : "Parc"),
      lat: elLat,
      lng: elLng,
      distanceKm: haversineKm(lat, lng, elLat, elLng),
      type: isDogPark ? "dog_park" : (tags.dog === "leashed" ? "park_leashed" : "park_dog_ok"),
      tags: {
        dog: tags.dog,
        surface: tags.surface,
        fenced: tags.fenced,
        opening_hours: tags.opening_hours,
        lit: tags.lit,
        drinking_water: tags.drinking_water,
        description: tags.description,
      },
    };
  }).filter(Boolean).sort((a, b) => a.distanceKm - b.distanceKm);

  // Deduplicate by proximity (OSM can have node + way for same park)
  // For generic names (Parc/Parc canin), use tighter proximity (20m) to avoid merging distinct parks
  const GENERIC_NAMES = ["Parc", "Parc canin"];
  const deduped = [];
  for (const p of parks) {
    const isGeneric = GENERIC_NAMES.includes(p.name);
    const threshold = isGeneric ? 0.02 : 0.05; // 20m for generic, 50m for named
    const duplicate = deduped.some(d => haversineKm(p.lat, p.lng, d.lat, d.lng) < threshold && d.name === p.name);
    if (!duplicate) deduped.push(p);
  }

  // Cache
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), lat, lng, parks: deduped }));
  } catch {}

  return deduped;
}

/**
 * Find if user is near any park (within thresholdM).
 * @param {number} lat
 * @param {number} lng
 * @param {Array} parks - from fetchNearbyParks
 * @param {number} thresholdM - proximity threshold in meters (default 100)
 * @returns {object|null} nearest park if within threshold
 */
export function findNearestPark(lat, lng, parks, thresholdM = 100) {
  if (!parks?.length) return null;
  const thresholdKm = thresholdM / 1000;
  for (const p of parks) {
    const d = haversineKm(lat, lng, p.lat, p.lng);
    if (d <= thresholdKm) return { ...p, distanceKm: d };
  }
  return null;
}
