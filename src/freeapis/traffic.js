import { fetchJson } from './http.js';

const geocodeNominatim = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(
    url,
    {
      headers: {
        'User-Agent': 'openai-chrome-agent/0.1 (contact: local-user)'
      }
    },
    20000
  );
  const g = data?.[0];
  if (!g) throw new Error(`location not found: ${query}`);
  return {
    lat: Number(g.lat),
    lon: Number(g.lon),
    name: g.display_name
  };
};

const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

const formatDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const getTraffic = async (raw) => {
  const text = raw.trim();
  const parts = text.split('->').map((x) => x.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return 'usage: traffic: Seoul Station -> Incheon Airport';
  }

  try {
    const from = await geocodeNominatim(parts[0]);
    const to = await geocodeNominatim(parts[1]);

    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false&alternatives=false&steps=false`;
    const data = await fetchJson(routeUrl, {}, 25000);
    const route = data?.routes?.[0];
    if (!route) return '[TRAFFIC] no route found';

    return (
      `[TRAFFIC]\nFrom: ${from.name}\nTo: ${to.name}\n` +
      `Distance: ${formatDistance(route.distance)}\n` +
      `ETA: ${formatDuration(route.duration)}\n` +
      `Note: free OSRM estimate (not full real-time incident feed).`
    );
  } catch (err) {
    return `[TRAFFIC] failed: ${err.message}`;
  }
};
