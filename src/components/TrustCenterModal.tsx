import { useEffect, useState, type FormEvent } from 'react';
import { Check, FileText, LogIn, MessageSquareText, Send, ShieldCheck, X } from 'lucide-react';

export type TrustPanel = 'privacy' | 'terms' | 'feedback';

interface TrustCenterModalProps {
  initialPanel: TrustPanel;
  version: string;
  signedIn: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSubmitFeedback: (message: string) => Promise<void>;
}

export function TrustCenterModal({ initialPanel, version, signedIn, onClose, onLogin, onSubmitFeedback }: TrustCenterModalProps) {
  const [panel, setPanel] = useState(initialPanel);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => setError(''), [panel]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = message.trim();
    setError('');
    if (!signedIn) {
      setError('登录后才能提交反馈');
      return;
    }
    if (value.length < 10 || value.length > 2000) {
      setError('请填写 10–2000 个字的问题描述');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitFeedback(value);
      setSubmitted(true);
      setMessage('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '反馈提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  const heading = panel === 'privacy' ? '隐私说明' : panel === 'terms' ? '用户协议' : '反馈问题';
  const icon = panel === 'privacy' ? <ShieldCheck /> : panel === 'terms' ? <FileText /> : <MessageSquareText />;

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭关于与支持" />
      <section className="shortcut-modal trust-modal" role="dialog" aria-modal="true" aria-labelledby="trustCenterTitle">
        <div className="modal-heading">
          <div><span className="modal-icon">{icon}</span><div><h2 id="trustCenterTitle">{heading}</h2><p>微言桌面 WyanDesk · v{version}</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <div className="trust-tabs" role="tablist" aria-label="关于与支持">
          <button className={panel === 'privacy' ? 'active' : ''} type="button" role="tab" aria-selected={panel === 'privacy'} onClick={() => setPanel('privacy')}>隐私说明</button>
          <button className={panel === 'terms' ? 'active' : ''} type="button" role="tab" aria-selected={panel === 'terms'} onClick={() => setPanel('terms')}>用户协议</button>
          <button className={panel === 'feedback' ? 'active' : ''} type="button" role="tab" aria-selected={panel === 'feedback'} onClick={() => setPanel('feedback')}>反馈问题</button>
        </div>

        {panel === 'privacy' && (
          <div className="trust-copy" role="tabpanel">
            <p><strong>默认保存在本机</strong><span>网站、任务、便签、日程与设置默认只保存在当前浏览器。清理浏览器数据前建议先导出备份。</span></p>
            <p><strong>锁屏活动记录</strong><span>开启后仅在锁屏期间记录当前页面内的操作类型、时间和次数，不保存具体按键、输入内容、鼠标位置或其他应用信息；记录仅存在当前浏览器且可随时清空。</span></p>
            <p><strong>登录后才同步</strong><span>登录并开启同步后，桌面数据会通过微言账号服务保存到云端，用于跨设备恢复；你可以随时自助删除云端桌面与历史版本。</span></p>
            <p><strong>权限按需申请</strong><span>系统通知、浏览器书签和标签页权限只在你主动使用相应功能时申请。当前版本不接入广告或第三方行为统计。</span></p>
            <p><strong>反馈内容</strong><span>提交反馈时仅保存登录账号标识、问题描述和应用版本，不会自动附带你的桌面内容。</span></p>
            <small>生效日期：2026 年 10 月 7 日</small>
          </div>
        )}

        {panel === 'terms' && (
          <div className="trust-copy" role="tabpanel">
            <p><strong>服务范围</strong><span>微言桌面用于个人网址整理、任务记录与轻量效率管理。请勿利用本服务保存或传播违法、有害或侵害他人权益的内容。</span></p>
            <p><strong>数据与备份</strong><span>本地数据由浏览器环境保存；未同步或未导出的内容可能因设备、浏览器清理而丢失。重要内容请定期导出备份。</span></p>
            <p><strong>账号与云端</strong><span>云端功能使用微言统一账号。你应妥善保护账号，并对账号下的操作负责；删除云端桌面后历史版本无法恢复。</span></p>
            <p><strong>服务调整</strong><span>我们会尽力保持服务稳定，并可能为安全、兼容或产品改进调整功能。重大变化会在产品中说明。</span></p>
            <small>使用本服务即表示你理解并同意以上约定。生效日期：2026 年 10 月 6 日</small>
          </div>
        )}

        {panel === 'feedback' && (
          <form className="feedback-form" onSubmit={submit} role="tabpanel">
            {submitted ? (
              <div className="feedback-success"><Check /><span><strong>反馈已提交</strong><small>感谢你的说明，我们会用它改进微言桌面。</small></span></div>
            ) : (
              <>
                <label><span>问题描述</span><textarea autoFocus value={message} onChange={(event) => setMessage(event.target.value.slice(0, 2000))} maxLength={2000} placeholder="请写清出现的位置、操作步骤和你看到的结果…" /></label>
                <div className="feedback-meta"><span>{message.trim().length} / 2000</span><span>不会自动附带桌面数据</span></div>
                {error && <p className="form-error" role="alert">{error}</p>}
                {!signedIn && <div className="feedback-login"><span>登录后可直接提交并关联你的账号</span><button type="button" onClick={onLogin}><LogIn />登录</button></div>}
                <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>取消</button><button className="primary-button" type="submit" disabled={submitting || message.trim().length < 10}><Send />{submitting ? '提交中…' : '提交反馈'}</button></div>
              </>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
