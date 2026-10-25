import { describe, expect, it } from 'vitest';
import { normalizeSession, normalizeSessions } from './session-core.js';

describe('legacy-compatible local window records', () => {
  it('rejects invalid, private and executable tabs but preserves ordinary saved URLs', () => {
    const result = normalizeSession({ id: 'one', title: '资料', tabs: [null, { url: 'https://example.com', pinned: true }, { url: 'javascript:test' }, { url: 'https://u:p@example.com' }, { url: 'https://private.example', incognito: true }] });
    expect(result.tabs).toEqual([{ title: 'example.com', url: 'https://example.com/', pinned: true, active: false }]);
    expect(normalizeSession({ id: 'bad', tabs: [] })).toBeNull();
  });
  it('deduplicates IDs and keeps the newest twenty without altering old session contents', () => {
    const entries = Array.from({ length: 22 }, (_, index) => ({ id: String(index), tabs: [{ url: `https://example.com/${index}` }], createdAt: new Date(2026, 9, index + 1).toISOString() }));
    const result = normalizeSessions([...entries, entries[0]]);
    expect(result).toHaveLength(20);
    expect(result[0].id).toBe('21');
    expect(normalizeSessions({})).toEqual([]);
  });
});
