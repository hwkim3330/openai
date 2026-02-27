import { fetchJson } from './http.js';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

const weatherCodeMap = new Map([
  [0, 'Clear sky'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Moderate drizzle'],
  [55, 'Dense drizzle'],
  [61, 'Slight rain'],
  [63, 'Moderate rain'],
  [65, 'Heavy rain'],
  [71, 'Slight snow'],
  [73, 'Moderate snow'],
  [75, 'Heavy snow'],
  [80, 'Rain showers'],
  [81, 'Moderate rain showers'],
  [82, 'Violent rain showers'],
  [95, 'Thunderstorm']
]);

const parseLatLon = (raw) => {
  const m = raw.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  return { lat: Number(m[1]), lon: Number(m[2]), name: `${m[1]},${m[2]}` };
};

const geocode = async (query) => {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=1&language=ko&format=json`;
  const data = await fetchJson(url, {}, 20000);
  const g = data?.results?.[0];
  if (!g) throw new Error('location not found');
  return {
    lat: g.latitude,
    lon: g.longitude,
    name: `${g.name}${g.country ? `, ${g.country}` : ''}`
  };
};

export const getWeather = async (locationRaw) => {
  const q = locationRaw.trim();
  if (!q) return 'usage: weather: Seoul or weather: 37.56,126.97';

  try {
    const loc = parseLatLon(q) || (await geocode(q));
    const params = new URLSearchParams({
      latitude: String(loc.lat),
      longitude: String(loc.lon),
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      timezone: 'auto'
    });
    const data = await fetchJson(`${WEATHER_URL}?${params.toString()}`, {}, 20000);
    const cur = data?.current;
    if (!cur) return '[WEATHER] no data';

    const desc = weatherCodeMap.get(cur.weather_code) || `Code ${cur.weather_code}`;
    return (
      `[WEATHER]\n${loc.name}\n` +
      `Temp: ${cur.temperature_2m}°C (Feels ${cur.apparent_temperature}°C)\n` +
      `Humidity: ${cur.relative_humidity_2m}% | Rain: ${cur.precipitation} mm\n` +
      `Wind: ${cur.wind_speed_10m} km/h | ${desc}`
    );
  } catch (err) {
    return `[WEATHER] failed: ${err.message}`;
  }
};
