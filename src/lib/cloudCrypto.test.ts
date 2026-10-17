import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { decryptDeskState, encryptDeskState, isEncryptedDeskState, validateSyncPassphrase } from './cloudCrypto';

describe('cloud end-to-end encryption', () => {
  it('round-trips a desk state without exposing its content', async () => {
    const state = createDefaultState();
    state.workspaces[0].note = '只有用户能看到的便签';
    const encrypted = await encryptDeskState(state, 'correct horse battery staple');
    expect(isEncryptedDeskState(encrypted)).toBe(true);
    expect(JSON.stringify(encrypted)).not.toContain('只有用户能看到的便签');
    await expect(decryptDeskState(encrypted, 'correct horse battery staple')).resolves.toEqual(state);
    await expect(decryptDeskState(encrypted, 'wrong password')).rejects.toThrow('同步密码');
  });

  it('requires a meaningful passphrase', () => {
    expect(() => validateSyncPassphrase('short')).toThrow('至少 10');
    expect(validateSyncPassphrase('  long-enough-passphrase  ')).toBe('long-enough-passphrase');
  });
});
