import type { DeskState } from '../types';
import { isExtensionRuntime } from './extensionBridge';
import { clearExtensionCredential, extensionAuthorizationHeader, logoutExtension } from './extensionAuth';

const SYNC_META_KEY = 'wyandesk.sync.meta.v1';
const CONFLICT_BACKUP_KEY = 'wyandesk.sync.conflict.backup.v1';
const SYNC_PAUSED_KEY = 'wyandesk.sync.paused.v1';
const EXTENSION_CLOUD_ORIGIN = 'https://desk.wyanhub.com';

export interface CloudUser {
  workspaceId: string;
  userId: string;
  userName: string;
}

export interface CloudEnvelope {
  state: unknown | null;
  version: number;
  updatedAt: string | null;
}

export interface CloudRevision {
  version: number;
  createdAt: string;
}

export interface SyncMetadata {
  userId: string;
  version: number;
  fingerprint: string;
}

export class CloudConflictError extends Error {
  current: CloudEnvelope;

  constructor(current: CloudEnvelope) {
    super('云端数据已经更新');
    this.current = current;
  }
}

function isJSON(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false;
}

export async function cloudFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const extension = isExtensionRuntime();
  const authorization = extension ? await extensionAuthorizationHeader() : {};
  const extensionHeaders = new Headers(init.headers);
  for (const [name, value] of Object.entries(authorization)) extensionHeaders.set(name, value);
  const response = await fetch(extension ? `${EXTENSION_CLOUD_ORIGIN}${path}` : path, {
    ...init,
    credentials: extension ? 'omit' : (init.credentials ?? 'include'),
    headers: extension ? extensionHeaders : init.headers,
  });
  if (extension && (response.status === 401 || response.status === 403 || (response.status >= 300 && response.status < 400))) {
    await clearExtensionCredential();
  }
  return response;
}

export async function fetchCloudUser(): Promise<CloudUser | null> {
  let response: Response;
  try {
    response = await cloudFetch('/api/desk/me', { redirect: 'manual', headers: { Accept: 'application/json' } });
  } catch {
    return null;
  }
  if (response.status === 0 || response.status === 401 || response.status === 403 || response.status === 404 || (response.status >= 300 && response.status < 400) || !isJSON(response)) return null;
  if (!response.ok) throw new Error('暂时无法连接同步服务');
  return response.json() as Promise<CloudUser>;
}

export async function logoutCloudSession(): Promise<void> {
  if (isExtensionRuntime()) {
    await logoutExtension();
    return;
  }
  const response = await cloudFetch('/api/auth/logout', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok || !isJSON(response)) throw new Error('退出失败，请稍后重试');
}

export async function fetchCloudState(): Promise<CloudEnvelope> {
  const response = await cloudFetch('/api/desk/state', { headers: { Accept: 'application/json' } });
  if (!response.ok || !isJSON(response)) throw new Error('暂时无法读取云端数据');
  return response.json() as Promise<CloudEnvelope>;
}

export async function putCloudState(state: unknown, baseVersion: number): Promise<CloudEnvelope> {
  const response = await cloudFetch('/api/desk/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ baseVersion, state }),
  });
  if (response.status === 409 && isJSON(response)) {
    const value = await response.json() as { current: CloudEnvelope };
    throw new CloudConflictError(value.current);
  }
  if (!response.ok || !isJSON(response)) throw new Error('云端保存失败，请稍后重试');
  return response.json() as Promise<CloudEnvelope>;
}

export async function deleteCloudState(): Promise<void> {
  const response = await cloudFetch('/api/desk/state', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ confirmation: 'DELETE_CLOUD_DATA' }),
  });
  if (!response.ok || !isJSON(response)) throw new Error('云端数据删除失败，请稍后重试');
}

export async function submitCloudFeedback(message: string, appVersion: string): Promise<void> {
  const body = JSON.stringify({ applicationId: 'desk', category: 'bug', message, appVersion });
  if (isExtensionRuntime()) {
    const response = await cloudFetch('/api/desk/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message, appVersion }),
    });
    if (!response.ok || !isJSON(response)) throw new Error('反馈提交失败，请稍后重试');
    return;
  }
  let response = await cloudFetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-WyanHub-User': '1' },
    body,
  });
  if (response.status === 404) {
    response = await cloudFetch('/api/desk/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ message, appVersion }),
    });
  }
  if (!response.ok || !isJSON(response)) throw new Error('反馈提交失败，请稍后重试');
}

export async function fetchCloudRevisions(): Promise<CloudRevision[]> {
  const response = await cloudFetch('/api/desk/revisions', { headers: { Accept: 'application/json' } });
  if (!response.ok || !isJSON(response)) throw new Error('暂时无法读取历史版本');
  const value = await response.json() as { items?: CloudRevision[] };
  return Array.isArray(value.items) ? value.items : [];
}

export async function fetchCloudRevision(version: number): Promise<CloudEnvelope> {
  const response = await cloudFetch(`/api/desk/revisions/${version}`, { headers: { Accept: 'application/json' } });
  if (!response.ok || !isJSON(response)) throw new Error('历史版本不存在');
  return response.json() as Promise<CloudEnvelope>;
}

export function stateFingerprint(state: DeskState): string {
  const value = JSON.stringify(state);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${value.length}-${(hash >>> 0).toString(16)}`;
}

export function readSyncMetadata(): SyncMetadata | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(SYNC_META_KEY) || 'null') as Partial<SyncMetadata> | null;
    if (!value || typeof value.userId !== 'string' || typeof value.version !== 'number' || typeof value.fingerprint !== 'string') return null;
    return value as SyncMetadata;
  } catch {
    return null;
  }
}

export function writeSyncMetadata(metadata: SyncMetadata): void {
  window.localStorage.setItem(SYNC_META_KEY, JSON.stringify(metadata));
}

export function clearSyncMetadata(): void {
  window.localStorage.removeItem(SYNC_META_KEY);
}

export function readSyncPausedUserId(): string | null {
  const value = window.localStorage.getItem(SYNC_PAUSED_KEY);
  return value && value.length <= 200 ? value : null;
}

export function writeSyncPausedUserId(userId: string | null): void {
  if (userId) window.localStorage.setItem(SYNC_PAUSED_KEY, userId);
  else window.localStorage.removeItem(SYNC_PAUSED_KEY);
}

export function backupSyncConflict(state: DeskState, source: 'local' | 'cloud'): void {
  window.localStorage.setItem(CONFLICT_BACKUP_KEY, JSON.stringify({ source, createdAt: new Date().toISOString(), state }));
}

export function cloudLoginURL(): string {
  const returnTo = window.location.protocol.startsWith('http') && (window.location.hostname === 'wyanhub.com' || window.location.hostname.endsWith('.wyanhub.com'))
    ? window.location.href
    : 'https://desk.wyanhub.com/';
  return `https://wyanhub.com/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}
