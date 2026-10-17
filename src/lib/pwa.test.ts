import { describe, expect, it } from 'vitest';
import { detectPwaEnvironment, pwaInstallCopy, resolvePwaInstallMode, shouldCheckForPwaUpdate } from './pwa';

const baseInput = {
  userAgent: 'Mozilla/5.0 Chrome/140 Safari/537.36',
  platform: 'Linux armv8l',
  maxTouchPoints: 5,
  displayModeStandalone: false,
  navigatorStandalone: false,
  secureContext: true,
  serviceWorkerSupported: true,
  extensionRuntime: false,
};

describe('PWA environment', () => {
  it('treats standalone display mode as already installed', () => {
    const environment = detectPwaEnvironment({ ...baseInput, displayModeStandalone: true });
    expect(environment.installed).toBe(true);
    expect(resolvePwaInstallMode(environment, true)).toBe('installed');
  });

  it('offers the native prompt when Chromium provides it', () => {
    const environment = detectPwaEnvironment(baseInput);
    expect(resolvePwaInstallMode(environment, true)).toBe('prompt');
    expect(pwaInstallCopy('prompt').actionLabel).toBe('安装');
  });

  it('gives Safari add-to-home-screen steps on iPhone', () => {
    const environment = detectPwaEnvironment({
      ...baseInput,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
    });
    expect(environment.installBaseMode).toBe('ios-safari');
    expect(pwaInstallCopy('ios-safari').steps).toHaveLength(3);
  });

  it('directs non-Safari iOS browsers to Safari', () => {
    const environment = detectPwaEnvironment({
      ...baseInput,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/140.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
    });
    expect(environment.installBaseMode).toBe('ios-other');
  });

  it('does not expose web-app installation inside the extension', () => {
    const environment = detectPwaEnvironment({ ...baseInput, extensionRuntime: true });
    expect(resolvePwaInstallMode(environment, false)).toBe('unavailable');
  });

  it('throttles foreground update checks without a recurring timer', () => {
    expect(shouldCheckForPwaUpdate(1_000, 3_600_999)).toBe(false);
    expect(shouldCheckForPwaUpdate(1_000, 3_601_000)).toBe(true);
  });
});
