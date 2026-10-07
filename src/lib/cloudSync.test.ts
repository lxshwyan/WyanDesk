import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSyncMetadata,
  deleteCloudState,
  readSyncMetadata,
  readSyncPausedUserId,
  submitCloudFeedback,
  writeSyncMetadata,
  writeSyncPausedUserId,
} from './cloudSync';

describe('cloud sync account controls', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('deletes cloud data with an explicit confirmation payload', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{"deleted":true}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', request);

    await deleteCloudState();

    expect(request).toHaveBeenCalledWith('/api/desk/state', expect.objectContaining({
      method: 'DELETE',
      credentials: 'include',
      body: JSON.stringify({ confirmation: 'DELETE_CLOUD_DATA' }),
    }));
  });

  it('submits only the written feedback and app version', async () => {
    const request = vi.fn().mockResolvedValue(new Response('{"submitted":true}', { status: 201, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', request);

    await submitCloudFeedback('分类管理在手机上无法保存。', '0.2.0');

    expect(request).toHaveBeenCalledWith('/api/desk/feedback', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: '分类管理在手机上无法保存。', appVersion: '0.2.0' }),
    }));
  });

  it('persists a paused user separately from sync metadata', () => {
    writeSyncMetadata({ userId: 'user-1', version: 4, fingerprint: 'hash' });
    writeSyncPausedUserId('user-1');
    clearSyncMetadata();

    expect(readSyncMetadata()).toBeNull();
    expect(readSyncPausedUserId()).toBe('user-1');
    writeSyncPausedUserId(null);
    expect(readSyncPausedUserId()).toBeNull();
  });
});
