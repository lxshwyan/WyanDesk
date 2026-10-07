import { BookMarked, Check, Download, Layers3, LayoutGrid, SkipForward, Sparkles, X } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';

export type DeskTemplate = 'balanced' | 'simple' | 'blank';

interface OnboardingModalProps {
  extensionInstalled: boolean;
  onComplete: () => void;
  onImportBookmarks: (event: ChangeEvent<HTMLInputElement>) => void;
  onTemplate: (template: DeskTemplate) => void;
}

export function OnboardingModal({ extensionInstalled, onComplete, onImportBookmarks, onTemplate }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<DeskTemplate>('balanced');

  function chooseTemplate(value: DeskTemplate) {
    setTemplate(value);
    onTemplate(value);
  }

  return (
    <div className="modal-layer onboarding-layer" role="presentation">
      <section className="shortcut-modal onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
        <div className="onboarding-progress" aria-label={`第 ${step + 1} 步，共 3 步`}><i className={step >= 0 ? 'active' : ''} /><i className={step >= 1 ? 'active' : ''} /><i className={step >= 2 ? 'active' : ''} /></div>
        <div className="modal-heading">
          <div><span className="modal-icon"><Sparkles /></span><div><h2 id="onboardingTitle">{step === 0 ? '选择你的桌面起点' : step === 1 ? '带入已有书签' : '让桌面每天自然出现'}</h2><p>{step === 0 ? '之后随时可以调整' : step === 1 ? '可跳过，不会覆盖现有内容' : '最后一步，也可以稍后完成'}</p></div></div>
          <button className="icon-button" type="button" onClick={onComplete} aria-label="跳过首次引导"><X /></button>
        </div>

        {step === 0 && (
          <div className="template-grid">
            <button className={template === 'balanced' ? 'active' : ''} type="button" onClick={() => chooseTemplate('balanced')}><Layers3 /><span><strong>工作 · 学习 · 生活</strong><small>推荐，常用网站已经分类</small></span>{template === 'balanced' && <Check />}</button>
            <button className={template === 'simple' ? 'active' : ''} type="button" onClick={() => chooseTemplate('simple')}><LayoutGrid /><span><strong>简洁单桌面</strong><small>只保留一个工作桌面</small></span>{template === 'simple' && <Check />}</button>
            <button className={template === 'blank' ? 'active' : ''} type="button" onClick={() => chooseTemplate('blank')}><Sparkles /><span><strong>空白开始</strong><small>从自己的分类和网站开始</small></span>{template === 'blank' && <Check />}</button>
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
            {!extensionInstalled && <a href="/downloads/wyandesk-extension.zip" download><Download />下载 Chrome / Edge 扩展包</a>}
            <small>{extensionInstalled ? '你仍然可以在设置里管理同步、备份和桌面数据。' : '解压后在扩展管理页选择“加载已解压的扩展程序”。安装时由浏览器再次确认。'}</small>
            <div className="onboarding-products">桌面里的“微言服务”分类可按需打开表单、工具箱、活动与收集箱，不会主动弹出推广。</div>
          </div>
        )}

        <div className="onboarding-actions">
          <button className="quiet-button" type="button" onClick={onComplete}><SkipForward />跳过引导</button>
          <div>{step > 0 && <button className="quiet-button" type="button" onClick={() => setStep((value) => value - 1)}>上一步</button>}<button className="primary-button" type="button" onClick={() => step === 2 ? onComplete() : setStep((value) => value + 1)}>{step === 2 ? <><Check />开始使用</> : '下一步'}</button></div>
        </div>
      </section>
    </div>
  );
}
