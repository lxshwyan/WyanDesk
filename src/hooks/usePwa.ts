import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isExtensionRuntime } from '../lib/extensionBridge';
import {
  detectPwaEnvironment,
  resolvePwaInstallMode,
  shouldCheckForPwaUpdate,
  type BeforeInstallPromptEvent,
  type PwaInstallMode,
} from '../lib/pwa';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export interface PwaController {
  installMode: PwaInstallMode;
  online: boolean;
  offlineReady: boolean;
  registrationError: boolean;
  updateAvailable: boolean;
  updateBusy: boolean;
  updateNoticeVisible: boolean;
  requestInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  applyUpdate: () => void;
  dismissUpdateNotice: () => void;
}

function currentEnvironment() {
  const nav = navigator as NavigatorWithStandalone;
  return detectPwaEnvironment({
    userAgent: nav.userAgent,
    platform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    displayModeStandalone: window.matchMedia('(display-mode: standalone)').matches,
    navigatorStandalone: nav.standalone,
    secureContext: window.isSecureContext,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    extensionRuntime: isExtensionRuntime(),
  });
}

export function usePwa(): PwaController {
  const [environment, setEnvironment] = useState(currentEnvironment);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registrationError, setRegistrationError] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateNoticeVisible, setUpdateNoticeVisible] = useState(false);
  const reloadForUpdateRef = useRef(false);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const refreshEnvironment = () => setEnvironment(currentEnvironment());
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      refreshEnvironment();
    };
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    displayMode.addEventListener?.('change', refreshEnvironment);

    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      displayMode.removeEventListener?.('change', refreshEnvironment);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || isExtensionRuntime() || !('serviceWorker' in navigator)) return undefined;
    let disposed = false;
    let registration: ServiceWorkerRegistration | null = null;
    let lastCheckedAt = 0;

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      const handleState = () => {
        if (disposed || worker.state !== 'installed') return;
        if (navigator.serviceWorker.controller) {
          setWaitingWorker(registration?.waiting || worker);
          setUpdateNoticeVisible(true);
        } else {
          setOfflineReady(true);
        }
      };
      worker.addEventListener('statechange', handleState);
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
        if (disposed) return;
        setRegistrationError(false);
        setOfflineReady(Boolean(navigator.serviceWorker.controller));
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
          setUpdateNoticeVisible(true);
        }
        watchInstallingWorker(registration.installing);
        registration.addEventListener('updatefound', () => watchInstallingWorker(registration?.installing || null));
        lastCheckedAt = Date.now();
      } catch {
        if (!disposed) setRegistrationError(true);
      }
    };

    const checkForUpdate = () => {
      const now = Date.now();
      if (!registration || document.visibilityState !== 'visible' || !navigator.onLine || !shouldCheckForPwaUpdate(lastCheckedAt, now)) return;
      lastCheckedAt = now;
      void registration.update().catch(() => setRegistrationError(true));
    };

    const handleControllerChange = () => {
      setOfflineReady(true);
      if (!reloadForUpdateRef.current) return;
      reloadForUpdateRef.current = false;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    if (document.readyState === 'complete') void register();
    else window.addEventListener('load', register, { once: true });

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      window.removeEventListener('load', register);
    };
  }, []);

  const requestInstall = useCallback(async () => {
    if (!installPrompt) return 'unavailable' as const;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome;
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker || updateBusy) return;
    setUpdateBusy(true);
    reloadForUpdateRef.current = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [updateBusy, waitingWorker]);

  return useMemo(() => ({
    installMode: resolvePwaInstallMode(environment, Boolean(installPrompt)),
    online,
    offlineReady,
    registrationError,
    updateAvailable: Boolean(waitingWorker),
    updateBusy,
    updateNoticeVisible: Boolean(waitingWorker) && updateNoticeVisible,
    requestInstall,
    applyUpdate,
    dismissUpdateNotice: () => setUpdateNoticeVisible(false),
  }), [applyUpdate, environment, installPrompt, offlineReady, online, registrationError, requestInstall, updateBusy, updateNoticeVisible, waitingWorker]);
}
