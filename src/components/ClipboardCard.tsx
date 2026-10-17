import { useState, type FormEvent } from 'react';
import { Clipboard, ClipboardPaste, Copy, Plus, Trash2 } from 'lucide-react';
import { addLocalClipboardItem, formatLocalClipboardTime, readLocalClipboardItems, writeLocalClipboardItems, type LocalClipboardItem } from '../lib/localClipboard';

interface ClipboardCardProps {
  now: Date;
  limit: number;
}

export function ClipboardCard({ now, limit }: ClipboardCardProps) {
  const [items, setItems] = useState(readLocalClipboardItems);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function persist(next: LocalClipboardItem[]) {
    setItems(next);
    try { writeLocalClipboardItems(next); } catch { setError('本机存储空间不足，无法保存更多内容'); }
  }

  function addText(text: string) {
    const next = addLocalClipboardItem(items, text);
    if (next === items) return setError('没有可保存的文本');
    persist(next);
    setDraft('');
    setError('');
    setStatus('已保存到本机剪贴板');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    addText(draft);
  }

  async function readClipboard() {
    setStatus('');
    setError('');
    if (!navigator.clipboard?.readText) return setError('浏览器不允许读取，请在输入框手动粘贴');
    try {
      addText(await navigator.clipboard.readText());
    } catch {
      setError('未获得剪贴板权限，请在输入框手动粘贴');
    }
  }

  async function copyItem(item: LocalClipboardItem) {
    setStatus('');
    setError('');
    if (!navigator.clipboard?.writeText) return setError('浏览器不允许复制，请手动选择文本');
    try {
      await navigator.clipboard.writeText(item.text);
      setStatus('已复制');
    } catch {
      setError('复制失败，请手动选择文本');
    }
  }

  function removeItem(id: string) {
    persist(items.filter((item) => item.id !== id));
    setStatus('已删除');
    setError('');
  }

  return (
    <section className="glass-panel clipboard-card">
      <div className="mini-heading">
        <span><Clipboard aria-hidden="true" />剪贴板</span>
        <small>仅本机</small>
      </div>
      <form className="clipboard-compose" onSubmit={submit}>
        <textarea value={draft} onChange={(event) => { setDraft(event.target.value); setError(''); setStatus(''); }} maxLength={2000} rows={2} placeholder="粘贴或输入要暂存的文本" aria-label="剪贴板文本" />
        <span>
          <button type="button" onClick={() => void readClipboard()}><ClipboardPaste aria-hidden="true" />读取</button>
          <button type="submit" disabled={!draft.trim()}><Plus aria-hidden="true" />保存</button>
        </span>
      </form>
      <div className="clipboard-list">
        {items.slice(0, limit).map((item) => (
          <div className="clipboard-row" key={item.id}>
            <button className="clipboard-copy" type="button" onClick={() => void copyItem(item)} title={item.text}>
              <span>{item.text}</span><small>{formatLocalClipboardTime(item.createdAt, now)}</small>
            </button>
            <button className="clipboard-delete" type="button" onClick={() => removeItem(item.id)} aria-label="删除这条剪贴板内容"><Trash2 aria-hidden="true" /></button>
          </div>
        ))}
        {!items.length && <div className="rail-empty">还没有本机剪贴内容</div>}
      </div>
      <div className="clipboard-footnote"><span>不会上传或云同步</span>{items.length > 0 && <button type="button" onClick={() => { persist([]); setStatus('已清空'); }}>清空</button>}</div>
      {status && <p className="widget-inline-status" role="status"><Copy aria-hidden="true" />{status}</p>}
      {error && <p className="widget-inline-error" role="alert">{error}</p>}
    </section>
  );
}
