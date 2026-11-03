import { Check, Eye, LayoutGrid, RotateCcw, X } from 'lucide-react';
import { appearancePresets, normalizeWallpaperView, type AppearanceSelection } from '../lib/appearance';
import { normalizeWallpaperPreferences } from '../lib/wallpapers';
import { WallpaperPicker } from './WallpaperPicker';
import './appearanceStudio.css';
import type { ReactNode } from 'react';

interface Props {
  value: AppearanceSelection;
  activePreset: string;
  dirty: boolean;
  canRestore: boolean;
  now: Date;
  uploadControl: ReactNode;
  onPreset: (id: typeof appearancePresets[number]['id']) => void;
  onChange: (value: AppearanceSelection) => void;
  onInspect: () => void;
  onApply: () => void;
  onCancel: () => void;
  onRestore: () => void;
}
export function AppearanceStudio({ value, activePreset, dirty, canRestore, now, uploadControl, onPreset, onChange, onInspect, onApply, onCancel, onRestore }: Props) {
  const view = normalizeWallpaperView(value.preferences.wallpaperView);
  const wallpaper = normalizeWallpaperPreferences(value.preferences.wallpaper);
  const photo = Boolean(value.preferences.customBackground || wallpaper.selectedId || wallpaper.daily);
  const changeView = (next: Partial<typeof view>) => onChange({ ...value, preferences: { ...value.preferences, wallpaperView: { ...view, ...next } } });
  return <div className="appearance-studio">
    <div className="studio-heading"><strong>外观方案</strong>{canRestore && !dirty && <button type="button" onClick={onRestore}><RotateCcw />恢复上次外观</button>}</div>
    <div className="appearance-presets" role="group" aria-label="外观方案">
      {appearancePresets.map((preset) => <button key={preset.id} className={`appearance-preset preset-${preset.id}`} aria-pressed={activePreset === preset.id} type="button" onClick={() => onPreset(preset.id)}>
        <span className="appearance-preset-art" aria-hidden="true">{preset.id === 'clear' ? <img src="./wallpapers/alpine-lake.jpg" alt="" /> : <LayoutGrid />}</span><strong>{preset.name}</strong><small>{preset.detail}</small>
      </button>)}
    </div>
    <button className="setting-toggle" type="button" role="switch" aria-checked={value.preferences.transparentAppearance === true} onClick={() => onChange({ ...value, preferences: { ...value.preferences, transparentAppearance: !value.preferences.transparentAppearance } })}>
      <span><strong>透明外观</strong><small>搜索与卡片透出壁纸</small></span><span className={`toggle-track${value.preferences.transparentAppearance ? ' active' : ''}`}><i /></span>
    </button>
    {value.preferences.transparentAppearance && <div className="wallpaper-tuning">
      <div className="wallpaper-ink" role="group" aria-label="壁纸上的文字颜色"><span>文字</span>{(['light', 'dark'] as const).map((tone) => <button key={tone} type="button" aria-pressed={view.tone === tone} onClick={() => changeView({ tone })}>{tone === 'light' ? '浅色' : '深色'}</button>)}</div>
      <label className="studio-range"><span>底色强度<output>{view.strength}%</output></span><input type="range" aria-label="透明底色强度" min="0" max="30" step="1" value={view.strength} onChange={(event) => changeView({ strength: Number(event.target.value) })} /></label>
    </div>}
    {photo && <div className="wallpaper-position">
      <div className="studio-heading"><strong>图像位置</strong><button type="button" onClick={() => changeView({ x: 50, y: 50 })}><RotateCcw />居中</button></div>
      <label className="studio-range"><span>水平<output>{view.x}%</output></span><input type="range" aria-label="壁纸水平位置" min="0" max="100" value={view.x} onChange={(event) => changeView({ x: Number(event.target.value) })} /></label>
      <label className="studio-range"><span>垂直<output>{view.y}%</output></span><input type="range" aria-label="壁纸垂直位置" min="0" max="100" value={view.y} onChange={(event) => changeView({ y: Number(event.target.value) })} /></label>
    </div>}
    {uploadControl}
    <WallpaperPicker value={wallpaper} custom={Boolean(value.preferences.customBackground)} now={now} onChange={(next, apply) => onChange({ ...value, preferences: { ...value.preferences, wallpaper: next, ...(apply ? { scene: 'night', customBackground: '' } : {}) } })} />
    <div className="studio-actions"><span role="status">{dirty ? '预览中' : '当前外观'}</span><button type="button" className="quiet-button" disabled={!dirty} onClick={onCancel}><X />取消</button><button type="button" className="quiet-button" onClick={onInspect}><Eye />查看桌面</button><button type="button" className="primary-small-button" disabled={!dirty} onClick={onApply}><Check />应用</button></div>
  </div>;
}
