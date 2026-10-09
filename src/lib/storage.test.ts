import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateDeskState, normalizeURL, parseDeskBackup, readDeskStateWithStatus, readRecoverySnapshot, serializeDeskBackup } from './storage';

function installMemoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  vi.stubGlobal('window', { localStorage });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe('normalizeURL', () => {
  it('adds https to a plain domain', () => {
    expect(normalizeURL('example.com')).toBe('https://example.com/');
  });

  it('keeps an existing https URL', () => {
    expect(normalizeURL('https://example.com/path')).toBe('https://example.com/path');
  });

  it('rejects unsafe schemes', () => {
    expect(() => normalizeURL('javascript:alert(1)')).toThrow();
  });
});

describe('migrateDeskState', () => {
  it('upgrades v1 data without dropping user content', () => {
    const migrated = migrateDeskState({
      version: 1,
      shortcuts: [{ id: 'chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com', category: '学习', icon: 'C', accent: '#10a37f' }],
      note: '保留便签',
      tasks: [{ id: 'mine', text: '保留任务', done: false, createdAt: '2026-10-05T00:00:00.000Z' }],
    });

    expect(migrated.version).toBe(8);
    expect(migrated.workspaces).toHaveLength(1);
    expect(migrated.workspaces[0].note).toBe('保留便签');
    expect(migrated.workspaces[0].tasks[0]?.id).toBe('mine');
    expect(migrated.workspaces[0].shortcuts.find((item) => item.id === 'chatgpt')?.category).toBe('AI');
    expect(migrated.workspaces[0].shortcuts.some((item) => item.id === 'tencent-meeting')).toBe(true);
    expect(migrated.workspaces[0].categories).toContain('AI');
    expect(migrated.workspaces[0].events).toEqual([]);
  });

  it('does not restore removed defaults after v2 is saved', () => {
    const migrated = migrateDeskState({ version: 2, shortcuts: [] });
    expect(migrated.workspaces[0].shortcuts).toEqual([]);
    expect(migrated.workspaces[0].categories).toEqual(['常用']);
  });

  it('preserves v3 category order and empty categories', () => {
    const migrated = migrateDeskState({
      version: 3,
      categories: ['学习', '自定义', '学习'],
      shortcuts: [{ id: 'site', title: '网站', url: 'https://example.com', category: '开发', icon: '网', accent: '#3478f6' }],
    });

    expect(migrated.workspaces[0].categories).toEqual(['学习', '自定义', '开发']);
  });

  it('preserves valid v4 focus and filters missing websites from groups', () => {
    const migrated = migrateDeskState({
      version: 4,
      shortcuts: [{ id: 'site', title: '网站', url: 'https://example.com', category: '工作', icon: '网', accent: '#3478f6' }],
      tasks: [{ id: 'focus', text: '今日重点', done: false, createdAt: '2026-10-06T00:00:00.000Z' }],
      focusTaskId: 'focus',
      shortcutGroups: [{ id: 'work', title: '开始工作', shortcutIds: ['site', 'missing', 'site'] }],
    });

    expect(migrated.workspaces[0].focusTaskId).toBe('focus');
    expect(migrated.workspaces[0].shortcutGroups).toEqual([{ id: 'work', title: '开始工作', shortcutIds: ['site'] }]);
  });

  it('clears a completed focus task during migration', () => {
    const migrated = migrateDeskState({
      version: 4,
      tasks: [{ id: 'done', text: '已完成', done: true, createdAt: '2026-10-06T00:00:00.000Z' }],
      focusTaskId: 'done',
    });

    expect(migrated.workspaces[0].focusTaskId).toBe('');
  });

  it('does not interrupt existing v5 users with onboarding after migration', () => {
    const migrated = migrateDeskState({
      version: 5,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
    });

    expect(migrated.preferences.onboardingCompleted).toBe(true);
    expect(migrated.preferences.productDiscoveryDismissed).toBe(true);
  });

  it('keeps only valid inbox items in v6 data', () => {
    const migrated = migrateDeskState({
      version: 6,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      inbox: [
        { id: 'idea', kind: 'note', content: '  稍后整理  ', createdAt: '2026-10-06T00:00:00.000Z' },
        { id: 'invalid', kind: 'unknown', content: '忽略' },
      ],
      preferences: { onboardingCompleted: true, productDiscoveryDismissed: false },
    });

    expect(migrated.inbox).toEqual([{ id: 'idea', kind: 'note', content: '稍后整理', createdAt: '2026-10-06T00:00:00.000Z', url: undefined }]);
    expect(migrated.preferences.productDiscoveryDismissed).toBe(false);
    expect(migrated.timeEvents).toEqual([]);
    expect(migrated.preferences.showTimeEvents).toBe(true);
  });

  it('keeps valid workspace layout values while upgrading v7 data', () => {
    const migrated = migrateDeskState({
      version: 7,
      activeWorkspaceId: 'work',
      workspaces: [{
        id: 'work',
        name: '工作',
        categories: ['常用'],
        shortcuts: [],
        tasks: [],
        note: '',
        layout: {
          railWidth: 'widgets',
          widgets: {
            tasks: { width: 'wide', height: 'tall' },
            notes: { width: 'invalid', height: 'invalid' },
          },
        },
      }],
    });

    expect(migrated.version).toBe(8);
    expect(migrated.workspaces[0].layout.railWidth).toBe('widgets');
    expect(migrated.workspaces[0].layout.widgets.tasks).toEqual({ width: 'wide', height: 'tall' });
    expect(migrated.workspaces[0].layout.widgets.notes).toEqual({ width: 'standard', height: 'standard' });
    expect(migrated.workspaces[0].layout.widgetOrder).toEqual(['quickActions', 'schedule', 'tasks', 'reminders', 'focus', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview']);
  });

  it('defaults lock activity records on while preserving an explicit opt-out', () => {
    const missingPreference = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: {},
    });
    const disabledPreference = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: { lockActivityEnabled: false },
    });
    const invalidPreference = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: { lockActivityEnabled: 'yes' },
    });

    expect(missingPreference.preferences.lockActivityEnabled).toBe(true);
    expect(disabledPreference.preferences.lockActivityEnabled).toBe(false);
    expect(invalidPreference.preferences.lockActivityEnabled).toBe(true);
  });

  it('keeps a valid focus duration and repairs invalid saved values', () => {
    const valid = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: { focusDurationMinutes: 45 },
    });
    const invalid = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: { focusDurationMinutes: 600 },
    });

    expect(valid.preferences.focusDurationMinutes).toBe(45);
    expect(invalid.preferences.focusDurationMinutes).toBe(25);
  });

  it('keeps new optional widgets hidden unless the user enables them', () => {
    const defaults = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: {},
    });
    const enabled = migrateDeskState({
      version: 8,
      workspaces: [{ id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '' }],
      preferences: { showCalendar: true, showCalculator: true, showWorldClock: true, worldClockZones: ['Asia/Tokyo'], showDailyOverview: true },
    });

    expect(defaults.preferences.showCalendar).toBe(false);
    expect(defaults.preferences.showCalculator).toBe(false);
    expect(defaults.preferences.showWorldClock).toBe(false);
    expect(defaults.preferences.showDailyOverview).toBe(false);
    expect(enabled.preferences.showCalendar).toBe(true);
    expect(enabled.preferences.showCalculator).toBe(true);
    expect(enabled.preferences.showWorldClock).toBe(true);
    expect(enabled.preferences.worldClockZones).toEqual(['Asia/Tokyo']);
    expect(enabled.preferences.showDailyOverview).toBe(true);
  });
});

