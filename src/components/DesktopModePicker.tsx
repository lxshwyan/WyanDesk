import { Check } from 'lucide-react';
import type { DesktopMode } from '../lib/desktopMode';

const modes: { id: DesktopMode; title: string; description: string }[] = [
  { id: 'navigation', title: '轻导航', description: '搜索与常用网站' },
  { id: 'icons', title: '图标桌面', description: '小组件与分组图标' },
  { id: 'work', title: '卡片桌面', description: '网站、任务与便签' },
  { id: 'minimal', title: '极简模式', description: '时间与搜索' },
];

export function DesktopModePicker({ value, onChange }: { value: DesktopMode; onChange: (mode: DesktopMode) => void }) {
  return <div className="desktop-mode-picker" role="group" aria-label="桌面展示方式">
    {modes.map((mode) => <button type="button" key={mode.id} aria-pressed={value === mode.id} onClick={() => onChange(mode.id)}>
      <span className={`desktop-mode-preview preview-mode-${mode.id}`} aria-hidden="true"><i /><b /><em /><em /><em /></span>
      <span><strong>{mode.title}</strong><small>{mode.description}</small></span>{value === mode.id && <Check aria-hidden="true" />}
    </button>)}
  </div>;
}
