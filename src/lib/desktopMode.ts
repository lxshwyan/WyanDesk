import type { DeskState } from '../types';

export type DesktopMode = 'navigation' | 'icons' | 'work' | 'minimal';

export function currentDesktopMode(state: DeskState): DesktopMode {
  if (state.preferences.minimalMode) return 'minimal';
  const workspace = state.workspaces.find((item) => item.id === state.activeWorkspaceId);
  if (workspace?.shortcutStyle === 'icons') return 'icons';
  return workspace?.viewMode === 'navigation' ? 'navigation' : 'work';
}

/** Display-only changes: a mode never recreates workspaces or changes saved content. */
export function withDesktopMode(state: DeskState, mode: DesktopMode): DeskState {
  return {
    ...state,
    preferences: { ...state.preferences, minimalMode: mode === 'minimal' },
    workspaces: mode === 'minimal' ? state.workspaces : state.workspaces.map((workspace) => workspace.id === state.activeWorkspaceId ? { ...workspace, viewMode: mode === 'navigation' ? 'navigation' : 'work', shortcutStyle: mode === 'icons' ? 'icons' : 'cards' } : workspace),
  };
}
