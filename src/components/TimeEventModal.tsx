import { useState, type FormEvent } from 'react';
import { CalendarClock, Plus, Trash2, X } from 'lucide-react';
import { isValidDateKey } from '../lib/timeEvents';
import type { DeskTimeEvent, DeskTimeEventType } from '../types';

type TimeEventInput = Omit<DeskTimeEvent, 'id'>;

interface TimeEventModalProps {
  event?: DeskTimeEvent;
  todayKey: string;
  onClose: () => void;
  onDelete: () => void;
  onSave: (value: TimeEventInput) => void;
}

export function TimeEventModal({ event, todayKey, onClose, onDelete, onSave }: TimeEventModalProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || todayKey);
  const [type, setType] = useState<DeskTimeEventType>(event?.type || 'elapsed');
  const [repeatYearly, setRepeatYearly] = useState(event?.repeatYearly || false);
  const [error, setError] = useState('');

  function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const cleanTitle = title.trim().replace(/\s+/g, ' ').slice(0, 24);
    if (!cleanTitle) return setError('请输入事件名称');
    if (!isValidDateKey(date)) return setError('请选择有效日期');
    setError('');
    onSave({ title: cleanTitle, date, type, repeatYearly: type === 'countdown' && repeatYearly });
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭时间事件" />
      <form className="shortcut-modal time-event-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="timeEventModalTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><CalendarClock /></span><div><h2 id="timeEventModalTitle">{event ? '编辑时间事件' : '添加时间事件'}</h2><p>累计重要时光，或查看目标还有多久</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <div className="form-grid">
          <label><span>类型</span><span className="segmented-control time-event-type" role="group" aria-label="时间事件类型"><button className={type === 'elapsed' ? 'active' : ''} type="button" aria-pressed={type === 'elapsed'} onClick={() => { setType('elapsed'); setRepeatYearly(false); }}>累计天数</button><button className={type === 'countdown' ? 'active' : ''} type="button" aria-pressed={type === 'countdown'} onClick={() => setType('countdown')}>目标倒计时</button></span></label>
          <label><span>事件名称 <small>{title.length}/24</small></span><input autoFocus value={title} maxLength={24} onChange={(inputEvent) => { setTitle(inputEvent.target.value); setError(''); }} placeholder={type === 'elapsed' ? '例如：加入团队已经' : '例如：项目上线还有'} required /></label>
          <label><span>{type === 'elapsed' ? '起始日期' : '目标日期'}</span><input type="date" value={date} onChange={(inputEvent) => { setDate(inputEvent.target.value); setError(''); }} required /></label>
          {type === 'countdown' && <label className="time-event-repeat"><input type="checkbox" checked={repeatYearly} onChange={(inputEvent) => setRepeatYearly(inputEvent.target.checked)} /><span><strong>每年重复</strong><small>适合生日、纪念日和节日</small></span></label>}
          <p className="time-event-hint">{type === 'elapsed' ? '从所选日期累计到今天；未来日期会先显示还有多少天。' : repeatYearly ? '按月日计算下一次，日期过去后自动顺延到下一年。' : '目标过去后会显示已经过去多少天。'}</p>
          {error && <p className="time-event-error" role="alert">{error}</p>}
        </div>
        <div className="modal-actions time-event-actions">
          {event && <button className="quiet-button time-event-delete" type="button" onClick={onDelete}><Trash2 />删除</button>}
          <span />
          <button className="quiet-button" type="button" onClick={onClose}>取消</button>
          <button className="primary-button" type="submit"><Plus />保存</button>
        </div>
      </form>
    </div>
  );
}
