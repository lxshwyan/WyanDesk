import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, MapPin, RefreshCw, Search, Snowflake, Sun } from 'lucide-react';
import {
  fetchWeatherSnapshot,
  formatWeatherLocation,
  readWeatherWidgetState,
  searchWeatherLocations,
  weatherCacheIsFresh,
  weatherCondition,
  weatherConditionLabel,
  writeWeatherWidgetState,
  type WeatherLocation,
} from '../lib/weather';

function WeatherIcon({ code, isDay }: { code: number; isDay: boolean }) {
  const condition = weatherCondition(code);
  if (condition === 'clear') return isDay ? <Sun aria-hidden="true" /> : <CloudSun aria-hidden="true" />;
  if (condition === 'fog') return <CloudFog aria-hidden="true" />;
  if (condition === 'rain') return <CloudRain aria-hidden="true" />;
  if (condition === 'snow') return <Snowflake aria-hidden="true" />;
  if (condition === 'storm') return <CloudLightning aria-hidden="true" />;
  return <Cloud aria-hidden="true" />;
}

export function WeatherCard() {
  const [stored, setStored] = useState(readWeatherWidgetState);
  const [configuring, setConfiguring] = useState(() => !stored.location);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const weatherAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const locationKey = stored.location ? `${stored.location.latitude},${stored.location.longitude}` : '';

  function persist(next: typeof stored) {
    setStored(next);
    try { writeWeatherWidgetState(next); } catch { setError('本机存储空间不足，城市设置可能无法保留'); }
  }

  async function loadWeather(location: WeatherLocation) {
    weatherAbortRef.current?.abort();
    const controller = new AbortController();
    weatherAbortRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const snapshot = await fetchWeatherSnapshot(location, controller.signal);
      persist({ location, snapshot });
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '天气获取失败，请稍后重试');
    } finally {
      if (weatherAbortRef.current === controller) setLoading(false);
    }
  }

  useEffect(() => {
    if (!stored.location || weatherCacheIsFresh(stored.snapshot)) return;
    void loadWeather(stored.location);
    return () => weatherAbortRef.current?.abort();
    // The location key and cache timestamp are the only values that should trigger a network refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey, stored.snapshot?.fetchedAt]);

  useEffect(() => () => {
    weatherAbortRef.current?.abort();
    searchAbortRef.current?.abort();
  }, []);

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return setError('请输入至少 2 个字的城市名称');
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const next = await searchWeatherLocations(query, controller.signal);
      setResults(next);
      if (!next.length) setError('没有找到这个城市，请换一个名称');
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '城市搜索失败，请稍后重试');
    } finally {
      if (searchAbortRef.current === controller) setSearching(false);
    }
  }

  function selectLocation(location: WeatherLocation) {
    persist({ location, snapshot: null });
    setConfiguring(false);
    setQuery('');
    setResults([]);
    setError('');
  }

  const snapshot = stored.snapshot;
  return (
    <section className="glass-panel weather-card">
      <div className="mini-heading">
        <span><CloudSun aria-hidden="true" />天气</span>
        {stored.location && !configuring && <button type="button" onClick={() => setConfiguring(true)}>换城市</button>}
      </div>

      {configuring ? (
        <div className="weather-setup">
          <div className="widget-inline-note"><MapPin aria-hidden="true" /><span>手动选择城市，不读取定位</span></div>
          <form className="weather-search" onSubmit={submitSearch}>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setError(''); }} maxLength={60} placeholder="输入城市，例如：杭州" aria-label="城市名称" />
            <button type="submit" disabled={searching} aria-label="搜索城市">{searching ? <RefreshCw className="is-spinning" aria-hidden="true" /> : <Search aria-hidden="true" />}</button>
          </form>
          {results.length > 0 && (
            <div className="weather-results" aria-label="城市搜索结果">
              {results.map((location) => (
                <button key={`${location.latitude}-${location.longitude}`} type="button" onClick={() => selectLocation(location)}>
                  <strong>{location.name}</strong><small>{[location.admin1, location.country].filter(Boolean).join(' · ')}</small>
                </button>
              ))}
            </div>
          )}
          {stored.location && <button className="widget-text-action" type="button" onClick={() => { setConfiguring(false); setError(''); }}>取消</button>}
        </div>
      ) : snapshot ? (
        <div className="weather-content">
          <div className="weather-primary">
            <span className={`weather-symbol condition-${weatherCondition(snapshot.weatherCode)}`}><WeatherIcon code={snapshot.weatherCode} isDay={snapshot.isDay} /></span>
            <span><strong>{Math.round(snapshot.temperature)}°</strong><small>{weatherConditionLabel(snapshot.weatherCode)} · 体感 {Math.round(snapshot.apparentTemperature)}°</small></span>
          </div>
          <div className="weather-location"><MapPin aria-hidden="true" /><span title={formatWeatherLocation(stored.location!)}>{formatWeatherLocation(stored.location!)}</span></div>
          <dl className="weather-details">
            <div><dt>今日</dt><dd>{Math.round(snapshot.minimumTemperature)}° / {Math.round(snapshot.maximumTemperature)}°</dd></div>
            <div><dt>湿度</dt><dd>{Math.round(snapshot.humidity)}%</dd></div>
            <div><dt>风速</dt><dd>{Math.round(snapshot.windSpeed)} km/h</dd></div>
          </dl>
          <div className="widget-source-row"><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a><button type="button" onClick={() => void loadWeather(stored.location!)} disabled={loading}><RefreshCw className={loading ? 'is-spinning' : ''} aria-hidden="true" />{loading ? '更新中' : '更新'}</button></div>
        </div>
      ) : (
        <div className="widget-loading"><RefreshCw className="is-spinning" aria-hidden="true" /><span>正在获取天气…</span></div>
      )}
      {error && <p className="widget-inline-error" role="alert">{error}</p>}
    </section>
  );
}
