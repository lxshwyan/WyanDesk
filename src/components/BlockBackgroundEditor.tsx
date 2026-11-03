import { useState, type ChangeEvent } from 'react';
import { Check, ImagePlus, RotateCcw, X } from 'lucide-react';
import type { BlockBackground } from '../types';
import { blockBackgroundStyle, blockGradientPresets, readBlockImage } from '../lib/blockBackground';
import { ManagedLayer } from './ManagedLayer';
import './blockBackground.css';

export function BlockBackgroundEditor({ targets, initialTarget, getBackground, onSave, onClose, onRecommend }: {
  targets: { value: string; label: string }[];
  initialTarget: string;
  getBackground: (target: string) => BlockBackground | undefined;
  onSave: (target: string, background?: BlockBackground) => string | undefined;
  onClose: () => void;
  onRecommend: () => void;
}) {
  const [target, setTarget] = useState(initialTarget);
  const [draft, setDraft] = useState<BlockBackground | undefined>(() => getBackground(initialTarget));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { const image = await readBlockImage(file); setDraft({ image }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '图片读取失败，请重试'); }
    finally { setBusy(false); }
  }
  return <ManagedLayer className="modal-layer" onEscape={onClose}>
    <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭背景设置" />
    <form className="block-background-editor" role="dialog" aria-modal="true" aria-labelledby="blockBackgroundTitle" onSubmit={(event) => { event.preventDefault(); const message = onSave(target, draft); if (message) setError(message); else onClose(); }}>
      <div className="modal-heading"><h2 id="blockBackgroundTitle">分组与组件背景</h2><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button></div>
      <label className="block-target-label">选择区块<select aria-label="选择背景区块" value={target} disabled={busy} onChange={(event) => { setTarget(event.target.value); setDraft(getBackground(event.target.value)); setError(''); }}>{targets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <div className={`block-background-preview${draft ? ' has-block-background' : ''}`} style={blockBackgroundStyle(draft)}><strong>{targets.find((item) => item.value === target)?.label}</strong><span>预览</span></div>
      <div className="block-gradient-options" role="group" aria-label="渐变配色">{blockGradientPresets.map((preset) => <button type="button" key={preset.id} disabled={busy} style={{ background: preset.fill }} className={draft?.gradient === preset.id ? 'active' : ''} aria-pressed={draft?.gradient === preset.id} onClick={() => setDraft({ gradient: preset.id })}>{preset.label}{draft?.gradient === preset.id && <Check aria-hidden="true" />}</button>)}</div>
      <div className="block-color-options" role="group" aria-label="背景颜色">
        {['#e1ecff', '#e0f2e9', '#fff1d6', '#f4e5f5', '#e1f2f5', '#eeeef2'].map((color) => <button key={color} type="button" disabled={busy} className={draft?.color === color ? 'active' : ''} aria-label={`选择背景颜色 ${color}`} aria-pressed={draft?.color === color} style={{ background: color }} onClick={() => setDraft({ color })}>{draft?.color === color && <Check />}</button>)}
        <label className="block-custom-color" title="自选颜色"><input aria-label="自选背景颜色" type="color" disabled={busy} value={draft?.color || '#e1ecff'} onChange={(event) => setDraft({ color: event.target.value })} /></label>
      </div>
      <div className="block-image-actions"><label className="quiet-button"><ImagePlus /><span>{busy ? '正在处理图片…' : '上传背景图片'}</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={upload} /></label>{draft?.image && <button className="quiet-button" type="button" disabled={busy} onClick={() => setDraft((current) => current?.color ? { color: current.color } : undefined)}>移除图片</button>}</div>
      {error && <p className="block-background-error" role="alert">{error}</p>}
      <div className="modal-actions"><button className="quiet-button" type="button" disabled={busy} onClick={() => { setDraft(undefined); setError(''); }}><RotateCcw />恢复默认</button><button className="primary-button" type="submit" disabled={busy}><Check />保存</button></div>
      <button className="block-recommend-button" type="button" disabled={busy} onClick={onRecommend}>所有组件用推荐配色</button>
    </form>
  </ManagedLayer>;
}
