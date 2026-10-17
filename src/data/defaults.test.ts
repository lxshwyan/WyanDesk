import { describe, expect, it } from 'vitest';
import { createBalancedState, createDefaultState, defaultShortcuts, defaultStarterShortcutIds } from './defaults';

describe('default desktop state', () => {
  it('starts new users with one focused workspace and a small starter set', () => {
    const state = createDefaultState();
    expect(state.version).toBe(8);
    expect(state.timeEvents).toEqual([]);
    expect(state.preferences.showTimeEvents).toBe(true);
    expect(state.preferences.lockActivityEnabled).toBe(true);
    expect(state.preferences.focusDurationMinutes).toBe(25);
    expect(state.preferences.mobileLayoutPriority).toBe('tasks');
    expect(state.preferences.showQuickActions).toBe(true);
    expect(state.preferences.showDailyOverview).toBe(true);
    expect(state.preferences.showNotes).toBe(true);
    expect(state.preferences.showTasks).toBe(false);
    expect(state.preferences.showSchedule).toBe(false);
    expect(state.preferences.showReminders).toBe(false);
    expect(state.preferences.showFocusTimer).toBe(false);
    expect(state.preferences.showWeather).toBe(false);
    expect(state.preferences.showClipboard).toBe(false);
    expect(state.preferences.showCountdown).toBe(false);
    expect(state.workspaces[0].layout.railWidth).toBe('balanced');
    expect(state.workspaces[0].layout.widgets.notes.width).toBe('wide');
    expect(state.workspaces.map((workspace) => workspace.name)).toEqual(['我的桌面']);
    expect(state.activeWorkspaceId).toBe('workspace-main');
    expect(state.workspaces[0].categories).toEqual(['常用', '微言服务']);
    expect(state.workspaces[0].shortcuts.map((shortcut) => shortcut.id)).toEqual(defaultStarterShortcutIds);
    expect(state.workspaces[0].quickActionIds).toEqual(['new-task', 'new-event', 'start-focus']);
  });

  it('keeps the optional three-workspace template isolated', () => {
    const state = createBalancedState();
    expect(state.workspaces.map((workspace) => workspace.name)).toEqual(['工作', '学习', '生活']);
    state.workspaces[0].categories.push('测试');
    expect(state.workspaces[1].categories).not.toContain('测试');
    expect(state.workspaces[2].categories).not.toContain('测试');
  });
});

describe('default WyanHub products', () => {
  it('shows Survey instead of Workflow in the WyanHub app launcher', () => {
    const products = defaultShortcuts.filter((item) => item.category === '微言服务');

    expect(products).toContainEqual(expect.objectContaining({
      id: 'wyan-survey',
      title: '微言问卷',
      url: 'https://survey.wyanhub.com',
      icon: '问',
    }));
    expect(products.some((item) => item.id === 'wyan-workflow')).toBe(false);
  });
});
