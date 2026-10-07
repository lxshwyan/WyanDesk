import { Command, Keyboard, Search, X } from 'lucide-react';

interface KeyboardHelpModalProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: ['⌘', 'K'], windows: 'Ctrl K', label: '打开命令中心' },
  { keys: ['/'], windows: '/', label: '聚焦网站搜索' },
  { keys: ['?'], windows: '?', label: '查看快捷键' },
  { keys: ['Esc'], windows: 'Esc', label: '关闭当前弹层' },
  { keys: ['↑', '↓', '↵'], windows: '↑ ↓ Enter', label: '选择并执行命令' },
];

export function KeyboardHelpModal({ onClose }: KeyboardHelpModalProps) {
  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭快捷键帮助" />
      <section className="shortcut-modal keyboard-help-modal" role="dialog" aria-modal="true" aria-labelledby="keyboardHelpTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Keyboard /></span><div><h2 id="keyboardHelpTitle">键盘快捷操作</h2><p>常用入口，不需要全部记住</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <div className="keyboard-help-list">
          {shortcuts.map((item) => (
            <div className="keyboard-help-row" key={item.label}>
              <span className="keyboard-help-label">{item.label}</span>
              <span className="keyboard-help-keys" aria-label={item.windows}>
                {item.keys.map((key, index) => <kbd key={`${key}-${index}`}>{key}</kbd>)}
              </span>
            </div>
          ))}
        </div>
        <div className="keyboard-help-tip"><Command /><span>命令中心还支持：<strong>任务 内容</strong>、<strong>g 关键词</strong>、<strong>fy 文本</strong></span><Search /></div>
      </section>
    </div>
  );
}
