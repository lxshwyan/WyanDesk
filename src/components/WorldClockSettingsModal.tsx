import { useState } from 'react';
import { Check, Clock3, Globe2, X } from 'lucide-react';
import { worldClockOptions } from '../lib/worldClock';

interface WorldClockSettingsModalProps {
  selectedZoneIds: string[];
  onClose: () => void;
  onSave: (zoneIds: string[]) => void;
}

export function WorldClockSettingsModal({ selectedZoneIds, onClose, onSave }: WorldClockSettingsModalProps) {
  const [draft, setDraft] = useState(() => [...selectedZoneIds]);
  const atLimit = draft.length >= 5;

  function toggleZone(id: string) {
    setDraft((current) => {
      if (current.includes(id)) return current.length === 1 ? current : current.filter((zone) => zone !== id);
      return current.length >= 5 ? current : [...current, id];
    });
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭世界时钟设置" />
      <section className="shortcut-modal world-clock-settings-modal" role="dialog" aria-modal="true" aria-labelledby="worldClockSettingsTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Globe2 /></span><div><h2 id="worldClockSettingsTitle">世界时钟</h2><p>选择 1–5 个常用城市</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <div className="world-clock-zone-grid" aria-label="可选城市">
          {worldClockOptions.map((option) => {
            const selectedIndex = draft.indexOf(option.id);
            const selected = selectedIndex >= 0;
            return (
              <button
                key={option.id}
                className={selected ? 'selected' : ''}
                type="button"
                role="checkbox"
                aria-checked={selected}
                disabled={!selected && atLimit}
                onClick={() => toggleZone(option.id)}
              >
                <span className="world-clock-zone-icon">{selected ? selectedIndex + 1 : <Clock3 />}</span>
                <span><strong>{option.city}</strong><small>{option.region}</small></span>
                <Check aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <p className="settings-hint world-clock-hint">时间由浏览器本地计算，不请求定位或外部数据。选择顺序即为卡片展示顺序。</p>
        <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>取消</button><button className="primary-button" type="button" onClick={() => onSave(draft)}><Check />保存设置</button></div>
      </section>
    </div>
  );
}
