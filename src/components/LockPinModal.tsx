import { useEffect, useRef, useState, type FormEvent } from 'react';
import { KeyRound, LockKeyhole, X } from 'lucide-react';
import { clearLockPin, saveLockPin, validLockPin, verifyLockPin } from '../lib/lockPin';

export type LockPinMode = 'create' | 'change' | 'disable';

interface LockPinModalProps {
  mode: LockPinMode;
  onClose: () => void;
  onChanged: (enabled: boolean) => void;
}

function digits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8);
}

export function LockPinModal({ mode, onClose, onChanged }: LockPinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [nextPin, setNextPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => firstInputRef.current?.focus(), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (mode !== 'create' && !await verifyLockPin(currentPin)) {
      setError('当前密码不正确');
      return;
    }
    if (mode === 'disable') {
      clearLockPin();
      onChanged(false);
      return;
    }
    if (!validLockPin(nextPin)) {
      setError('请输入 4–8 位数字密码');
      return;
    }
    if (nextPin !== confirmPin) {
      setError('两次输入的密码不一致');
      return;
    }
    setSaving(true);
    try {
      await saveLockPin(nextPin);
      onChanged(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '密码保存失败');
    } finally {
      setSaving(false);
    }
  }

  const title = mode === 'create' ? '设置解锁密码' : mode === 'change' ? '修改解锁密码' : '关闭解锁密码';

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭解锁密码设置" />
      <section className="shortcut-modal pin-modal" role="dialog" aria-modal="true" aria-labelledby="lockPinTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><KeyRound /></span><div><h2 id="lockPinTitle">{title}</h2><p>只保存在当前浏览器</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <form className="pin-form" onSubmit={submit}>
          {mode !== 'create' && (
            <label><span>当前密码</span><input ref={firstInputRef} type="password" inputMode="numeric" autoComplete="current-password" value={currentPin} onChange={(event) => setCurrentPin(digits(event.target.value))} maxLength={8} /></label>
          )}
          {mode !== 'disable' && (
            <>
              <label><span>{mode === 'create' ? '解锁密码' : '新密码'}</span><input ref={mode === 'create' ? firstInputRef : undefined} type="password" inputMode="numeric" autoComplete="new-password" value={nextPin} onChange={(event) => setNextPin(digits(event.target.value))} maxLength={8} placeholder="4–8 位数字" /></label>
              <label><span>再次输入</span><input type="password" inputMode="numeric" autoComplete="new-password" value={confirmPin} onChange={(event) => setConfirmPin(digits(event.target.value))} maxLength={8} /></label>
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="pin-note"><LockKeyhole />这是网页隐私保护，不会加密桌面数据，也不能替代系统锁屏。</p>
          <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>取消</button><button className={`primary-button${mode === 'disable' ? ' pin-danger' : ''}`} type="submit" disabled={saving}>{saving ? '保存中…' : mode === 'disable' ? '确认关闭' : '保存'}</button></div>
        </form>
      </section>
    </div>
  );
}
