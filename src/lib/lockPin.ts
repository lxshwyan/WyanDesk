const LOCK_PIN_KEY = 'wyandesk.lock-pin.v1';
const ITERATIONS = 150_000;

interface StoredLockPin {
  version: 1;
  salt: string;
  hash: string;
  iterations: number;
}

function bytesToHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string): Uint8Array {
  return new Uint8Array(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || []);
}

function readLockPin(): StoredLockPin | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCK_PIN_KEY) || 'null') as Partial<StoredLockPin> | null;
    if (!value || value.version !== 1 || typeof value.salt !== 'string' || typeof value.hash !== 'string') return null;
    if (!Number.isInteger(value.iterations) || (value.iterations || 0) < 100_000) return null;
    if (!/^[a-f\d]{32}$/i.test(value.salt) || !/^[a-f\d]{64}$/i.test(value.hash)) return null;
    return value as StoredLockPin;
  } catch {
    return null;
  }
}

async function deriveLockPin(pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  if (!globalThis.crypto?.subtle) throw new Error('当前浏览器不支持安全密码摘要');
  const key = await globalThis.crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export function validLockPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export function hasLockPin(): boolean {
  return Boolean(readLockPin());
}

export async function saveLockPin(pin: string): Promise<void> {
  if (!validLockPin(pin)) throw new Error('请输入 4–8 位数字密码');
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveLockPin(pin, salt, ITERATIONS);
  const value: StoredLockPin = { version: 1, salt: bytesToHex(salt), hash: bytesToHex(hash), iterations: ITERATIONS };
  window.localStorage.setItem(LOCK_PIN_KEY, JSON.stringify(value));
}

export async function verifyLockPin(pin: string): Promise<boolean> {
  const stored = readLockPin();
  if (!stored || !validLockPin(pin)) return false;
  const candidate = await deriveLockPin(pin, hexToBytes(stored.salt), stored.iterations);
  return constantTimeEqual(candidate, hexToBytes(stored.hash));
}

export function clearLockPin(): void {
  window.localStorage.removeItem(LOCK_PIN_KEY);
}
