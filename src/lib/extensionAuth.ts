import { isExtensionRuntime } from './extensionBridge';

const AUTH_STORAGE_KEY = 'wyandesk.extension.auth.v1';
const AUTH_BASE_URL = 'https://wyanhub.com';

export interface ExtensionAuthUser {
  workspaceId: string;
  userId: string;
  userName: string;
}

interface ExtensionCredential {
  version: 1;
  accessToken: string;
  expiresAt: string;
  user: ExtensionAuthUser;
}

interface ChromeStorageArea {
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

interface ChromeIdentity {
  getRedirectURL: (path?: string) => string;
  launchWebAuthFlow: (details: { url: string; interactive?: boolean }) => Promise<string | undefined>;
}

interface ChromeAuthAPI {
  storage?: { local: ChromeStorageArea };
  identity?: ChromeIdentity;
}

function chromeAuthAPI(): ChromeAuthAPI | undefined {
  return (globalThis as unknown as { chrome?: ChromeAuthAPI }).chrome;
}

function validUser(value: unknown): value is ExtensionAuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<ExtensionAuthUser>;
  return typeof user.workspaceId === 'string' && user.workspaceId.length > 0
    && typeof user.userId === 'string' && user.userId.length > 0
    && typeof user.userName === 'string' && user.userName.length > 0;
}

function validCredential(value: unknown): value is ExtensionCredential {
  if (!value || typeof value !== 'object') return false;
  const credential = value as Partial<ExtensionCredential>;
  return credential.version === 1
    && typeof credential.accessToken === 'string'
    && credential.accessToken.startsWith('wyandesk_')
    && typeof credential.expiresAt === 'string'
    && Number.isFinite(Date.parse(credential.expiresAt))
    && validUser(credential.user);
}

function base64URL(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomValue(size = 32): string {
  return base64URL(crypto.getRandomValues(new Uint8Array(size)));
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64URL(new Uint8Array(digest));
}

export async function readExtensionCredential(): Promise<ExtensionCredential | null> {
  if (!isExtensionRuntime()) return null;
  const storage = chromeAuthAPI()?.storage?.local;
  if (!storage) return null;
  const stored = (await storage.get(AUTH_STORAGE_KEY))[AUTH_STORAGE_KEY];
  if (!validCredential(stored)) return null;
  if (Date.parse(stored.expiresAt) <= Date.now() + 60_000) {
    await storage.remove(AUTH_STORAGE_KEY);
    return null;
  }
  return stored;
}

export async function clearExtensionCredential(): Promise<void> {
  await chromeAuthAPI()?.storage?.local?.remove(AUTH_STORAGE_KEY);
}

export async function extensionAuthorizationHeader(): Promise<Record<string, string>> {
  const credential = await readExtensionCredential();
  return credential ? { Authorization: `Bearer ${credential.accessToken}` } : {};
}

export async function loginExtension(): Promise<ExtensionAuthUser> {
  const chromeAPI = chromeAuthAPI();
  if (!isExtensionRuntime() || !chromeAPI?.identity || !chromeAPI.storage?.local) {
    throw new Error('当前浏览器不支持扩展账号授权');
  }
  const redirectURI = chromeAPI.identity.getRedirectURL('wyandesk-sync');
  const state = randomValue();
  const verifier = randomValue();
  const challenge = await pkceChallenge(verifier);
  const authorizeURL = new URL('/api/desk-extension/authorize', AUTH_BASE_URL);
  authorizeURL.searchParams.set('redirect_uri', redirectURI);
  authorizeURL.searchParams.set('state', state);
  authorizeURL.searchParams.set('code_challenge', challenge);
  authorizeURL.searchParams.set('code_challenge_method', 'S256');
  let callbackValue: string | undefined;
  try {
    callbackValue = await chromeAPI.identity.launchWebAuthFlow({ url: authorizeURL.toString(), interactive: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message.toLowerCase() : '';
    if (message.includes('cancel') || message.includes('closed') || message.includes('approve')) throw new Error('登录已取消');
    throw new Error('无法打开登录授权，请检查网络后重试');
  }
  if (!callbackValue) throw new Error('登录已取消');
  const callback = new URL(callbackValue);
  const expected = new URL(redirectURI);
  if (callback.origin !== expected.origin || callback.pathname !== expected.pathname || callback.searchParams.get('state') !== state) {
    throw new Error('登录回调校验失败，请重试');
  }
  if (callback.searchParams.get('error') === 'access_denied') throw new Error('登录已取消');
  const code = callback.searchParams.get('code');
  if (!code) throw new Error('登录授权已失效，请重试');
  let response: Response;
  try {
    response = await fetch(`${AUTH_BASE_URL}/api/desk-extension/token`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code, verifier, redirectUri: redirectURI }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error('授权已返回，但未能连接登录服务，请检查网络后重试');
  }
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.status === 401 ? '登录授权已失效，请重试' : '暂时无法完成扩展登录');
  }
  const value = await response.json() as Partial<ExtensionCredential>;
  const credential: ExtensionCredential = { version: 1, accessToken: value.accessToken ?? '', expiresAt: value.expiresAt ?? '', user: value.user as ExtensionAuthUser };
  if (!validCredential(credential)) throw new Error('扩展登录响应无效');
  try {
    await chromeAPI.storage.local.set({ [AUTH_STORAGE_KEY]: credential });
  } catch {
    throw new Error('账号已授权，但未能保存登录状态，请重新加载扩展后重试');
  }
  return credential.user;
}

export async function logoutExtension(): Promise<void> {
  const credential = await readExtensionCredential();
  try {
    if (credential) {
      await fetch(`${AUTH_BASE_URL}/api/desk-extension/session`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${credential.accessToken}` },
      });
    }
  } finally {
    await clearExtensionCredential();
  }
}
