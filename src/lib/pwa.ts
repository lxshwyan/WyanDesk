export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type PwaInstallMode = 'installed' | 'prompt' | 'ios-safari' | 'ios-other' | 'browser' | 'unavailable';

export interface PwaEnvironmentInput {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
  secureContext: boolean;
  serviceWorkerSupported: boolean;
  extensionRuntime: boolean;
}

export interface PwaEnvironment {
  installed: boolean;
  ios: boolean;
  safari: boolean;
  installBaseMode: Exclude<PwaInstallMode, 'prompt'>;
}

export interface PwaInstallCopy {
  title: string;
  description: string;
  actionLabel?: string;
  steps?: string[];
}

export function detectPwaEnvironment(input: PwaEnvironmentInput): PwaEnvironment {
  const ios = /iPad|iPhone|iPod/i.test(input.userAgent)
    || (input.platform === 'MacIntel' && (input.maxTouchPoints || 0) > 1);
  const safari = /Safari/i.test(input.userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/i.test(input.userAgent);
  const installed = input.displayModeStandalone || Boolean(input.navigatorStandalone);

  let installBaseMode: PwaEnvironment['installBaseMode'];
  if (input.extensionRuntime) installBaseMode = 'unavailable';
  else if (installed) installBaseMode = 'installed';
  else if (ios && safari) installBaseMode = 'ios-safari';
  else if (ios) installBaseMode = 'ios-other';
  else if (input.secureContext && input.serviceWorkerSupported) installBaseMode = 'browser';
  else installBaseMode = 'unavailable';

  return { installed, ios, safari, installBaseMode };
}

export function resolvePwaInstallMode(environment: PwaEnvironment, promptAvailable: boolean): PwaInstallMode {
  if (environment.installed) return 'installed';
  if (promptAvailable && environment.installBaseMode !== 'unavailable') return 'prompt';
  return environment.installBaseMode;
}

export function pwaInstallCopy(mode: PwaInstallMode): PwaInstallCopy {
  if (mode === 'installed') {
    return { title: '已安装到桌面', description: '当前正以独立应用方式运行' };
  }
  if (mode === 'prompt') {
    return { title: '安装微言桌面', description: '独立窗口打开，任务与网页使用同一份数据', actionLabel: '安装' };
  }
  if (mode === 'ios-safari') {
    return {
      title: '添加到主屏幕',
      description: 'iPhone 与 iPad 需要从 Safari 手动添加',
      steps: ['点 Safari 底部的“分享”', '选择“添加到主屏幕”', '确认名称后点“添加”'],
    };
  }
  if (mode === 'ios-other') {
    return {
      title: '请使用 Safari 安装',
      description: '在 Safari 打开当前网址，再添加到主屏幕',
      steps: ['复制当前网址并用 Safari 打开', '点“分享”', '选择“添加到主屏幕”'],
    };
  }
  if (mode === 'browser') {
    return { title: '安装微言桌面', description: '可从浏览器菜单选择“安装应用”或“添加到主屏幕”' };
  }
  return { title: '网页版使用', description: '当前环境不支持安装，仍可正常使用本地桌面' };
}

export function shouldCheckForPwaUpdate(lastCheckedAt: number, now: number, minimumInterval = 60 * 60 * 1000): boolean {
  return now - lastCheckedAt >= minimumInterval;
}
