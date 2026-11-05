import { BookMarked, Check, Download, Layers3, LayoutGrid, Sparkles, X } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { ManagedLayer } from './ManagedLayer';
import { DesktopModePicker } from './DesktopModePicker';
import type { DesktopMode } from '../lib/desktopMode';

export type DeskTemplate = 'balanced' | 'simple' | 'blank';

interface OnboardingModalProps {
  extensionInstalled: boolean;
  mode: DesktopMode;
  allowTemplates: boolean;
  onMode: (mode: DesktopMode) => void;
  onComplete: () => void;
  onImportBookmarks: (event: ChangeEvent<HTMLInputElement>) => void;
  onTemplate: (template: DeskTemplate) => void;
}

export function OnboardingModal({ extensionInstalled, mode, allowTemplates, onMode, onComplete, onImportBookmarks, onTemplate }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<DeskTemplate>('simple');

  function chooseTemplate(value: DeskTemplate) {
    setTemplate(value);
    onTemplate(value);
  }

  return (
    <ManagedLayer className="modal-layer onboarding-layer" onEscape={onComplete}>
      <section className="shortcut-modal onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><LayoutGrid /></span><div><h2 id="onboardingTitle">{step === 0 ? '选一个适合你的桌面' : step === 1 ? '带入已有书签' : '设为浏览器新标签页'}</h2><p>{step === 0 ? '无需登录即可使用，之后也能切换' : step === 1 ? '只添加内容，保留现有网站' : '按需安装，网页版现在就能用'}</p></div></div>
          <button className="icon-button" type="button" onClick={onComplete} aria-label="跳过首次引导"><X /></button>
        </div>

        {step === 0 && (
          <div className="onboarding-start">
            <DesktopModePicker value={mode} onChange={onMode} />
            {allowTemplates && <details className="onboarding-more"><summary>更多起点</summary>
            <div className="template-grid">
              <button className={template === 'simple' ? 'active' : ''} type="button" onClick={() => chooseTemplate('simple')}><LayoutGrid /><span><strong>常用单桌面</strong><small>推荐，三组常用网站与日常工具</small></span>{template === 'simple' && <Check />}</button>
              <button className={template === 'balanced' ? 'active' : ''} type="button" onClick={() => chooseTemplate('balanced')}><Layers3 /><span><strong>工作 · 学习 · 生活</strong><small>按场景预置三个桌面</small></span>{template === 'balanced' && <Check />}</button>
              <button className={template === 'blank' ? 'active' : ''} type="button" onClick={() => chooseTemplate('blank')}><Sparkles /><span><strong>空白开始</strong><small>从自己的分类和网站开始</small></span>{template === 'blank' && <Check />}</button>
            </div>
            </details>}
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-import">
            <BookMarked />
            <strong>迁移浏览器书签</strong>
            <p>这里可导入 Chrome、Edge、Firefox 的书签 HTML；安装扩展后还能一键直连书签，无需中转文件。</p>
            <label><input type="file" accept="text/html,.html,.htm" onChange={onImportBookmarks} /><BookMarked />选择书签文件</label>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-extension">
            <span>{extensionInstalled ? <Check /> : <Download />}</span>
            <strong>{extensionInstalled ? '扩展已安装，准备完成' : '安装 WyanDesk 新标签页扩展'}</strong>
            <p>{extensionInstalled ? '以后打开新标签页就能回到微言桌面，并可通过扩展按钮收藏网页、保存窗口或直接迁移浏览器书签。' : '打开新标签页就是微言桌面，还能收藏网页、保存窗口，并在扩展按钮里一键导入或导出浏览器书签。'}</p>
            {!extensionInstalled && <a href="/downloads/wyandesk-extension.zip" download><Download />下载测试版 ZIP</a>}
            <small>安装与更新步骤在桌面设置首页查看。</small>
          </div>
        )}

        <div className="onboarding-actions">
          <button className="quiet-button" type="button" onClick={() => setStep((value) => value === 0 ? 1 : value === 1 ? 2 : 0)}>{step === 0 ? '导入与安装' : step === 1 ? '查看安装方法' : '返回选择'}</button>
          <button className="primary-button" type="button" onClick={onComplete}><Check />开始使用</button>
        </div>
      </section>
    </ManagedLayer>
  );
}
