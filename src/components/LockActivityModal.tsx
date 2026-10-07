import { EyeOff, Keyboard, Maximize2, MousePointer2, ShieldAlert, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { countLockActivity, type LockActivityEntry, type LockActivityKind } from '../lib/lockActivity';

interface LockActivityModalProps {
  mode: 'report' | 'history';
  entries: LockActivityEntry[];
  sessionId?: string;
  onClose: () => void;
  onClear: () => void;
  onShowHistory?: () => void;
}

const activityLabels: Record<LockActivityKind, { title: string; description: string }> = {
  pointer: { title: '鼠标或触控操作', description: '锁屏背景区域检测到指针操作' },
  keyboard: { title: '键盘操作', description: '锁屏页面检测到非解锁按键' },
  'context-switch': { title: '页面离开当前视图', description: '标签页切换、浏览器失焦或转入后台' },
  'fullscreen-exit': { title: '退出全屏', description: '全屏锁屏被退出并返回桌面' },
  'failed-unlock': { title: '解锁密码失败', description: '本地密码验证未通过' },
};

const activityIcons: Record<LockActivityKind, typeof ShieldAlert> = {
  pointer: MousePointer2,
  keyboard: Keyboard,
  'context-switch': EyeOff,
  'fullscreen-exit': Maximize2,
  'failed-unlock': ShieldAlert,
};

function formatActivityTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function LockActivityModal({ mode, entries, sessionId, onClose, onClear, onShowHistory }: LockActivityModalProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const visibleEntries = useMemo(() => {
    const scoped = mode === 'report' && sessionId ? entries.filter((entry) => entry.sessionId === sessionId) : entries;
    return [...scoped].reverse();
  }, [entries, mode, sessionId]);
  const activityCount = countLockActivity(visibleEntries);

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭锁屏活动记录" />
      <section className="shortcut-modal lock-activity-modal" role="dialog" aria-modal="true" aria-labelledby="lockActivityTitle">
        <div className="modal-heading">
          <div><span className={`modal-icon${mode === 'report' ? ' warning' : ''}`}><ShieldAlert /></span><div><h2 id="lockActivityTitle">{mode === 'report' ? '锁屏期间检测到活动' : '锁屏活动记录'}</h2><p>{mode === 'report' ? `本次共 ${activityCount} 次，仅记录类型和时间` : '只保存在当前浏览器，最多 80 条'}</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <div className="lock-activity-summary">
          <ShieldAlert />
          <span><strong>{activityCount ? `${activityCount} 次活动` : '暂无锁屏活动'}</strong><small>不会记录按键内容、鼠标位置、浏览网页或其他应用</small></span>
        </div>

        <div className="lock-activity-list">
          {visibleEntries.map((entry) => {
            const Icon = activityIcons[entry.kind];
            const label = activityLabels[entry.kind];
            return (
              <div className="lock-activity-row" key={entry.id}>
                <span className={`lock-activity-icon ${entry.kind}`}><Icon /></span>
                <span><strong>{label.title}</strong><small>{label.description}</small></span>
                <span><time dateTime={entry.lastAt}>{formatActivityTime(entry.lastAt)}</time>{entry.count > 1 && <b>{entry.count} 次</b>}</span>
              </div>
            );
          })}
          {!visibleEntries.length && <div className="manager-empty">锁屏期间没有检测到额外活动</div>}
        </div>

        <div className="modal-actions lock-activity-actions">
          {mode === 'history' && entries.length > 0 && !confirmingClear && <button className="quiet-button lock-log-clear" type="button" onClick={() => setConfirmingClear(true)}><Trash2 />清空记录</button>}
          {mode === 'history' && confirmingClear && <span className="lock-clear-confirm"><span>清空全部本地记录？</span><button type="button" onClick={() => setConfirmingClear(false)}>取消</button><button type="button" onClick={() => { onClear(); setConfirmingClear(false); }}>确认清空</button></span>}
          {mode === 'report' && onShowHistory && <button className="quiet-button" type="button" onClick={onShowHistory}>查看全部</button>}
          <button className="primary-button" type="button" onClick={onClose}>知道了</button>
        </div>
      </section>
    </div>
  );
}
