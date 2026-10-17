export interface WeatherLocation {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface WeatherSnapshot {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  minimumTemperature: number;
  maximumTemperature: number;
  fetchedAt: string;
}

export interface WeatherWidgetState {
  location: WeatherLocation | null;
  snapshot: WeatherSnapshot | null;
}

interface WeatherGeocodingResponse {
  results?: unknown[];
  error?: boolean;
  reason?: string;
}

interface WeatherForecastResponse {
  current?: Record<string, unknown>;
  daily?: Record<string, unknown>;
  error?: boolean;
  reason?: string;
}

const WEATHER_STORAGE_KEY = 'wyandesk.weather.v1';
export const WEATHER_CACHE_MS = 30 * 60 * 1000;

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function cleanText(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, limit) : '';
}

export function normalizeWeatherLocation(value: unknown): WeatherLocation | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const name = cleanText(record.name, 60);
  const latitude = finiteNumber(record.latitude);
  const longitude = finiteNumber(record.longitude);
  if (!name || latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return {
    name,
    admin1: cleanText(record.admin1, 60),
    country: cleanText(record.country, 60),
    latitude,
    longitude,
    timezone: cleanText(record.timezone, 80) || 'auto',
  };
}

export function normalizeWeatherSnapshot(value: unknown): WeatherSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const temperature = finiteNumber(record.temperature);
  const apparentTemperature = finiteNumber(record.apparentTemperature);
  const humidity = finiteNumber(record.humidity);
  const weatherCode = finiteNumber(record.weatherCode);
  const windSpeed = finiteNumber(record.windSpeed);
  const minimumTemperature = finiteNumber(record.minimumTemperature);
  const maximumTemperature = finiteNumber(record.maximumTemperature);
  const fetchedAt = typeof record.fetchedAt === 'string' && Number.isFinite(Date.parse(record.fetchedAt)) ? record.fetchedAt : '';
  if ([temperature, apparentTemperature, humidity, weatherCode, windSpeed, minimumTemperature, maximumTemperature].some((item) => item === null) || !fetchedAt) return null;
  return {
    temperature: temperature!,
    apparentTemperature: apparentTemperature!,
    humidity: humidity!,
    weatherCode: weatherCode!,
    windSpeed: windSpeed!,
    isDay: record.isDay !== false,
    minimumTemperature: minimumTemperature!,
    maximumTemperature: maximumTemperature!,
    fetchedAt,
  };
}

export function readWeatherWidgetState(storage: Pick<Storage, 'getItem'> = window.localStorage): WeatherWidgetState {
  try {
    const raw = storage.getItem(WEATHER_STORAGE_KEY);
    if (!raw) return { location: null, snapshot: null };
    const value = JSON.parse(raw) as { location?: unknown; snapshot?: unknown };
    return { location: normalizeWeatherLocation(value.location), snapshot: normalizeWeatherSnapshot(value.snapshot) };
  } catch {
    return { location: null, snapshot: null };
  }
}

export function writeWeatherWidgetState(value: WeatherWidgetState, storage: Pick<Storage, 'setItem'> = window.localStorage): void {
  storage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(value));
}

export function clearWeatherWidgetState(storage: Pick<Storage, 'removeItem'> = window.localStorage): void {
  storage.removeItem(WEATHER_STORAGE_KEY);
}

export function weatherCacheIsFresh(snapshot: WeatherSnapshot | null, now = Date.now()): boolean {
  return Boolean(snapshot && now - Date.parse(snapshot.fetchedAt) >= 0 && now - Date.parse(snapshot.fetchedAt) < WEATHER_CACHE_MS);
}

async function readJSON<T>(response: Response): Promise<T> {
  const value = await response.json() as T & { error?: boolean; reason?: string };
  if (!response.ok || value.error) throw new Error(value.reason || '天气服务暂时不可用');
  return value;
}

export async function searchWeatherLocations(query: string, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<WeatherLocation[]> {
  const name = query.trim();
  if (name.length < 2) return [];
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', name);
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'zh');
  url.searchParams.set('format', 'json');
  const response = await readJSON<WeatherGeocodingResponse>(await fetcher(url, { signal }));
  return (response.results || []).map(normalizeWeatherLocation).filter((item): item is WeatherLocation => Boolean(item));
}

function firstNumber(value: unknown): number | null {
  return Array.isArray(value) ? finiteNumber(value[0]) : null;
}

export async function fetchWeatherSnapshot(location: WeatherLocation, signal?: AbortSignal, fetcher: typeof fetch = fetch, now = new Date()): Promise<WeatherSnapshot> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');
  const response = await readJSON<WeatherForecastResponse>(await fetcher(url, { signal }));
  const current = response.current || {};
  const daily = response.daily || {};
  const snapshot = normalizeWeatherSnapshot({
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    isDay: current.is_day !== 0,
    maximumTemperature: firstNumber(daily.temperature_2m_max),
    minimumTemperature: firstNumber(daily.temperature_2m_min),
    fetchedAt: now.toISOString(),
  });
  if (!snapshot) throw new Error('天气数据不完整，请稍后重试');
  return snapshot;
}

export function weatherCondition(code: number): 'clear' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm' {
  if (code === 0) return 'clear';
  if ([1, 2, 3].includes(code)) return 'cloud';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  return 'cloud';
}

export function weatherConditionLabel(code: number): string {
  return ({ clear: '晴朗', cloud: '多云', fog: '有雾', rain: '有雨', snow: '有雪', storm: '雷雨' })[weatherCondition(code)];
}

export function formatWeatherLocation(location: WeatherLocation): string {
  return [location.name, location.admin1 && location.admin1 !== location.name ? location.admin1 : '', location.country].filter(Boolean).join(' · ');
}
