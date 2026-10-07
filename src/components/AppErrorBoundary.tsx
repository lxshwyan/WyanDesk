import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  failed: boolean;
}

const STORAGE_KEY = 'wyandesk.state.v1';

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WyanDesk failed to render', error, info);
  }

  downloadLocalData = () => {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
    link.download = `WyanDesk-emergency-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const hasLocalData = Boolean(window.localStorage.getItem(STORAGE_KEY));
    return (
      <main className="fatal-screen">
        <section className="fatal-card" role="alert">
          <span className="fatal-brand">W</span>
          <h1>桌面暂时没有正常加载</h1>
          <p>本地数据仍保存在当前浏览器。可以先下载应急备份，再重新加载页面。</p>
          <div>
            {hasLocalData && <button className="quiet-button" type="button" onClick={this.downloadLocalData}>下载本地数据</button>}
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>重新加载</button>
          </div>
        </section>
      </main>
    );
  }
}