describe('desk backup', () => {
  it('exports and restores the current ordered categories', () => {
    const state = migrateDeskState({
      version: 4,
      categories: ['工作', '稍后整理'],
      shortcuts: [],
      shortcutGroups: [{ id: 'group', title: '工作组合', shortcutIds: [] }],
      tasks: [],
      note: '需要保留',
    });
    const text = serializeDeskBackup(state, new Date('2026-10-05T12:00:00.000Z'));
    const restored = parseDeskBackup(text);

    expect(JSON.parse(text).exportedAt).toBe('2026-10-05T12:00:00.000Z');
    expect(restored.workspaces[0].categories).toEqual(['工作', '稍后整理']);
    expect(restored.workspaces[0].shortcutGroups).toEqual([{ id: 'group', title: '工作组合', shortcutIds: [] }]);
    expect(restored.workspaces[0].note).toBe('需要保留');
  });

  it('restores a v5 backup and keeps desktop isolation', () => {
    const state = migrateDeskState({
      version: 5,
      activeWorkspaceId: 'study',
      workspaces: [
        { id: 'work', name: '工作', categories: ['常用'], shortcuts: [], tasks: [], note: '工作便签' },
        { id: 'study', name: '学习', categories: ['学习'], shortcuts: [], tasks: [], note: '学习便签' },
      ],
    });
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.activeWorkspaceId).toBe('study');
    expect(restored.workspaces.map((item) => item.note)).toEqual(['工作便签', '学习便签']);
  });

  it('rejects unrelated JSON files', () => {
    expect(() => parseDeskBackup('{"hello":"world"}')).toThrow('不是可识别的 WyanDesk 备份');
  });
});

describe('local state recovery', () => {
  it('marks a browser with no data as new', () => {
    installMemoryStorage();
    const result = readDeskStateWithStatus();
    expect(result.isNew).toBe(true);
    expect(result.recovered).toBe(false);
    expect(result.state.version).toBe(8);
  });

  it('preserves invalid JSON as a recovery snapshot', () => {
    installMemoryStorage({ 'wyandesk.state.v1': '{invalid-json' });
    const result = readDeskStateWithStatus();
    expect(result.isNew).toBe(false);
    expect(result.recovered).toBe(true);
    expect(result.state.version).toBe(8);
    expect(readRecoverySnapshot()).toBe('{invalid-json');
  });
});
