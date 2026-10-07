import { describe, expect, it } from 'vitest';
import { createDefaultState } from './defaults';

describe('default desktop state', () => {
  it('starts new users with three focused workspaces', () => {
    const state = createDefaultState();
    expect(state.version).toBe(8);
    expect(state.timeEvents).toEqual([]);
    expect(state.preferences.showTimeEvents).toBe(true);
    expect(state.preferences.lockActivityEnabled).toBe(true);
    expect(state.preferences.focusDurationMinutes).toBe(25);
    expect(state.workspaces[0].layout.railWidth).toBe('balanced');
    expect(state.workspaces.map((workspace) => workspace.name)).toEqual(['工作', '学习', '生活']);
    expect(state.activeWorkspaceId).toBe('workspace-work');
    expect(state.workspaces[1].categories).toEqual(['AI', '学习']);
    expect(state.workspaces[2].categories).toEqual(['常用', '生活']);
  });

  it('keeps workspace arrays isolated', () => {
    const state = createDefaultState();
    state.workspaces[0].categories.push('测试');
    expect(state.workspaces[1].categories).not.toContain('测试');
    expect(state.workspaces[2].categories).not.toContain('测试');
  });
});
