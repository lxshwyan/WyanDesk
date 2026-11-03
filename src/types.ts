export type SceneId = 'dawn' | 'ocean' | 'night' | 'cyber' | 'forest' | 'sunset' | 'iris' | 'sand';
export type SearchEngine = 'baidu' | 'bing';
export type MobileLayoutPriority = 'tasks' | 'sites';

export type DeskWidgetId = 'shortcuts' | 'quickActions' | 'schedule' | 'focus' | 'reminders' | 'tasks' | 'notes' | 'calendar' | 'calculator' | 'worldClock' | 'dailyOverview' | 'weather' | 'clipboard' | 'countdown' | 'converter' | `note:${string}`;
export type DeskRailWidgetId = Exclude<DeskWidgetId, 'shortcuts'>;
export type DeskWidgetWidth = 'standard' | 'medium' | 'wide';
export type DeskWidgetHeight = 'compact' | 'standard' | 'tall';
export type DeskRailWidth = 'sites' | 'balanced' | 'widgets';

export interface BlockBackground {
  color?: string;
  gradient?: 'blue' | 'mint' | 'apricot' | 'lilac' | 'aqua' | 'silver';
  image?: string;
}

export interface DeskWidgetSize {
  width: DeskWidgetWidth;
  height: DeskWidgetHeight;
  background?: BlockBackground;
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
  iconStyle?: 'auto' | 'text';
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
  readAt?: string;
  excerpt?: string;
  note?: string;
}

export interface ShortcutGroup {
  id: string;
  title: string;
  shortcutIds: string[];
}

export type FavoriteLink = Pick<Shortcut, 'id' | 'title' | 'url' | 'icon' | 'iconStyle' | 'accent'>;

export interface FavoriteGroup {
  id: string;
  title: string;
  links: FavoriteLink[];
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

export interface WallpaperPreferences {
  selectedId: string;
  favoriteIds: string[];
  daily: boolean;
}

export interface WallpaperView {
  x: number;
  y: number;
  tone: 'light' | 'dark';
  strength: number;
}

export interface DeskPreferences {
  wallpaperView?: WallpaperView;
  transparentAppearance?: boolean;
  wallpaper?: WallpaperPreferences;
  minimalMode: boolean;
  scene: SceneId;
  sceneMotion: boolean;
  autoLockMinutes: number;
  lockActivityEnabled: boolean;
  lockMessage: string;
  compactShortcuts: boolean;
  mobileLayoutPriority: MobileLayoutPriority;
  showTasks: boolean;
  showNotes: boolean;
  showReminders: boolean;
  showQuickActions: boolean;
  showFocusTimer: boolean;
  focusDurationMinutes: number;
  focusCycleEnabled: boolean;
  focusBreakMinutes: number;
  showConverter: boolean;
  showSchedule: boolean;
  showCalendar: boolean;
  showCalculator: boolean;
  showWorldClock: boolean;
  worldClockZones: string[];
  showDailyOverview: boolean;
  showWeather: boolean;
  showClipboard: boolean;
  showCountdown: boolean;
  showTimeEvents: boolean;
  showRecent: boolean;
  systemNotifications: boolean;
  searchEngine: SearchEngine;
  customBackground: string;
  onboardingCompleted: boolean;
  productDiscoveryDismissed: boolean;
}

export interface DeskNoteCard {
  id: `note:${string}`;
  title: string;
  content: string;
  hidden?: boolean;
}

export interface DeskWorkspace {
  id: string;
  name: string;
  viewMode?: 'work' | 'navigation';
  shortcutStyle?: 'cards' | 'icons';
  categories: string[];
  categoryBackgrounds?: Record<string, BlockBackground>;
  shortcuts: Shortcut[];
  shortcutGroups: ShortcutGroup[];
  quickActionIds: string[];
  tasks: DeskTask[];
  focusTaskId: string;
  note: string;
  noteTitle?: string;
  noteCards?: DeskNoteCard[];
  events: DeskEvent[];
  recentShortcutIds: string[];
  layout: DeskWorkspaceLayout;
}

export interface DeskState {
  version: 9;
  activeWorkspaceId: string;
  workspaces: DeskWorkspace[];
  favoriteGroups: FavoriteGroup[];
  inbox: DeskInboxItem[];
  reminders: DeskReminder[];
  timeEvents: DeskTimeEvent[];
  preferences: DeskPreferences;
}
