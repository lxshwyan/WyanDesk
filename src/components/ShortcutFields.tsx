import type { ReactNode } from 'react';
import { updateLinkURL } from '../lib/shortcutInput';

interface LinkDraft {
  title: string;
  url: string;
  icon: string;
  iconStyle?: 'auto' | 'text';
  accent: string;
}

interface Props<T extends LinkDraft> {
  value: T;
  editing: boolean;
  onChange: (value: T) => void;
  titleMaxLength?: number;
  children?: ReactNode;
}

export function ShortcutFields<T extends LinkDraft>({ value, editing, onChange, titleMaxLength = 50, children }: Props<T>) {
  return <div className="form-grid shortcut-fields">
    <label><span>网站地址</span><input autoFocus inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false} maxLength={2048} value={value.url} onChange={(event) => onChange(updateLinkURL(value, event.target.value, editing))} placeholder="粘贴网址，例如 example.com" required /></label>
    <label><span>网站名称</span><input maxLength={titleMaxLength} value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="自动填写，也可以修改" required /></label>
    {children}
    <details className="shortcut-appearance">
      <summary>图标设置</summary>
      <div className="form-grid">
        <label><span>图标样式</span><select value={value.iconStyle || 'auto'} onChange={(event) => onChange({ ...value, iconStyle: event.target.value === 'text' ? 'text' : 'auto' })}><option value="auto">网站图标</option><option value="text">自定义文字</option></select></label>
        <div className="split-fields"><label><span>图标文字</span><input maxLength={2} value={value.icon} onChange={(event) => onChange({ ...value, icon: event.target.value, iconStyle: 'text' })} placeholder="自动" /></label><label><span>图标颜色</span><input className="color-input" type="color" value={value.accent} onChange={(event) => onChange({ ...value, accent: event.target.value })} /></label></div>
      </div>
    </details>
  </div>;
}
