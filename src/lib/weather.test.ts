import { describe, expect, it, vi } from 'vitest';
import { fetchWeatherSnapshot, normalizeWeatherLocation, readWeatherWidgetState, searchWeatherLocations, weatherCacheIsFresh, weatherCondition } from './weather';

describe('weather widget data', () => {
  it('normalizes a safe location and rejects invalid coordinates', () => {
    expect(normalizeWeatherLocation({ name: ' 杭州 ', admin1: '浙江', country: '中国', latitude: 30.25, longitude: 120.16, timezone: 'Asia/Shanghai' })).toMatchObject({ name: '杭州', latitude: 30.25 });
    expect(normalizeWeatherLocation({ name: '未知', latitude: 130, longitude: 10 })).toBeNull();
  });

  it('returns an empty local state when saved JSON is damaged', () => {
    const storage = { getItem: vi.fn(() => '{broken') };
    expect(readWeatherWidgetState(storage)).toEqual({ location: null, snapshot: null });
  });

  it('searches Chinese city names and keeps only valid results', async () => {
    const fetcherMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ results: [
      { name: '杭州', admin1: '浙江', country: '中国', latitude: 30.25, longitude: 120.16, timezone: 'Asia/Shanghai' },
      { name: '坏数据', latitude: 999, longitude: 10 },
    ] }), { status: 200 }));
    await expect(searchWeatherLocations('杭州', undefined, fetcherMock as unknown as typeof fetch)).resolves.toHaveLength(1);
    expect(String(fetcherMock.mock.calls[0][0])).toContain('language=zh');
  });

  it('parses the requested current and daily forecast fields', async () => {
    const fetcherMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      current: { temperature_2m: 21.4, apparent_temperature: 20.1, relative_humidity_2m: 66, weather_code: 2, wind_speed_10m: 9.2, is_day: 1 },
      daily: { temperature_2m_max: [24.8], temperature_2m_min: [15.6] },
    }), { status: 200 }));
    const location = normalizeWeatherLocation({ name: '杭州', latitude: 30.25, longitude: 120.16, timezone: 'Asia/Shanghai' })!;
    const snapshot = await fetchWeatherSnapshot(location, undefined, fetcherMock as unknown as typeof fetch, new Date('2026-10-15T02:00:00.000Z'));
    expect(snapshot).toMatchObject({ temperature: 21.4, humidity: 66, minimumTemperature: 15.6, maximumTemperature: 24.8, fetchedAt: '2026-10-15T02:00:00.000Z' });
    const requestURL = String(fetcherMock.mock.calls[0][0]);
    expect(requestURL).toContain('current=temperature_2m%2Crelative_humidity_2m');
    expect(requestURL).toContain('timezone=auto');
  });

  it('surfaces forecast service errors instead of caching partial data', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ error: true, reason: 'invalid location' }), { status: 400 }));
    const location = normalizeWeatherLocation({ name: '杭州', latitude: 30.25, longitude: 120.16 })!;
    await expect(fetchWeatherSnapshot(location, undefined, fetcher as unknown as typeof fetch)).rejects.toThrow('invalid location');
  });

  it('uses a bounded cache window and stable weather groups', () => {
    const snapshot = { temperature: 20, apparentTemperature: 20, humidity: 50, weatherCode: 0, windSpeed: 1, isDay: true, minimumTemperature: 10, maximumTemperature: 22, fetchedAt: '2026-10-15T00:00:00.000Z' };
    expect(weatherCacheIsFresh(snapshot, Date.parse('2026-10-15T00:29:59.000Z'))).toBe(true);
    expect(weatherCacheIsFresh(snapshot, Date.parse('2026-10-15T00:30:00.000Z'))).toBe(false);
    expect(weatherCondition(0)).toBe('clear');
    expect(weatherCondition(95)).toBe('storm');
  });
});
