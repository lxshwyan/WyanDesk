export type SceneId = 'dawn' | 'ocean' | 'night' | 'cyber';
export type SearchEngine = 'baidu' | 'bing';

export type DeskWidgetId = 'shortcuts' | 'quickActions' | 'schedule' | 'focus' | 'reminders' | 'tasks' | 'notes' | 'calendar' | 'calculator' | 'worldClock' | 'dailyOverview';
export type DeskRailWidgetId = Exclude<DeskWidgetId, 'shortcuts'>;
export type DeskWidgetWidth = 'standard' | 'wide';
export type DeskWidgetHeight = 'compact' | 'standard' | 'tall';
export type DeskRailWidth = 'sites' | 'balanced' | 'widgets';

export interface DeskWidgetSize {
  width: DeskWidgetWidth;
  height: DeskWidgetHeight;
}

export interface DeskWorkspaceLayout {
  railWidth: DeskRailWidth;
  widgets: Record<DeskWidgetId, DeskWidgetSize>;
  widgetOrder: DeskRailWidgetId[];
}

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string;
  accent: string;
  description?: string;
  featured?: boolean;
}

export interface DeskTask {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  dueDate?: string;
  reminderTime?: string;
  recurrence?: 'none' | 'daily' | 'weekly';
}

export interface DeskInboxItem {
  id: string;
  kind: 'link' | 'task' | 'note';
  content: string;
  url?: string;
  createdAt: string;
}

export interface ShortcutGroup {
  id: string;
  title: string;
  shortcutIds: string[];
}

export interface DeskReminder {
  id: string;
  title: string;
  time: string;
  enabled: boolean;
  kind: 'work' | 'water' | 'meal' | 'rest' | 'custom';
}

export interface DeskEvent {
  id: string;
  title: string;
  date: string;
  time: string;
}

export type DeskTimeEventType = 'elapsed' | 'countdown';

export interface DeskTimeEvent {
  id: string;
  title: string;
  date: string;
  type: DeskTimeEventType;
  repeatYearly: boolean;
}

export interface DeskPreferences {
  scene: SceneId;
  sceneMotion: boolean;
  autoLockMinutes: number;
  lockActivityEnabled: boolean;
  lockMessage: string;
  compactShortcuts: boolean;
  showTasks: boolean;
  showNotes: boolean;
  showReminders: boolean;
  showQuickActions: boolean;
  showFocusTimer: boolean;
  focusDurationMinutes: number;
  showSchedule: boolean;
  showCalendar: boolean;
  showCalculator: boolean;
  showWorldClock: boolean;
  worldClockZones: string[];
  showDailyOverview: boolean;
  showTimeEvents: boolean;
  showRecent: boolean;
  systemNotifications: boolean;
  searchEngine: SearchEngine;
  customBackground: string;
  onboardingCompleted: boolean;
  productDiscoveryDismissed: boolean;
}

export interface DeskWorkspace {
  id: string;
  name: string;
  categories: string[];
  shortcuts: Shortcut[];
  shortcutGroups: ShortcutGroup[];
  tasks: DeskTask[];
  focusTaskId: string;
  note: string;
  events: DeskEvent[];
  recentShortcutIds: string[];
  layout: DeskWorkspaceLayout;
}

export interface DeskState {
  version: 8;
  activeWorkspaceId: string;
  workspaces: DeskWorkspace[];
  inbox: DeskInboxItem[];
  reminders: DeskReminder[];
  timeEvents: DeskTimeEvent[];
  preferences: DeskPreferences;
}
