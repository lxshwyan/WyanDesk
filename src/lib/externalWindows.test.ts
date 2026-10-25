import { describe, expect, it, vi } from 'vitest';
import { openExternalURL, openExternalURLs, type ExternalWindowOpener } from './externalWindows';

function windowHandle(replace = vi.fn()) {
  return {
    opener: {} as unknown,
    location: { replace },
    close: vi.fn(),
  };
}

describe('external window helpers', () => {
  it('detaches the opener before navigating an accepted tab', () => {
    const handle = windowHandle();
    expect(openExternalURL('https://example.com', () => handle)).toBe(true);
    expect(handle.opener).toBeNull();
    expect(handle.location.replace).toHaveBeenCalledWith('https://example.com');
    expect(handle.close).not.toHaveBeenCalled();
  });

  it('reports the exact number of accepted and blocked tabs', () => {
    const first = windowHandle();
    const opener = vi.fn<ExternalWindowOpener>()
      .mockReturnValueOnce(first)
      .mockReturnValue(null);

    expect(openExternalURLs([
      'https://one.example',
      'https://two.example',
      'https://three.example',
    ], opener)).toEqual({ attempted: 3, opened: 1, blocked: 2 });
    expect(first.location.replace).toHaveBeenCalledWith('https://one.example');
  });

  it('closes a blank tab when navigation fails', () => {
    const handle = windowHandle(vi.fn(() => { throw new Error('navigation failed'); }));
    expect(openExternalURL('https://example.com', () => handle)).toBe(false);
    expect(handle.close).toHaveBeenCalledOnce();
  });
});
