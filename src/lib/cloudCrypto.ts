import type { DeskState } from '../types';

const FORMAT = 'wyandesk-e2ee-v1';
const ITERATIONS = 310_000;
const SESSION_KEY = 'wyandesk.sync.e2ee.passphrase.v1';
const AAD = new TextEncoder().encode('WyanDesk cloud state v1');

export interface EncryptedDeskState {
  format: typeof FORMAT;
  kdf: { name: 'PBKDF2-SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-256-GCM'; iv: string; data: string };
}

function bytesToBase64(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export function validateSyncPassphrase(value: string): string {
  const passphrase = value.trim();
  if (passphrase.length < 10) throw new Error('同步密码至少 10 个字符');
  if (passphrase.length > 200) throw new Error('同步密码不能超过 200 个字符');
  return passphrase;
}

export function isEncryptedDeskState(value: unknown): value is EncryptedDeskState {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<EncryptedDeskState>;
  return item.format === FORMAT
    && item.kdf?.name === 'PBKDF2-SHA-256'
    && item.cipher?.name === 'AES-256-GCM'
    && typeof item.kdf.salt === 'string'
    && typeof item.kdf.iterations === 'number'
    && typeof item.cipher.iv === 'string'
    && typeof item.cipher.data === 'string';
}

export async function encryptDeskState(state: DeskState, rawPassphrase: string): Promise<EncryptedDeskState> {
  const passphrase = validateSyncPassphrase(rawPassphrase);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(state));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: AAD as BufferSource }, key, plaintext);
  return {
    format: FORMAT,
    kdf: { name: 'PBKDF2-SHA-256', iterations: ITERATIONS, salt: bytesToBase64(salt) },
    cipher: { name: 'AES-256-GCM', iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(encrypted)) },
  };
}

export async function decryptDeskState(value: EncryptedDeskState, rawPassphrase: string): Promise<DeskState> {
  const passphrase = validateSyncPassphrase(rawPassphrase);
  if (value.kdf.iterations < 100_000 || value.kdf.iterations > 1_000_000) throw new Error('云端加密参数无效');
  try {
    const salt = base64ToBytes(value.kdf.salt);
    const iv = base64ToBytes(value.cipher.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error('invalid parameters');
    const key = await deriveKey(passphrase, salt, value.kdf.iterations);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: AAD as BufferSource }, key, base64ToBytes(value.cipher.data) as BufferSource);
    return JSON.parse(new TextDecoder().decode(plaintext)) as DeskState;
  } catch {
    throw new Error('同步密码错误或云端数据已损坏');
  }
}

export function readSessionPassphrase(): string {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

export function rememberSessionPassphrase(passphrase: string): void {
  try {
    if (passphrase) window.sessionStorage.setItem(SESSION_KEY, passphrase);
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Session-only key retention is optional; users can enter it again.
  }
}
