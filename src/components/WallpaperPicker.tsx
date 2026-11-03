import { Check, Heart } from 'lucide-react';
import { useState } from 'react';
import type { WallpaperPreferences } from '../types';
import { curatedWallpapers } from '../data/wallpapers';
import { selectedWallpaper } from '../lib/wallpapers';
import './wallpapers.css';

export function WallpaperPicker({ value, custom, now, onChange }: { value: WallpaperPreferences; custom: boolean; now: Date; onChange: (next: WallpaperPreferences, apply?: boolean) => void }) {
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const selected = !custom ? selectedWallpaper(value, now) : undefined;
  const items = curatedWallpapers.filter((item) => !favoritesOnly || value.favoriteIds.includes(item.id));
  return <div className="wallpaper-picker">
    <div className="wallpaper-picker-heading"><strong>精选壁纸</strong><div className="wallpaper-tabs" role="group" aria-label="壁纸范围"><button type="button" aria-pressed={!favoritesOnly} onClick={() => setFavoritesOnly(false)}>全部</button><button type="button" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(true)}>收藏</button></div></div>
    <div className="wallpaper-grid">{items.map((item) => <div key={item.id} className="wallpaper-option">
      <button className="wallpaper-apply" type="button" aria-label={`使用壁纸：${item.name}`} aria-pressed={selected?.id === item.id} onClick={() => onChange({ ...value, selectedId: item.id, daily: false }, true)}><img src={`./${item.src}`} loading="lazy" width="320" height="180" alt="" /><span>{item.name}</span>{selected?.id === item.id && <Check aria-hidden="true" />}</button>
      <button className="wallpaper-favorite" type="button" aria-label={`${value.favoriteIds.includes(item.id) ? '取消收藏' : '收藏'}壁纸：${item.name}`} aria-pressed={value.favoriteIds.includes(item.id)} onClick={() => onChange({ ...value, favoriteIds: value.favoriteIds.includes(item.id) ? value.favoriteIds.filter((id) => id !== item.id) : [...value.favoriteIds, item.id] })}><Heart aria-hidden="true" fill={value.favoriteIds.includes(item.id) ? 'currentColor' : 'none'} /></button>
    </div>)}</div>
    {!items.length && <p className="wallpaper-empty">还没有收藏，点击壁纸上的爱心即可收藏。</p>}
    <label className="wallpaper-daily"><input type="checkbox" checked={value.daily && !custom} onChange={(event) => onChange({ ...value, selectedId: selected?.id || value.selectedId || curatedWallpapers[0].id, daily: event.target.checked }, true)} /><span>每天换一张<small>{value.favoriteIds.length ? '从收藏中按日切换' : '从精选中按日切换'}</small></span></label>
    <details className="wallpaper-credits"><summary>图片来源与许可</summary>{curatedWallpapers.map((item) => <a key={item.id} href={item.source} target="_blank" rel="noreferrer">{item.name} · {item.author} · {item.license}</a>)}</details>
  </div>;
}
