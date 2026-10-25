import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import packageInfo from '../package.json';
import {
  AppWindow,
  CircleAlert,
  BellRing,
  BookMarked,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CirclePlus,
  CircleHelp,
  Cloud,
  CloudOff,
  Command,
  Database,
  Download,
  FileUp,
  FileJson,
  FileText,
  FolderOpen,
  Grid3X3,
  History,
  ImagePlus,
  Inbox,
  Info,
  Keyboard,
  Languages,
  ListTodo,
  LogIn,
  LogOut,
  Layers3,
  Lock,
  LockKeyhole,
  Minimize2,
  MessageSquareText,
  Palette,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  StickyNote,
  Smartphone,
  TimerReset,
  Trash2,
  Upload,
  Undo2,
  Unlock,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import { CommandPalette, type CommandResource, type CommandShortcut, type DeskCommand } from './components/CommandPalette';
import { ContinueWorkCard } from './components/ContinueWorkCard';
import { AssistantPanel } from './components/AssistantPanel';
import { SlowMessages } from './components/SlowMessages';
import { CategoryManager } from './components/CategoryManager';
import { CategoryContextMenu } from './components/CategoryContextMenu';
import { CalculatorCard } from './components/CalculatorCard';
import { ClipboardCard } from './components/ClipboardCard';
import { CloudHistoryModal } from './components/CloudHistoryModal';
import { CountdownCard } from './components/CountdownCard';
import { DeleteCloudDataModal } from './components/DeleteCloudDataModal';
import { DailyOverviewCard } from './components/DailyOverviewCard';
import { FocusTimerCard } from './components/FocusTimerCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { QuickActionsManager } from './components/QuickActionsManager';
import { ReminderAlertModal } from './components/ReminderAlertModal';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { SceneBackdrop } from './components/SceneBackdrop';
import { ScheduleCard } from './components/ScheduleCard';
import { ShortcutCard } from './components/ShortcutCard';
import { ShortcutContextMenu } from './components/ShortcutContextMenu';
import { ShortcutManager } from './components/ShortcutManager';
import { ShortcutGroupManager } from './components/ShortcutGroupManager';
import { SyncConflictModal } from './components/SyncConflictModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { TaskCreateModal } from './components/TaskCreateModal';
import { TimeEventModal } from './components/TimeEventModal';
import { TimeEventsStrip } from './components/TimeEventsStrip';
import { FlipClock } from './components/FlipClock';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { LockActivityModal } from './components/LockActivityModal';
import { LockPinModal, type LockPinMode } from './components/LockPinModal';
import { ManagedLayer } from './components/ManagedLayer';
import { MonthCalendarCard } from './components/MonthCalendarCard';
import { BrowserExtensionInstallCard } from './components/BrowserExtensionInstallCard';
import { PwaInstallCard } from './components/PwaInstallCard';
import { PwaUpdateNotice } from './components/PwaUpdateNotice';
import { TrustCenterModal, type TrustPanel } from './components/TrustCenterModal';
import { InboxModal } from './components/InboxModal';
import { OnboardingModal, type DeskTemplate } from './components/OnboardingModal';
import { WorkspaceManager } from './components/WorkspaceManager';
import { WidgetFrame } from './components/WidgetFrame';
import { WeatherCard } from './components/WeatherCard';
import { WorldClockCard } from './components/WorldClockCard';
import { WorldClockSettingsModal } from './components/WorldClockSettingsModal';
import { createBalancedState, createDefaultState, defaultShortcuts } from './data/defaults';
import { mergeBrowserBookmarks, parseBrowserBookmarks } from './lib/bookmarks';
import { categoryDeleteTarget, categoryExists, cleanCategoryName, deleteCategory, moveCategory, renameCategory, shortcutsForCategory } from './lib/categories';
import { MAX_VISIBLE_SHORTCUT_CATEGORIES, visibleShortcutCategoryCount } from './lib/categoryNavigation';
import { parseQuickCommand, quickCommandURL } from './lib/commandShortcuts';
import { deskSearchItems } from './lib/deskSearch';
import { readingURL, organizeReadingItem } from './lib/readingList';
import { activateBrowserTab, readOpenBrowserTabs } from './lib/browserWorkspace';
import { openExternalURL, openExternalURLs, type BatchOpenResult } from './lib/externalWindows';
import { MINUTE_MS, startAlignedClock } from './lib/alignedClock';
import { getNextReminder, minutesFromTime, reminderIsDue } from './lib/reminders';
import { playReminderChime, shouldShowInPageReminder, type ReminderAlertData } from './lib/reminderAlert';
import { directURLFromInput, moveShortcutInCategory, moveShortcutToCategory, shortcutURLExists } from './lib/shortcuts';
import { toggleShortcutGroupMembership } from './lib/shortcutGroups';
import { parseICS, serializeWorkspaceICS } from './lib/ics';
import { clearDeskState, normalizeURL, parseDeskBackup, readDeskStateWithStatus, readRecoverySnapshot, serializeDeskBackup, writeDeskState } from './lib/storage';
import { trackUsageConversion } from './lib/usageAnalytics';
import { nextRecurringDate, prioritizeTasks } from './lib/tasks';
import { acknowledgeExtensionCaptures, applyExtensionCaptures, deskHomeURL, isExtensionRuntime, publishExtensionSummary, subscribeExtensionCaptures, type ExtensionCaptureQueue } from './lib/extensionBridge';
import { cleanWorkspaceName, createBlankWorkspace, duplicateWorkspace, moveWorkspace } from './lib/workspaces';
import { parseWorkspaceTemplate, serializeWorkspaceTemplate } from './lib/workspaceTemplate';
import { useDeskSync } from './hooks/useDeskSync';
import { usePwa } from './hooks/usePwa';
import { hasLockPin, verifyLockPin } from './lib/lockPin';
import { appendLockActivity, clearLockActivityLog, countLockActivity, readLockActivityLog, writeLockActivityLog, type LockActivityKind } from './lib/lockActivity';
import { createDefaultWorkspaceLayout, moveRailWidget, railWidgetOrderForDisplay, shortcutItemLimit, swapRailWidgets, updateWidgetSize } from './lib/widgetLayout';
import { DEFAULT_QUICK_ACTION_IDS, MAX_QUICK_ACTIONS } from './lib/quickActions';
import type { DeskEvent, DeskInboxItem, DeskPreferences, DeskRailWidgetId, DeskRailWidth, DeskReminder, DeskState, DeskTask, DeskTimeEvent, DeskWidgetHeight, DeskWidgetId, DeskWidgetSize, DeskWorkspace, SceneId, Shortcut, ShortcutGroup } from './types';

const sceneOptions: Array<{ id: SceneId; name: string; description: string }> = [
  { id: 'dawn', name: '晨雾山川', description: '柔和、清透' },
  { id: 'ocean', name: '深海微光', description: '安静、专注' },
  { id: 'night', name: '星夜地平线', description: '深色、沉浸' },
  { id: 'cyber', name: '霓虹矩阵', description: '科技、绚丽' },
];

const appVersion = packageInfo.version;

const reminderIcons: Record<DeskReminder['kind'], string> = {
  work: '工',
  water: '水',
  meal: '餐',
  rest: '休',
  custom: '提',
};

interface ToastMessage {
  message: string;
  undo?: () => void;
}

type SettingsView = 'home' | 'appearance' | 'components' | 'sync' | 'privacy' | 'data' | 'about';

const settingsViewMeta: Record<SettingsView, { title: string; description: string }> = {
  home: { title: '桌面设置', description: '选择一类设置，修改会自动保存' },
  appearance: { title: '外观与桌面', description: '背景、搜索和网站卡片密度' },
  components: { title: '组件布局', description: '控制显示内容、顺序和卡片尺寸' },
  sync: { title: '账号与同步', description: '跨设备同步、加密和历史版本' },
  privacy: { title: '锁屏与隐私', description: '自动锁定、解锁密码和活动记录' },
  data: { title: '导入与备份', description: '迁移书签、日历、模板和桌面数据' },
  about: { title: '关于与支持', description: '隐私说明、使用约定和问题反馈' },
};

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function greeting(hour: number): string {
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function widgetItemLimit(height: DeskWidgetHeight, compact: number, standard: number, tall: number): number {
  return height === 'compact' ? compact : height === 'tall' ? tall : standard;
}

const pinnableQuickActionIds = new Set([
  'new-task',
  'new-event',
  'new-time-event',
  'open-inbox',
  'start-focus',
  'wyan-tools',
  'translate',
  'meeting',
  'add-shortcut',
]);

function openExternal(url: string): boolean {
  return openExternalURL(url);
}

function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const date = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function popoverMenuItems(popover: HTMLElement | null): HTMLElement[] {
  if (!popover) return [];
  return [...popover.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]')]
    .filter((item) => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true');
}

function handlePopoverNavigation(event: ReactKeyboardEvent<HTMLElement>, popover: HTMLElement | null): void {
  const items = popoverMenuItems(popover);
  if (!items.length) return;
  const currentIndex = items.indexOf(document.activeElement as HTMLElement);
  let nextIndex = currentIndex;
  if (event.key === 'ArrowDown') nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
  else if (event.key === 'ArrowUp') nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
  else if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = items.length - 1;
  else return;
  event.preventDefault();
  items[nextIndex].focus();
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [query]);

  return matches;
}

function App() {
  const [initialRead] = useState(() => readDeskStateWithStatus());
  const [state, setState] = useState<DeskState>(initialRead.state);
  const captureReceiptsRef = useRef(new WeakMap<DeskState, ExtensionCaptureQueue>());
  const isMobileViewport = useMediaQuery('(max-width: 620px)');
  const [now, setNow] = useState(() => new Date());
  const [activeCategory, setActiveCategory] = useState('常用');
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(MAX_VISIBLE_SHORTCUT_CATEGORIES);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>('home');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [draggingWidgetId, setDraggingWidgetId] = useState<DeskRailWidgetId | null>(null);
  const [dragTargetWidgetId, setDragTargetWidgetId] = useState<DeskRailWidgetId | null>(null);
  const dragTargetWidgetIdRef = useRef<DeskRailWidgetId | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [shortcutGroupsMenuOpen, setShortcutGroupsMenuOpen] = useState(false);
  const [shortcutManageMenuOpen, setShortcutManageMenuOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [shortcutManagerOpen, setShortcutManagerOpen] = useState(false);
  const [shortcutGroupManagerOpen, setShortcutGroupManagerOpen] = useState(false);
  const [quickActionsManagerOpen, setQuickActionsManagerOpen] = useState(false);
  const [shortcutContextMenu, setShortcutContextMenu] = useState<{ shortcutId: string; x: number; y: number } | null>(null);
  const [categoryContextMenu, setCategoryContextMenu] = useState<{ category: string; x: number; y: number } | null>(null);
  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);
  const [editingShortcutId, setEditingShortcutId] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [timeEventModalOpen, setTimeEventModalOpen] = useState(false);
  const [editingTimeEventId, setEditingTimeEventId] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandInitialQuery, setCommandInitialQuery] = useState('');
  const [noteSearchPending, setNoteSearchPending] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxInitialKind, setInboxInitialKind] = useState<DeskInboxItem['kind']>('note');
  const [inboxInitialItemId, setInboxInitialItemId] = useState('');
  const [onboardingOpen, setOnboardingOpen] = useState(() => initialRead.isNew && !initialRead.state.preferences.onboardingCompleted);
  const [cloudHistoryOpen, setCloudHistoryOpen] = useState(false);
  const [syncConflictOpen, setSyncConflictOpen] = useState(false);
  const [deleteCloudOpen, setDeleteCloudOpen] = useState(false);
  const [syncPassphrase, setSyncPassphrase] = useState('');
  const [trustPanel, setTrustPanel] = useState<TrustPanel | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockPinEnabled, setLockPinEnabled] = useState(hasLockPin);
  const [lockPinMode, setLockPinMode] = useState<LockPinMode | null>(null);
  const [lockActivityLog, setLockActivityLog] = useState(readLockActivityLog);
  const [lockActivityPanelOpen, setLockActivityPanelOpen] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockPending, setUnlockPending] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [taskDraft, setTaskDraft] = useState('');
  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
  const [activeReminderAlert, setActiveReminderAlert] = useState<ReminderAlertData | null>(null);
  const [worldClockSettingsOpen, setWorldClockSettingsOpen] = useState(false);
  const [taskDetailId, setTaskDetailId] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>('saved');
  const [recoveryAvailable] = useState(initialRead.recovered);
  const [focusDuration, setFocusDuration] = useState(() => initialRead.state.preferences.focusDurationMinutes);
  const [focusRemaining, setFocusRemaining] = useState(() => initialRead.state.preferences.focusDurationMinutes * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [shortcutDraft, setShortcutDraft] = useState({ title: '', url: '', category: activeCategory, icon: '', accent: '#3478f6' });
  const [eventDraft, setEventDraft] = useState({ title: '', date: localDateKey(new Date()), time: '09:00' });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const workspaceTriggerRef = useRef<HTMLButtonElement>(null);
  const workspacePopoverRef = useRef<HTMLDivElement>(null);
  const appSwitcherTriggerRef = useRef<HTMLButtonElement>(null);
  const appSwitcherPopoverRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountPopoverRef = useRef<HTMLDivElement>(null);
  const shortcutGroupsTriggerRef = useRef<HTMLButtonElement>(null);
  const shortcutGroupsPopoverRef = useRef<HTMLDivElement>(null);
  const shortcutManageTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryNavigationRef = useRef<HTMLDivElement>(null);
  const categoryMeasureRef = useRef<HTMLDivElement>(null);
  const categoryMoreMeasureRef = useRef<HTMLSpanElement>(null);
  const categoryOpenAllRef = useRef<HTMLButtonElement>(null);
  const shortcutManagePopoverRef = useRef<HTMLDivElement>(null);
  const settingsScrollRef = useRef<HTMLDivElement>(null);
  const unlockButtonRef = useRef<HTMLButtonElement>(null);
  const unlockPinRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const activeReminderAlertRef = useRef<ReminderAlertData | null>(null);
  const reminderAlertQueueRef = useRef<ReminderAlertData[]>([]);
  const reminderSnoozeTimersRef = useRef<Set<number>>(new Set());
  const isLockedRef = useRef(false);
  const fullscreenOwnedRef = useRef(false);
  const fullscreenRequestPendingRef = useRef(false);
  const unlockRequestedRef = useRef(false);
  const unlockRevealFrameRef = useRef<number | undefined>(undefined);
  const unlockRevealSecondFrameRef = useRef<number | undefined>(undefined);
  const lockActivityLogRef = useRef(lockActivityLog);
  const activeLockSessionRef = useRef<{ id: string; startedAt: string } | null>(null);
  const deskSync = useDeskSync(state, setState, initialRead.isNew);
  const pwa = usePwa();
  const extensionRuntime = isExtensionRuntime();
  const closeShortcutContextMenu = useCallback(() => setShortcutContextMenu(null), []);
  const closeCategoryContextMenu = useCallback(() => setCategoryContextMenu(null), []);

  useEffect(() => {
    settingsScrollRef.current?.scrollTo({ top: 0 });
  }, [settingsView]);

  const recordLockActivity = useCallback((kind: LockActivityKind) => {
    const session = activeLockSessionRef.current;
    if (!state.preferences.lockActivityEnabled || !session) return;
    const occurredAt = new Date().toISOString();
    const next = appendLockActivity(lockActivityLogRef.current, {
      id: uid('lock-activity'),
      sessionId: session.id,
      sessionStartedAt: session.startedAt,
      kind,
      occurredAt,
    });
    lockActivityLogRef.current = next;
    try {
      writeLockActivityLog(next);
    } catch {
      // Lock protection should remain usable even when local storage is full.
    }
    setLockActivityLog(next);
  }, [state.preferences.lockActivityEnabled]);

  const finishLockActivitySession = useCallback(() => {
    activeLockSessionRef.current = null;
  }, []);

  const finalizeUnlock = useCallback(() => {
    window.cancelAnimationFrame(unlockRevealFrameRef.current ?? 0);
    window.cancelAnimationFrame(unlockRevealSecondFrameRef.current ?? 0);
    unlockRevealFrameRef.current = undefined;
    unlockRevealSecondFrameRef.current = undefined;
    finishLockActivitySession();
    fullscreenOwnedRef.current = false;
    fullscreenRequestPendingRef.current = false;
    unlockRequestedRef.current = false;
    setIsFullscreen(Boolean(document.fullscreenElement));
    setIsLocked(false);
    setUnlockPending(false);
    setUnlockPin('');
    setUnlockError('');
  }, [finishLockActivitySession]);

  const scheduleUnlockReveal = useCallback(() => {
    window.cancelAnimationFrame(unlockRevealFrameRef.current ?? 0);
    window.cancelAnimationFrame(unlockRevealSecondFrameRef.current ?? 0);
    unlockRevealFrameRef.current = window.requestAnimationFrame(() => {
      unlockRevealSecondFrameRef.current = window.requestAnimationFrame(finalizeUnlock);
    });
  }, [finalizeUnlock]);

  const lockDesktop = useCallback((enterFullscreen: boolean) => {
    setSettingsOpen(false);
    setLayoutEditing(false);
    setSwitcherOpen(false);
    setWorkspaceMenuOpen(false);
    setAccountMenuOpen(false);
    setShortcutManageMenuOpen(false);
    setWorkspaceManagerOpen(false);
    setShortcutModalOpen(false);
    setShortcutManagerOpen(false);
    setShortcutGroupManagerOpen(false);
    setShortcutContextMenu(null);
    setCategoryContextMenu(null);
    setCategoryModalOpen(false);
    setEventModalOpen(false);
    setTimeEventModalOpen(false);
    setEditingTimeEventId('');
    setTaskCreateModalOpen(false);
    setReminderSettingsOpen(false);
    setWorldClockSettingsOpen(false);
    setTaskDetailId('');
    setCommandOpen(false);
    setKeyboardHelpOpen(false);
    setInboxOpen(false);
    setCloudHistoryOpen(false);
    setSyncConflictOpen(false);
    setDeleteCloudOpen(false);
    setTrustPanel(null);
    setToast(null);
    setUnlockPin('');
    setUnlockError('');
    setUnlocking(false);
    setUnlockPending(false);
    setLockActivityPanelOpen(false);
    unlockRequestedRef.current = false;
    const startedAt = new Date().toISOString();
    activeLockSessionRef.current = state.preferences.lockActivityEnabled ? { id: uid('lock-session'), startedAt } : null;

    if (document.fullscreenElement) fullscreenOwnedRef.current = true;
    if (enterFullscreen && document.fullscreenEnabled && !document.fullscreenElement) {
      flushSync(() => setIsLocked(true));
      fullscreenOwnedRef.current = true;
      fullscreenRequestPendingRef.current = true;
      void document.documentElement.requestFullscreen().then(() => {
        fullscreenRequestPendingRef.current = false;
        if (unlockRequestedRef.current && document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
        }
      }).catch(() => {
        fullscreenRequestPendingRef.current = false;
        fullscreenOwnedRef.current = false;
        if (unlockRequestedRef.current) scheduleUnlockReveal();
      });
      return;
    }
    setIsLocked(true);
  }, [scheduleUnlockReveal, state.preferences.lockActivityEnabled]);

  const unlockDesktop = useCallback(() => {
    if (!isLocked || unlockRequestedRef.current) return;
    unlockRequestedRef.current = true;
    setUnlockPending(true);
    if (fullscreenOwnedRef.current) {
      if (fullscreenRequestPendingRef.current) return;
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => scheduleUnlockReveal());
        return;
      }
    }
    scheduleUnlockReveal();
  }, [isLocked, scheduleUnlockReveal]);

  async function submitUnlockPin(event: FormEvent) {
    event.preventDefault();
    if (unlocking) return;
    setUnlockError('');
    setUnlocking(true);
    try {
      if (await verifyLockPin(unlockPin)) {
        unlockDesktop();
      } else {
        recordLockActivity('failed-unlock');
        setUnlockError('密码不正确');
        setUnlockPin('');
        window.requestAnimationFrame(() => unlockPinRef.current?.focus());
      }
    } catch (cause) {
      setUnlockError(cause instanceof Error ? cause.message : '暂时无法验证密码');
    } finally {
      setUnlocking(false);
    }
  }

  const notify = useCallback((message: string, undo?: () => void) => {
    setToast({ message, undo });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), undo ? 6500 : 3200);
  }, []);

  function openSettings(view: SettingsView = 'home') {
    setAccountMenuOpen(false);
    setShortcutManageMenuOpen(false);
    setSettingsView(view);
    setSettingsOpen(true);
  }

  function openInbox(kind: DeskInboxItem['kind'] = 'note', itemId = '') {
    setInboxInitialKind(kind);
    setInboxInitialItemId(itemId);
    setInboxOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  async function submitSyncEncryption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (deskSync.status === 'locked') await deskSync.unlockEncryption(syncPassphrase);
      else await deskSync.enableEncryption(syncPassphrase);
      setSyncPassphrase('');
      notify(deskSync.status === 'locked' ? '加密同步已解锁' : '端到端加密已开启');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : '暂时无法处理加密同步');
    }
  }

  async function disableSyncEncryption() {
    try {
      await deskSync.disableEncryption();
      setSyncPassphrase('');
      notify('端到端加密已关闭');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : '暂时无法关闭加密同步');
    }
  }

  isLockedRef.current = isLocked;

  const presentInPageReminder = useCallback((alert: ReminderAlertData): boolean => {
    if (!shouldShowInPageReminder(document.visibilityState, isLockedRef.current)) return false;
    if (activeReminderAlertRef.current) {
      if (!reminderAlertQueueRef.current.some((item) => item.id === alert.id)) reminderAlertQueueRef.current.push(alert);
      return true;
    }
    activeReminderAlertRef.current = alert;
    setActiveReminderAlert(alert);
    playReminderChime();
    return true;
  }, []);

  const showSystemReminder = useCallback((alert: ReminderAlertData) => {
    if (!state.preferences.systemNotifications || !('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(alert.notificationTitle, { body: alert.kind === 'task' ? `${alert.context} · ${alert.title}` : alert.title, icon: '/favicon.svg' });
  }, [state.preferences.systemNotifications]);

  const deliverReminderAlert = useCallback((alert: ReminderAlertData) => {
    if (!presentInPageReminder(alert)) showSystemReminder(alert);
  }, [presentInPageReminder, showSystemReminder]);

  const dismissActiveReminder = useCallback(() => {
    const next = reminderAlertQueueRef.current.shift() || null;
    activeReminderAlertRef.current = next;
    setActiveReminderAlert(next);
    if (next) playReminderChime();
  }, []);

  const snoozeActiveReminder = useCallback(() => {
    const alert = activeReminderAlertRef.current;
    if (!alert) return;
    dismissActiveReminder();
    const timer = window.setTimeout(() => {
      reminderSnoozeTimersRef.current.delete(timer);
      deliverReminderAlert(alert);
    }, 5 * 60_000);
    reminderSnoozeTimersRef.current.add(timer);
    notify('已延后 5 分钟提醒');
  }, [deliverReminderAlert, dismissActiveReminder, notify]);

  useEffect(() => () => {
    reminderSnoozeTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    reminderSnoozeTimersRef.current.clear();
  }, []);

  const undoToast = useCallback(() => {
    if (!toast?.undo) return;
    const undo = toast.undo;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    undo();
    window.setTimeout(() => notify('已恢复'), 0);
  }, [notify, toast]);

  useEffect(() => {
    return startAlignedClock(MINUTE_MS, setNow);
  }, []);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = window.setInterval(() => setFocusRemaining((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);

  useEffect(() => {
    if (focusRemaining !== 0 || !focusRunning) return;
    setFocusRunning(false);
    notify('本轮专注完成，起来活动一下吧');
    if (state.preferences.systemNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('微言桌面', { body: '本轮专注完成，起来活动一下吧', icon: '/favicon.svg' });
    }
  }, [focusRemaining, focusRunning, notify, state.preferences.systemNotifications]);

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      const wasLockFullscreen = fullscreenOwnedRef.current;
      setIsFullscreen(fullscreen);
      if (!fullscreen) {
        if (wasLockFullscreen) {
          if (!unlockRequestedRef.current) recordLockActivity('fullscreen-exit');
          fullscreenOwnedRef.current = false;
          fullscreenRequestPendingRef.current = false;
          unlockRequestedRef.current = true;
          setUnlockPending(true);
          scheduleUnlockReveal();
        } else {
          fullscreenOwnedRef.current = false;
        }
      }
    };
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, [recordLockActivity, scheduleUnlockReveal]);

  useEffect(() => () => {
    window.cancelAnimationFrame(unlockRevealFrameRef.current ?? 0);
    window.cancelAnimationFrame(unlockRevealSecondFrameRef.current ?? 0);
  }, []);

  useEffect(() => {
    setSaveStatus('saving');
    try {
      writeDeskState(state);
      const receipt = captureReceiptsRef.current.get(state);
      if (receipt) {
        captureReceiptsRef.current.delete(state);
        void acknowledgeExtensionCaptures(receipt).catch(() => undefined);
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      notify('本地存储空间不足，自定义背景可能无法保存');
    }
  }, [state, notify]);

  useEffect(() => {
    if (initialRead.recovered) notify('发现异常本地数据，已保留恢复副本');
  }, [initialRead.recovered, notify]);

  useEffect(() => {
    if (deskSync.conflict) setSyncConflictOpen(true);
  }, [deskSync.conflict]);

  useEffect(() => {
    if (!deskSync.user || deskSync.status !== 'synced') return;
    try {
      if (window.sessionStorage.getItem('wyan.desk.analytics.sync')) return;
      window.sessionStorage.setItem('wyan.desk.analytics.sync', '1');
    } catch { /* Session deduplication is optional. */ }
    trackUsageConversion('sync_enabled');
  }, [deskSync.status, deskSync.user]);

  useEffect(() => {
    if (!extensionRuntime) return;
    void publishExtensionSummary(state).catch(() => undefined);
  }, [extensionRuntime, state]);

  useEffect(() => {
    // Do not apply captures to a stale local snapshot that initial cloud reconciliation may replace.
    if (['checking', 'conflict', 'locked'].includes(deskSync.status)) return;
    return subscribeExtensionCaptures((queue) => {
    setState((current) => {
      const known = new Set(current.workspaces.map((workspace) => workspace.id));
      const applicable: ExtensionCaptureQueue = { version: 1,
        items: queue.items.filter((item) => known.has(item.workspaceId)),
        groups: queue.groups.filter((item) => known.has(item.workspaceId)),
        bookmarks: queue.bookmarks.filter((item) => known.has(item.workspaceId)),
      };
      if (!applicable.items.length && !applicable.groups.length && !applicable.bookmarks.length) return current;
      const result = applyExtensionCaptures(current, applicable);
      captureReceiptsRef.current.set(result.state, applicable);
      if (result.addedSites || result.addedGroups || result.updatedGroups || result.addedTasks || result.addedNotes || result.addedReadings) {
        trackUsageConversion('capture_saved');
        const saved = [
          result.addedSites ? `${result.addedSites} 个网站` : '',
          result.addedGroups ? `${result.addedGroups} 个新组合` : '',
          result.updatedGroups ? `${result.updatedGroups} 个已有组合` : '',
          result.addedTasks ? `${result.addedTasks} 个任务` : '',
          result.addedNotes ? `${result.addedNotes} 条便签` : '',
          result.addedReadings ? `${result.addedReadings} 条阅读资料` : '',
        ].filter(Boolean).join('、');
        const message = `已从浏览器保存：${saved}`;
        window.setTimeout(() => notify(message), 0);
      }
      return result.state;
    });
    });
  }, [notify, deskSync.status]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isLocked) {
        if (!lockPinEnabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          unlockDesktop();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((value) => !value);
        return;
      }
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        setKeyboardHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLocked, lockPinEnabled, unlockDesktop]);

  useEffect(() => {
    if (!workspaceMenuOpen && !switcherOpen && !accountMenuOpen && !shortcutGroupsMenuOpen && !shortcutManageMenuOpen) return undefined;

    const closeOutside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (workspaceMenuOpen && !workspaceTriggerRef.current?.parentElement?.contains(target)) setWorkspaceMenuOpen(false);
      if (switcherOpen && !appSwitcherTriggerRef.current?.parentElement?.contains(target)) setSwitcherOpen(false);
      if (accountMenuOpen && !accountTriggerRef.current?.parentElement?.contains(target)) setAccountMenuOpen(false);
      if (shortcutGroupsMenuOpen && !shortcutGroupsTriggerRef.current?.parentElement?.contains(target)) setShortcutGroupsMenuOpen(false);
      if (shortcutManageMenuOpen && !shortcutManageTriggerRef.current?.parentElement?.contains(target)) setShortcutManageMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('[data-managed-layer="true"]')) return;
      event.preventDefault();
      if (workspaceMenuOpen) {
        setWorkspaceMenuOpen(false);
        workspaceTriggerRef.current?.focus({ preventScroll: true });
      } else if (switcherOpen) {
        setSwitcherOpen(false);
        appSwitcherTriggerRef.current?.focus({ preventScroll: true });
      } else if (accountMenuOpen) {
        setAccountMenuOpen(false);
        accountTriggerRef.current?.focus({ preventScroll: true });
      } else if (shortcutGroupsMenuOpen) {
        setShortcutGroupsMenuOpen(false);
        shortcutGroupsTriggerRef.current?.focus({ preventScroll: true });
      } else if (shortcutManageMenuOpen) {
        setShortcutManageMenuOpen(false);
        shortcutManageTriggerRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [accountMenuOpen, shortcutGroupsMenuOpen, shortcutManageMenuOpen, switcherOpen, workspaceMenuOpen]);

  useEffect(() => {
    if (!isLocked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => {
      if (lockPinEnabled) unlockPinRef.current?.focus();
      else unlockButtonRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked, lockPinEnabled]);

  useEffect(() => {
    if (!isLocked || !state.preferences.lockActivityEnabled) return;
    const isUnlockAction = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('[data-lock-action]'));
    const onPointerDown = (event: PointerEvent) => {
      if (!isUnlockAction(event.target)) recordLockActivity('pointer');
    };
    const onKeyActivity = (event: KeyboardEvent) => {
      if (!lockPinEnabled && (event.key === 'Enter' || event.key === ' ')) return;
      if (!isUnlockAction(event.target)) recordLockActivity('keyboard');
    };
    const onVisibilityChange = () => {
      if (!unlockRequestedRef.current && document.visibilityState === 'hidden') recordLockActivity('context-switch');
    };
    const onWindowBlur = () => {
      if (!unlockRequestedRef.current) recordLockActivity('context-switch');
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyActivity, true);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyActivity, true);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [isLocked, lockPinEnabled, recordLockActivity, state.preferences.lockActivityEnabled]);

  useEffect(() => {
    const minutes = state.preferences.autoLockMinutes;
    if (!minutes || isLocked) return;

    let timer = 0;
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => lockDesktop(false), minutes * 60_000);
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer));
    resetTimer();
    return () => {
      window.clearTimeout(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [isLocked, lockDesktop, state.preferences.autoLockMinutes]);

  useEffect(() => {
    const checkReminders = () => {
      const currentDate = new Date();
      for (const reminder of state.reminders) {
        if (!reminderIsDue(reminder, currentDate)) continue;
        const dateKey = currentDate.toISOString().slice(0, 10);
        const firedKey = `wyandesk.reminder.fired.${reminder.id}`;
        if (window.localStorage.getItem(firedKey) === dateKey) continue;
        window.localStorage.setItem(firedKey, dateKey);
        deliverReminderAlert({ id: `reminder:${reminder.id}:${dateKey}`, title: reminder.title, time: reminder.time, context: '今日', kind: reminder.kind, notificationTitle: '微言桌面' });
      }
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [deliverReminderAlert, state.reminders]);

  useEffect(() => {
    const checkTaskReminders = () => {
      const currentDate = new Date();
      const dateKey = localDateKey(currentDate);
      const minute = currentDate.getHours() * 60 + currentDate.getMinutes();
      for (const item of state.workspaces) {
        for (const task of item.tasks) {
          if (task.done || task.dueDate !== dateKey || !task.reminderTime || minutesFromTime(task.reminderTime) !== minute) continue;
          const firedKey = `wyandesk.task-reminder.fired.${task.id}.${dateKey}`;
          if (window.localStorage.getItem(firedKey)) continue;
          window.localStorage.setItem(firedKey, '1');
          deliverReminderAlert({ id: `task:${task.id}:${dateKey}`, title: task.text, time: task.reminderTime, context: item.name, kind: 'task', notificationTitle: '任务提醒' });
        }
      }
    };
    checkTaskReminders();
    const timer = window.setInterval(checkTaskReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [deliverReminderAlert, state.workspaces]);

  const workspace = state.workspaces.find((item) => item.id === state.activeWorkspaceId) || state.workspaces[0];

  const updateWorkspaceById = useCallback((workspaceId: string, update: (current: DeskWorkspace) => DeskWorkspace) => {
    setState((current) => ({
      ...current,
      workspaces: current.workspaces.map((item) => item.id === workspaceId ? update(item) : item),
    }));
  }, []);

  const updateWorkspace = useCallback((update: (current: DeskWorkspace) => DeskWorkspace) => {
    setState((current) => {
      const active = current.workspaces.find((item) => item.id === current.activeWorkspaceId) || current.workspaces[0];
      const nextWorkspace = update(active);
      return { ...current, workspaces: current.workspaces.map((item) => item.id === active.id ? nextWorkspace : item) };
    });
  }, []);

  const commandShortcuts = useMemo<CommandShortcut[]>(() => state.workspaces.flatMap((item) => item.shortcuts.map((shortcut) => ({
    shortcut,
    workspaceId: item.id,
    workspaceName: item.name,
  }))), [state.workspaces]);

  useEffect(() => {
    if (!noteSearchPending || commandOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const editor = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="工作便签"]');
      editor?.scrollIntoView({ block: 'center' });
      editor?.focus();
      setNoteSearchPending(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [noteSearchPending, commandOpen, workspace.id]);

  const commandResources: CommandResource[] = deskSearchItems(state).map((item) => ({
    ...item,
    id: `${item.workspaceId || 'inbox'}-${item.id}`,
    kind: item.kind === 'task' ? '任务' : item.kind === 'note' ? '便签' : '收集',
    icon: item.kind === 'task' ? <ListTodo /> : item.kind === 'note' ? <StickyNote /> : <BookMarked />,
    run: () => {
      if (item.kind === 'inbox') { openInbox('link', item.id); return; }
      if (item.workspaceId) switchWorkspace(item.workspaceId);
      if (item.kind === 'task') setTaskDetailId(item.id);
      else { updatePreferences({ showNotes: true }); setNoteSearchPending(true); }
    },
  }));

  async function loadSearchTabs(): Promise<CommandResource[]> {
    return (await readOpenBrowserTabs()).map((tab) => ({ id: String(tab.id), label: tab.title, description: tab.url, keywords: tab.url, kind: '切换标签', icon: <AppWindow />, run: () => activateBrowserTab(tab) }));
  }

  const categories = workspace.categories;
  const primaryCategories = categories.slice(0, visibleCategoryCount);
  const overflowCategories = categories.slice(visibleCategoryCount);
  const overflowCategoryActive = overflowCategories.includes(activeCategory);
  const categoryCounts = useMemo(() => workspace.shortcuts.reduce<Record<string, number>>((counts, shortcut) => {
    counts[shortcut.category] = (counts[shortcut.category] || 0) + 1;
    return counts;
  }, {}), [workspace.shortcuts]);
  const activeCategoryShortcuts = useMemo(() => shortcutsForCategory(workspace.shortcuts, activeCategory), [activeCategory, workspace.shortcuts]);

  useEffect(() => {
    if (!categories.includes(activeCategory) && categories.length) setActiveCategory(categories[0]);
  }, [activeCategory, categories]);

  useLayoutEffect(() => {
    const navigation = categoryNavigationRef.current;
    const measureRow = categoryMeasureRef.current;
    const moreControl = categoryMoreMeasureRef.current;
    const openAllControl = categoryOpenAllRef.current;
    if (!navigation || !measureRow || !moreControl || !openAllControl) return;

    const recalculate = () => {
      const measuredCategories = Array.from(measureRow.children)
        .slice(0, MAX_VISIBLE_SHORTCUT_CATEGORIES)
        .map((element) => (element as HTMLElement).getBoundingClientRect().width);
      const categoryStyles = window.getComputedStyle(measureRow);
      const navigationStyles = window.getComputedStyle(navigation);
      const categoryGap = Number.parseFloat(categoryStyles.columnGap || categoryStyles.gap) || 0;
      const overflowGap = Number.parseFloat(navigationStyles.columnGap || navigationStyles.gap) || 0;
      const actionWidth = openAllControl.getBoundingClientRect().width + overflowGap;
      const nextCount = visibleShortcutCategoryCount({
        categoryWidths: measuredCategories,
        totalCategoryCount: categories.length,
        availableWidth: Math.max(0, navigation.clientWidth - actionWidth),
        moreWidth: moreControl.getBoundingClientRect().width,
        categoryGap,
        overflowGap,
      });
      setVisibleCategoryCount((current) => current === nextCount ? current : nextCount);
    };

    recalculate();
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(recalculate);
    resizeObserver?.observe(navigation);
    window.addEventListener('resize', recalculate);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', recalculate);
    };
  }, [activeCategory, activeCategoryShortcuts.length, categories, query]);

  const visibleShortcuts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    if (!normalized) return activeCategoryShortcuts;
    return workspace.shortcuts.filter((item) => {
      return [item.title, item.description, item.url, item.category].join(' ').toLocaleLowerCase('zh-CN').includes(normalized);
    });
  }, [activeCategoryShortcuts, query, workspace.shortcuts]);
  const shortcutDisplayLimit = shortcutItemLimit(workspace.layout.widgets.shortcuts.height, state.preferences.compactShortcuts, isMobileViewport);
  const displayedShortcuts = shortcutsExpanded ? visibleShortcuts : visibleShortcuts.slice(0, shortcutDisplayLimit);
  const shortcutContextTarget = shortcutContextMenu ? workspace.shortcuts.find((item) => item.id === shortcutContextMenu.shortcutId) : undefined;
  const hiddenShortcutCount = Math.max(0, visibleShortcuts.length - displayedShortcuts.length);

  useEffect(() => {
    setShortcutsExpanded(false);
  }, [activeCategory, isMobileViewport, query, state.activeWorkspaceId, state.preferences.compactShortcuts, workspace.layout.widgets.shortcuts.height]);

  const wyanProducts = useMemo(() => defaultShortcuts.filter((item) => item.category === '微言服务'), []);
  const recentShortcuts = useMemo(() => workspace.recentShortcutIds
    .map((id) => workspace.shortcuts.find((shortcut) => shortcut.id === id))
    .filter((shortcut): shortcut is Shortcut => Boolean(shortcut)), [workspace.recentShortcutIds, workspace.shortcuts]);
  const recentSearchSuggestions = recentShortcuts.slice(0, 4);
  const showRecentSearchSuggestions = state.preferences.showRecent
    && searchFocused
    && !query.trim()
    && recentSearchSuggestions.length > 0;
  const todayKey = localDateKey(now);
  const upcomingEvents = useMemo(() => [...workspace.events]
    .filter((event) => event.date >= todayKey)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [workspace.events, todayKey]);
  const nextReminder = useMemo(() => getNextReminder(state.reminders, now), [now, state.reminders]);
  const enabledReminderCount = state.reminders.filter((item) => item.enabled).length;
  const openTaskCount = workspace.tasks.filter((item) => !item.done).length;
  const lockActivityCount = countLockActivity(lockActivityLog);
  const latestLockActivity = lockActivityLog.at(-1);
  const selectedTask = workspace.tasks.find((task) => task.id === taskDetailId);
  const selectedTimeEvent = state.timeEvents.find((event) => event.id === editingTimeEventId);
  const orderedTasks = useMemo(() => prioritizeTasks(workspace.tasks, workspace.focusTaskId), [workspace.focusTaskId, workspace.tasks]);

  function updatePreferences(next: Partial<DeskPreferences>) {
    setState((current) => ({ ...current, preferences: { ...current.preferences, ...next } }));
  }

  function clearLockActivityHistory() {
    clearLockActivityLog();
    lockActivityLogRef.current = [];
    setLockActivityLog([]);
    notify('本地锁屏活动记录已清空');
  }

  function updateCurrentWidget(id: DeskWidgetId, next: Partial<DeskWidgetSize>) {
    updateWorkspace((current) => ({ ...current, layout: updateWidgetSize(current.layout, id, next) }));
  }

  function moveCurrentRailWidget(id: DeskRailWidgetId, direction: -1 | 1) {
    updateWorkspace((current) => ({ ...current, layout: moveRailWidget(current.layout, id, direction) }));
  }

  function startDraggedRailWidget(id: DeskRailWidgetId) {
    dragTargetWidgetIdRef.current = null;
    setDragTargetWidgetId(null);
    setDraggingWidgetId(id);
  }

  function moveDraggedRailWidget(sourceId: DeskRailWidgetId, clientX: number, clientY: number) {
    if (!layoutEditing) return;
    const target = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('.widget-frame[data-widget]');
    const targetId = target?.dataset.widget as DeskRailWidgetId | undefined;
    const nextTargetId = targetId && targetId !== sourceId && workspace.layout.widgetOrder.includes(targetId) ? targetId : null;
    if (dragTargetWidgetIdRef.current !== nextTargetId) {
      dragTargetWidgetIdRef.current = nextTargetId;
      setDragTargetWidgetId(nextTargetId);
    }
    if (clientY < 90) window.scrollBy({ top: -18, behavior: 'auto' });
    else if (clientY > window.innerHeight - 90) window.scrollBy({ top: 18, behavior: 'auto' });
  }

  function captureRailWidgetRects(): Map<DeskRailWidgetId, DOMRect> {
    return new Map(Array.from(document.querySelectorAll<HTMLElement>('.today-rail > .widget-frame[data-widget]')).map((element) => [
      element.dataset.widget as DeskRailWidgetId,
      element.getBoundingClientRect(),
    ]));
  }

  function animateRailWidgetDrop(before: Map<DeskRailWidgetId, DOMRect>) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll<HTMLElement>('.today-rail > .widget-frame[data-widget]').forEach((element) => {
      const id = element.dataset.widget as DeskRailWidgetId;
      const previous = before.get(id);
      if (!previous || typeof element.animate !== 'function') return;
      const current = element.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
      element.animate([
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], {
        duration: 260,
        easing: 'cubic-bezier(.22, 1, .36, 1)',
      });
    });
  }

  function finishDraggedRailWidget(sourceId: DeskRailWidgetId) {
    const targetId = dragTargetWidgetIdRef.current;
    dragTargetWidgetIdRef.current = null;
    flushSync(() => {
      setDraggingWidgetId(null);
      setDragTargetWidgetId(null);
    });
    if (!targetId || targetId === sourceId) return;
    const before = captureRailWidgetRects();
    flushSync(() => {
      updateWorkspace((current) => ({ ...current, layout: swapRailWidgets(current.layout, sourceId, targetId) }));
    });
    animateRailWidgetDrop(before);
  }

  function setRailWidth(railWidth: DeskRailWidth) {
    updateWorkspace((current) => ({ ...current, layout: { ...current.layout, railWidth } }));
  }

  function resetCurrentLayout() {
    updateWorkspace((current) => ({ ...current, layout: createDefaultWorkspaceLayout() }));
    notify('已恢复当前桌面的默认布局');
  }

  function enterLayoutEditing() {
    setSettingsOpen(false);
    setLayoutEditing(true);
  }

  function applyOnboardingTemplate(template: DeskTemplate) {
    const workspaces = template === 'balanced'
      ? createBalancedState().workspaces
      : template === 'simple'
        ? createDefaultState().workspaces
        : [createBlankWorkspace(uid('workspace'), '我的桌面')];
    setState((current) => ({ ...current, activeWorkspaceId: workspaces[0].id, workspaces }));
    resetWorkspaceView(workspaces[0]);
  }

  function completeOnboarding() {
    updatePreferences({ onboardingCompleted: true, productDiscoveryDismissed: true });
    setOnboardingOpen(false);
  }

  function addInboxItem(kind: DeskInboxItem['kind'], rawContent: string): boolean {
    const content = rawContent.trim();
    if (!content) {
      notify('请输入要记录的内容');
      return false;
    }
    let url: string | undefined;
    if (kind === 'link') {
      try {
        url = normalizeURL(content);
        if (!readingURL(url)) throw new Error('无效或含凭证的网址');
      } catch {
        notify('请输入有效的网址');
        return false;
      }
    }
    const item: DeskInboxItem = { id: uid('inbox'), kind, content: content.slice(0, 500), url, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, inbox: [item, ...current.inbox] }));
    notify('已加入收集箱');
    return true;
  }

  function removeInboxItem(item: DeskInboxItem) {
    const index = state.inbox.findIndex((candidate) => candidate.id === item.id);
    setState((current) => ({ ...current, inbox: current.inbox.filter((candidate) => candidate.id !== item.id) }));
    notify('收集项已删除', () => setState((current) => {
      if (current.inbox.some((candidate) => candidate.id === item.id)) return current;
      const inbox = [...current.inbox];
      inbox.splice(Math.min(index, inbox.length), 0, item);
      return { ...current, inbox };
    }));
  }

  function organizeInboxItem(item: DeskInboxItem, workspaceId: string, category: string) {
    const target = state.workspaces.find((candidate) => candidate.id === workspaceId);
    if (!target) return;
    if (item.kind === 'link' && !readingURL(item.url)) { notify('来源网址无效，内容仍保留在收集箱中'); return; }
    setState((current) => ({
      ...current,
      inbox: current.inbox.filter((candidate) => candidate.id !== item.id),
      workspaces: current.workspaces.map((candidate) => {
        if (candidate.id !== workspaceId) return candidate;
        return organizeReadingItem(candidate, item, category, uid(item.kind));
      }),
    }));
    notify(item.kind === 'link' ? `已移入“${target.name}”网站${item.excerpt || item.note ? '，摘录与备注已保留到便签' : ''}` : item.kind === 'task' ? `已整理到“${target.name}”任务` : `已整理到“${target.name}”便签`);
  }

  function recordShortcut(shortcut: Shortcut) {
    updateWorkspace((current) => ({
      ...current,
      recentShortcutIds: [shortcut.id, ...current.recentShortcutIds.filter((id) => id !== shortcut.id)].slice(0, 6),
    }));
  }

  function openShortcut(shortcut: Shortcut) {
    recordShortcut(shortcut);
    openExternal(shortcut.url);
  }

  function openCommandShortcut(item: CommandShortcut) {
    const target = state.workspaces.find((candidate) => candidate.id === item.workspaceId);
    if (!target) return;
    setState((current) => ({
      ...current,
      activeWorkspaceId: item.workspaceId,
      workspaces: current.workspaces.map((candidate) => candidate.id === item.workspaceId ? {
        ...candidate,
        recentShortcutIds: [item.shortcut.id, ...candidate.recentShortcutIds.filter((id) => id !== item.shortcut.id)].slice(0, 6),
      } : candidate),
    }));
    if (item.workspaceId !== workspace.id) resetWorkspaceView(target);
    openExternal(item.shortcut.url);
  }

  function openShortcutById(id: string, fallbackURL: string) {
    const shortcut = workspace.shortcuts.find((item) => item.id === id);
    if (shortcut) openShortcut(shortcut);
    else openExternal(fallbackURL);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (visibleShortcuts.length) {
      openShortcut(visibleShortcuts[0]);
      return;
    }
    const directURL = directURLFromInput(value);
    if (directURL) {
      openExternal(directURL);
      return;
    }
    const searchURL = state.preferences.searchEngine === 'bing'
      ? `https://cn.bing.com/search?q=${encodeURIComponent(value)}`
      : `https://www.baidu.com/s?wd=${encodeURIComponent(value)}`;
    openExternal(searchURL);
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    if (!addTaskText(taskDraft)) return;
    setTaskDraft('');
  }

  function addTaskText(value: string): boolean {
    return addTaskDetails({ text: value, recurrence: 'none' });
  }

  function addTaskDetails(draft: Pick<DeskTask, 'text' | 'dueDate' | 'reminderTime' | 'recurrence'>): boolean {
    const text = draft.text.trim();
    if (!text) return false;
    updateWorkspace((current) => ({
      ...current,
      tasks: [{
        id: uid('task'),
        text,
        done: false,
        createdAt: new Date().toISOString(),
        dueDate: draft.dueDate,
        reminderTime: draft.dueDate ? draft.reminderTime : undefined,
        recurrence: draft.dueDate ? draft.recurrence || 'none' : 'none',
      }, ...current.tasks],
    }));
    notify('任务已添加');
    return true;
  }

  function toggleTask(id: string) {
    const source = workspace.tasks.find((task) => task.id === id);
    const nextDueDate = source && !source.done ? nextRecurringDate(source.dueDate || '', source.recurrence) : '';
    updateWorkspace((current) => ({
      ...current,
      tasks: [
        ...(nextDueDate && source ? [{ ...source, id: uid('task'), done: false, dueDate: nextDueDate, createdAt: new Date().toISOString() }] : []),
        ...current.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task),
      ],
      focusTaskId: current.focusTaskId === id && !current.tasks.find((task) => task.id === id)?.done ? '' : current.focusTaskId,
    }));
    if (nextDueDate) notify(`已创建下一次重复任务：${nextDueDate}`);
  }

  function removeTask(id: string) {
    const task = workspace.tasks.find((item) => item.id === id);
    if (!task || !window.confirm(`删除“${task.text}”？`)) return;
    const workspaceId = workspace.id;
    const taskIndex = workspace.tasks.findIndex((item) => item.id === id);
    const wasFocused = workspace.focusTaskId === id;
    updateWorkspace((current) => ({
      ...current,
      tasks: current.tasks.filter((item) => item.id !== id),
      focusTaskId: current.focusTaskId === id ? '' : current.focusTaskId,
    }));
    if (taskDetailId === id) setTaskDetailId('');
    notify('任务已删除', () => updateWorkspaceById(workspaceId, (current) => {
      if (current.tasks.some((item) => item.id === id)) return current;
      const tasks = [...current.tasks];
      tasks.splice(Math.min(taskIndex, tasks.length), 0, task);
      return { ...current, tasks, focusTaskId: wasFocused ? id : current.focusTaskId };
    }));
  }

  function saveTask(id: string, draft: Pick<DeskTask, 'text' | 'dueDate' | 'reminderTime' | 'recurrence'>): boolean {
    const value = draft.text.trim();
    if (!value) {
      notify('任务内容不能为空');
      return false;
    }
    updateWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === id ? {
        ...task,
        text: value,
        dueDate: draft.dueDate,
        reminderTime: draft.dueDate ? draft.reminderTime : undefined,
        recurrence: draft.recurrence || 'none',
      } : task),
    }));
    notify('任务已更新');
    return true;
  }

  function toggleFocusTask(id: string) {
    updateWorkspace((current) => ({ ...current, focusTaskId: current.focusTaskId === id ? '' : id }));
  }

  function openShortcutCollection(title: string, kind: '分类' | '组合', shortcuts: Shortcut[]): BatchOpenResult | null {
    if (!shortcuts.length) {
      notify(`这个${kind}里暂时没有可打开的网站`);
      return null;
    }
    if (shortcuts.length > 12 && !window.confirm(`“${title}”${kind}有 ${shortcuts.length} 个网站，确认全部打开？`)) return null;
    const urls: string[] = [];
    for (const shortcut of shortcuts) {
      try {
        urls.push(normalizeURL(shortcut.url));
      } catch {
        // Skip invalid legacy URLs without interrupting the remaining group.
      }
    }
    if (!urls.length) {
      notify(`这个${kind}里没有有效的网址`);
      return null;
    }

    const result = openExternalURLs(urls);
    if (result.opened > 0) {
      updateWorkspace((current) => ({
        ...current,
        recentShortcutIds: [...shortcuts.map((shortcut) => shortcut.id), ...current.recentShortcutIds.filter((id) => !shortcuts.some((shortcut) => shortcut.id === id))].slice(0, 6),
      }));
    }
    if (result.blocked === 0) notify(`已打开“${title}”${kind}的 ${result.opened} 个网站，标签页可能在当前窗口后台`);
    else if (result.opened === 0) notify(`浏览器拦截了全部 ${result.blocked} 个网站，请允许本站弹出窗口后重试`);
    else notify(`已打开 ${result.opened} 个，另 ${result.blocked} 个被浏览器拦截，请允许本站弹出窗口后重试`);
    return result;
  }

  function openShortcutGroup(group: ShortcutGroup): BatchOpenResult | null {
    const shortcuts = group.shortcutIds
      .map((id) => workspace.shortcuts.find((shortcut) => shortcut.id === id))
      .filter((shortcut): shortcut is Shortcut => Boolean(shortcut));
    return openShortcutCollection(group.title, '组合', shortcuts);
  }

  function openShortcutCategory(category: string): BatchOpenResult | null {
    return openShortcutCollection(category, '分类', shortcutsForCategory(workspace.shortcuts, category));
  }

  function saveShortcutGroup(draft: { id: string; title: string; shortcutIds: string[] }): boolean {
    const title = draft.title.trim();
    const shortcutIds = [...new Set(draft.shortcutIds)].filter((id) => workspace.shortcuts.some((shortcut) => shortcut.id === id));
    if (!title) {
      notify('请输入组合名称');
      return false;
    }
    if (!shortcutIds.length) {
      notify('至少选择一个网站');
      return false;
    }
    const duplicate = workspace.shortcutGroups.some((group) => group.id !== draft.id && group.title.localeCompare(title, 'zh-CN', { sensitivity: 'base' }) === 0);
    if (duplicate) {
      notify('已经有同名组合');
      return false;
    }
    const id = draft.id || uid('group');
    updateWorkspace((current) => ({
      ...current,
      shortcutGroups: current.shortcutGroups.some((group) => group.id === id)
        ? current.shortcutGroups.map((group) => group.id === id ? { id, title, shortcutIds } : group)
        : [...current.shortcutGroups, { id, title, shortcutIds }],
    }));
    notify(draft.id ? '网站组合已更新' : '网站组合已创建');
    return true;
  }

  function removeShortcutGroup(group: ShortcutGroup) {
    if (!window.confirm(`删除“${group.title}”组合？组合内的网站不会被删除。`)) return;
    updateWorkspace((current) => ({
      ...current,
      shortcutGroups: current.shortcutGroups.filter((item) => item.id !== group.id),
      quickActionIds: current.quickActionIds.filter((id) => id !== `open-group-${group.id}`),
    }));
    notify('网站组合已删除');
  }

  function toggleShortcutInGroup(shortcut: Shortcut, group: ShortcutGroup) {
    const included = !group.shortcutIds.includes(shortcut.id);
    updateWorkspace((current) => {
      const result = toggleShortcutGroupMembership(current.shortcutGroups, group.id, shortcut.id);
      return result ? { ...current, shortcutGroups: result.groups } : current;
    });
    notify(included ? `已加入“${group.title}”` : `已从“${group.title}”移出`);
  }

  function removeShortcut(id: string) {
    const shortcut = workspace.shortcuts.find((item) => item.id === id);
    if (!shortcut || !window.confirm(`删除“${shortcut.title}”？`)) return;
    const workspaceId = workspace.id;
    const shortcutIndex = workspace.shortcuts.findIndex((item) => item.id === id);
    const recentIndex = workspace.recentShortcutIds.indexOf(id);
    const memberships = workspace.shortcutGroups
      .filter((group) => group.shortcutIds.includes(id))
      .map((group) => ({ groupId: group.id, index: group.shortcutIds.indexOf(id) }));
    updateWorkspace((current) => ({
      ...current,
      shortcuts: current.shortcuts.filter((item) => item.id !== id),
      recentShortcutIds: current.recentShortcutIds.filter((shortcutId) => shortcutId !== id),
      quickActionIds: current.quickActionIds.filter((actionId) => actionId !== `open-shortcut-${id}`),
      shortcutGroups: current.shortcutGroups.map((group) => ({ ...group, shortcutIds: group.shortcutIds.filter((shortcutId) => shortcutId !== id) })),
    }));
    notify('网站已删除', () => updateWorkspaceById(workspaceId, (current) => {
      if (current.shortcuts.some((item) => item.id === id)) return current;
      const shortcuts = [...current.shortcuts];
      shortcuts.splice(Math.min(shortcutIndex, shortcuts.length), 0, shortcut);
      const recentShortcutIds = [...current.recentShortcutIds];
      if (recentIndex >= 0 && !recentShortcutIds.includes(id)) recentShortcutIds.splice(Math.min(recentIndex, recentShortcutIds.length), 0, id);
      const membershipMap = new Map(memberships.map((item) => [item.groupId, item.index]));
      const shortcutGroups = current.shortcutGroups.map((group) => {
        const index = membershipMap.get(group.id);
        if (index === undefined || group.shortcutIds.includes(id)) return group;
        const shortcutIds = [...group.shortcutIds];
        shortcutIds.splice(Math.min(index, shortcutIds.length), 0, id);
        return { ...group, shortcutIds };
      });
      return {
        ...current,
        categories: current.categories.includes(shortcut.category) ? current.categories : [...current.categories, shortcut.category],
        shortcuts,
        recentShortcutIds: recentShortcutIds.slice(0, 6),
        shortcutGroups,
      };
    }));
  }

  function reorderShortcut(id: string, direction: -1 | 1) {
    updateWorkspace((current) => ({ ...current, shortcuts: moveShortcutInCategory(current.shortcuts, id, direction) }));
  }

  function moveShortcutCategory(shortcut: Shortcut, category: string) {
    const previousCategory = shortcut.category;
    if (previousCategory === category) return;
    const workspaceId = workspace.id;
    updateWorkspace((current) => ({ ...current, shortcuts: moveShortcutToCategory(current.shortcuts, shortcut.id, category) }));
    notify(`已将“${shortcut.title}”移动到“${category}”`, () => updateWorkspaceById(workspaceId, (current) => ({
      ...current,
      shortcuts: moveShortcutToCategory(current.shortcuts, shortcut.id, previousCategory),
    })));
  }

  function addCategory(name: string): boolean {
    const category = cleanCategoryName(name);
    if (!category) {
      notify('请输入分类名称');
      return false;
    }
    if (category.length > 16) {
      notify('分类名称请控制在 16 个字内');
      return false;
    }
    if (categoryExists(workspace.categories, category)) {
      notify('该分类已存在');
      return false;
    }
    updateWorkspace((current) => ({ ...current, categories: [...current.categories, category] }));
    setActiveCategory(category);
    setQuery('');
    notify(`已新增“${category}”分类`);
    return true;
  }

  function updateCategoryName(name: string, nextName: string): boolean {
    const category = cleanCategoryName(nextName);
    if (!category) {
      notify('分类名称不能为空');
      return false;
    }
    if (category.length > 16) {
      notify('分类名称请控制在 16 个字内');
      return false;
    }
    if (category === name) return true;
    if (categoryExists(workspace.categories, category, name)) {
      notify('该分类已存在');
      return false;
    }
    updateWorkspace((current) => ({ ...current, ...renameCategory(current.categories, current.shortcuts, name, category) }));
    if (activeCategory === name) setActiveCategory(category);
    notify(`已更名为“${category}”`);
    return true;
  }

  function reorderCategory(name: string, direction: -1 | 1) {
    updateWorkspace((current) => ({ ...current, categories: moveCategory(current.categories, name, direction) }));
  }

  function removeCategory(name: string) {
    const target = categoryDeleteTarget(workspace.categories, name);
    if (!target) {
      notify('至少保留一个分类');
      return;
    }
    const count = categoryCounts[name] || 0;
    updateWorkspace((current) => {
      const { categories: nextCategories, shortcuts: nextShortcuts, deletedShortcutIds } = deleteCategory(current.categories, current.shortcuts, name);
      const deletedIds = new Set(deletedShortcutIds);
      const nextGroups = current.shortcutGroups
        .map((group) => ({ ...group, shortcutIds: group.shortcutIds.filter((id) => !deletedIds.has(id)) }))
        .filter((group) => group.shortcutIds.length > 0);
      const nextGroupActionIds = new Set(nextGroups.map((group) => `open-group-${group.id}`));
      return {
        ...current,
        categories: nextCategories,
        shortcuts: nextShortcuts,
        recentShortcutIds: current.recentShortcutIds.filter((id) => !deletedIds.has(id)),
        shortcutGroups: nextGroups,
        quickActionIds: current.quickActionIds.filter((id) => {
          if (id.startsWith('open-shortcut-')) return !deletedIds.has(id.slice('open-shortcut-'.length));
          if (id.startsWith('open-group-')) return nextGroupActionIds.has(id);
          return true;
        }),
      };
    });
    if (activeCategory === name) setActiveCategory(target);
    notify(count ? `已删除“${name}”和其中 ${count} 个网站` : `已删除“${name}”分类`);
  }

  function openShortcutModal() {
    setEditingShortcutId('');
    setShortcutDraft({ title: '', url: '', category: activeCategory, icon: '', accent: '#3478f6' });
    setShortcutManagerOpen(false);
    setShortcutModalOpen(true);
  }

  function openShortcutManager() {
    setQuery('');
    setShortcutManagerOpen(true);
  }

  function openShortcutEditor(shortcut: Shortcut) {
    setEditingShortcutId(shortcut.id);
    setShortcutDraft({ title: shortcut.title, url: shortcut.url, category: shortcut.category, icon: shortcut.icon, accent: shortcut.accent });
    setShortcutManagerOpen(false);
    setShortcutModalOpen(true);
  }

  function closeShortcutModal() {
    setShortcutModalOpen(false);
    setEditingShortcutId('');
  }

  function saveShortcut(event: FormEvent) {
    event.preventDefault();
    try {
      const title = shortcutDraft.title.trim();
      const requestedCategory = cleanCategoryName(shortcutDraft.category) || activeCategory;
      const category = workspace.categories.find((item) => item.localeCompare(requestedCategory, 'zh-CN', { sensitivity: 'base' }) === 0) || requestedCategory;
      if (!title) throw new Error('请填写网站名称');
      if (category.length > 16) throw new Error('分类名称请控制在 16 个字内');
      const url = normalizeURL(shortcutDraft.url);
      if (!url) throw new Error('请填写网站地址');
      if (shortcutURLExists(workspace.shortcuts, url, editingShortcutId)) throw new Error('这个网址已经在桌面中');
      const existing = editingShortcutId ? workspace.shortcuts.find((item) => item.id === editingShortcutId) : undefined;
      const shortcut: Shortcut = {
        id: existing?.id || uid('shortcut'),
        title,
        url,
        category,
        icon: shortcutDraft.icon.trim() || Array.from(title)[0] || 'W',
        accent: shortcutDraft.accent,
        description: existing?.description || '自定义网站',
        featured: existing?.featured,
      };
      updateWorkspace((current) => ({
        ...current,
        categories: current.categories.includes(category) ? current.categories : [...current.categories, category],
        shortcuts: existing
          ? current.shortcuts.map((item) => item.id === existing.id ? shortcut : item)
          : [...current.shortcuts, shortcut],
      }));
      setActiveCategory(category);
      setQuery('');
      closeShortcutModal();
      notify(existing ? '网站信息已更新' : '已添加到桌面');
    } catch (error) {
      notify(error instanceof Error ? error.message : '网址格式不正确');
    }
  }

  function openEventModal() {
    updatePreferences({ showSchedule: true });
    setEventDraft({ title: '', date: localDateKey(new Date()), time: '09:00' });
    setEventModalOpen(true);
  }

  function addEvent(event: FormEvent) {
    event.preventDefault();
    const title = eventDraft.title.trim();
    if (!title) return;
    const deskEvent: DeskEvent = { id: uid('event'), title, date: eventDraft.date, time: eventDraft.time };
    updateWorkspace((current) => ({ ...current, events: [...current.events, deskEvent] }));
    setEventModalOpen(false);
    notify('日程已保存到本机');
  }

  function removeEvent(id: string) {
    updateWorkspace((current) => ({ ...current, events: current.events.filter((event) => event.id !== id) }));
  }

  function openTimeEventModal(id = '') {
    setEditingTimeEventId(id);
    setTimeEventModalOpen(true);
  }

  function closeTimeEventModal() {
    setTimeEventModalOpen(false);
    setEditingTimeEventId('');
  }

  function saveTimeEvent(value: Omit<DeskTimeEvent, 'id'>) {
    setState((current) => {
      const nextEvent: DeskTimeEvent = { ...value, id: editingTimeEventId || uid('time-event') };
      return {
        ...current,
        timeEvents: editingTimeEventId
          ? current.timeEvents.map((event) => event.id === editingTimeEventId ? nextEvent : event)
          : [...current.timeEvents, nextEvent],
        preferences: { ...current.preferences, showTimeEvents: true },
      };
    });
    const updated = Boolean(editingTimeEventId);
    closeTimeEventModal();
    notify(updated ? '时间事件已更新' : '时间事件已添加');
  }

  function deleteTimeEvent() {
    if (!editingTimeEventId) return;
    setState((current) => ({ ...current, timeEvents: current.timeEvents.filter((event) => event.id !== editingTimeEventId) }));
    closeTimeEventModal();
    notify('时间事件已删除');
  }

  function setFocusPreset(minutes: number) {
    setFocusDuration(minutes);
    setFocusRemaining(minutes * 60);
    setFocusRunning(false);
    updatePreferences({ focusDurationMinutes: minutes });
  }

  function startFocus() {
    updatePreferences({ showFocusTimer: true });
    if (focusRemaining === 0) setFocusRemaining(focusDuration * 60);
    setFocusRunning(true);
  }

  function toggleFocus() {
    if (focusRemaining === 0) setFocusRemaining(focusDuration * 60);
    setFocusRunning((running) => !running);
  }

  function resetFocus() {
    setFocusRunning(false);
    setFocusRemaining(focusDuration * 60);
  }

  function updateReminder(id: string, next: Partial<DeskReminder>) {
    setState((current) => ({
      ...current,
      reminders: current.reminders.map((item) => item.id === id ? { ...item, ...next } : item),
    }));
  }

  function addReminder(draft: Pick<DeskReminder, 'title' | 'time' | 'kind'>): boolean {
    const title = draft.title.trim().replace(/\s+/g, ' ').slice(0, 30);
    if (!title || !draft.time) {
      notify('请填写提醒名称和时间');
      return false;
    }
    if (state.reminders.length >= 20) {
      notify('最多保留 20 个提醒');
      return false;
    }
    if (state.reminders.some((item) => item.title.trim().toLocaleLowerCase('zh-CN') === title.toLocaleLowerCase('zh-CN') && item.time === draft.time)) {
      notify('相同时间已有这条提醒');
      return false;
    }
    setState((current) => ({
      ...current,
      reminders: [...current.reminders, { id: uid('reminder'), title, time: draft.time, enabled: true, kind: draft.kind }],
    }));
    notify('已添加提醒');
    return true;
  }

  function removeReminder(id: string) {
    const index = state.reminders.findIndex((item) => item.id === id);
    const removed = state.reminders[index];
    if (!removed) return;
    setState((current) => ({ ...current, reminders: current.reminders.filter((item) => item.id !== id) }));
    notify(`已删除“${removed.title}”`, () => {
      setState((current) => {
        if (current.reminders.some((item) => item.id === removed.id)) return current;
        const reminders = [...current.reminders];
        reminders.splice(Math.min(index, reminders.length), 0, removed);
        return { ...current, reminders };
      });
    });
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      notify('当前浏览器不支持系统通知');
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    updatePreferences({ systemNotifications: enabled });
    notify(enabled ? '已开启系统通知' : '未获得系统通知权限');
  }

  function uploadBackground(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('请选择图片文件');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      notify('背景图请小于 1.5 MB');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        updatePreferences({ customBackground: reader.result });
        notify('背景已更换');
      }
    });
    reader.readAsDataURL(file);
  }

  function selectScene(scene: SceneId) {
    updatePreferences({ scene, customBackground: '' });
  }

  function resetWorkspaceView(next: DeskWorkspace) {
    setActiveCategory(next.categories[0] || '常用');
    setQuery('');
    setTaskDetailId('');
    setShortcutModalOpen(false);
    setShortcutManagerOpen(false);
    setShortcutGroupManagerOpen(false);
    setShortcutGroupsMenuOpen(false);
    setShortcutManageMenuOpen(false);
    setShortcutContextMenu(null);
    setCategoryContextMenu(null);
    setCategoryModalOpen(false);
    setEventModalOpen(false);
    setLayoutEditing(false);
  }

  function switchWorkspace(id: string) {
    const next = state.workspaces.find((item) => item.id === id);
    if (!next) return;
    setState((current) => ({ ...current, activeWorkspaceId: id }));
    resetWorkspaceView(next);
    setWorkspaceMenuOpen(false);
    setWorkspaceManagerOpen(false);
  }

  function addWorkspace(name: string): boolean {
    const value = cleanWorkspaceName(name);
    if (!value) {
      notify('请输入桌面名称');
      return false;
    }
    if (state.workspaces.length >= 8) {
      notify('最多创建 8 个桌面');
      return false;
    }
    if (state.workspaces.some((item) => item.name.localeCompare(value, 'zh-CN', { sensitivity: 'base' }) === 0)) {
      notify('已经有同名桌面');
      return false;
    }
    const next = createBlankWorkspace(uid('workspace'), value);
    setState((current) => ({ ...current, activeWorkspaceId: next.id, workspaces: [...current.workspaces, next] }));
    resetWorkspaceView(next);
    notify(`已创建“${value}”桌面`);
    return true;
  }

  function duplicateCurrentWorkspace(source: DeskWorkspace) {
    if (state.workspaces.length >= 8) {
      notify('最多创建 8 个桌面');
      return;
    }
    let copyName = cleanWorkspaceName(`${source.name}副本`);
    let suffix = 2;
    while (state.workspaces.some((item) => item.name.localeCompare(copyName, 'zh-CN', { sensitivity: 'base' }) === 0)) {
      copyName = `${source.name.slice(0, 9)} ${suffix}`.trim();
      suffix += 1;
    }
    const next = duplicateWorkspace(source, uid('workspace'), copyName);
    setState((current) => ({ ...current, activeWorkspaceId: next.id, workspaces: [...current.workspaces, next] }));
    resetWorkspaceView(next);
    notify(`已复制为“${copyName}”`);
  }

  function renameWorkspace(id: string, name: string): boolean {
    const value = cleanWorkspaceName(name);
    if (!value) {
      notify('桌面名称不能为空');
      return false;
    }
    if (state.workspaces.some((item) => item.id !== id && item.name.localeCompare(value, 'zh-CN', { sensitivity: 'base' }) === 0)) {
      notify('已经有同名桌面');
      return false;
    }
    setState((current) => ({
      ...current,
      workspaces: current.workspaces.map((item) => item.id === id ? { ...item, name: value } : item),
    }));
    notify('桌面已重命名');
    return true;
  }

  function reorderWorkspace(id: string, direction: -1 | 1) {
    setState((current) => ({ ...current, workspaces: moveWorkspace(current.workspaces, id, direction) }));
  }

  function removeWorkspace(target: DeskWorkspace) {
    if (state.workspaces.length === 1) {
      notify('至少保留一个桌面');
      return;
    }
    if (!window.confirm(`删除“${target.name}”桌面？其中的网站、任务、日程和便签都会删除。`)) return;
    const index = state.workspaces.findIndex((item) => item.id === target.id);
    const remaining = state.workspaces.filter((item) => item.id !== target.id);
    const next = remaining[Math.min(index, remaining.length - 1)];
    const wasActive = target.id === state.activeWorkspaceId;
    setState((current) => ({
      ...current,
      activeWorkspaceId: wasActive ? next.id : current.activeWorkspaceId,
      workspaces: current.workspaces.filter((item) => item.id !== target.id),
    }));
    if (wasActive) resetWorkspaceView(next);
    notify('桌面已删除', () => {
      setState((current) => {
        if (current.workspaces.some((item) => item.id === target.id)) return current;
        const workspaces = [...current.workspaces];
        workspaces.splice(Math.min(index, workspaces.length), 0, target);
        return { ...current, activeWorkspaceId: target.id, workspaces };
      });
      resetWorkspaceView(target);
    });
  }

  function exportDeskBackup() {
    const url = URL.createObjectURL(new Blob([serializeDeskBackup(state)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `WyanDesk-backup-${localDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('桌面数据已导出');
  }

  function exportRecoveryData() {
    const snapshot = readRecoverySnapshot();
    if (!snapshot) {
      notify('没有可下载的异常数据副本');
      return;
    }
    const url = URL.createObjectURL(new Blob([snapshot], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `WyanDesk-recovery-${localDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('异常数据副本已下载');
  }

  function exportCalendar() {
    const value = serializeWorkspaceICS(workspace);
    const url = URL.createObjectURL(new Blob([value], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `WyanDesk-${workspace.name}-${localDateKey(new Date())}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    notify('当前桌面日历已导出');
  }

  function importCalendar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('ICS 文件请小于 2 MB');
      return;
    }
    void file.text().then((value) => {
      const parsed = parseICS(value);
      const existing = new Set(workspace.events.map((item) => `${item.title}\n${item.date}\n${item.time}`));
      const additions = parsed.filter((item) => !existing.has(`${item.title}\n${item.date}\n${item.time}`));
      if (!additions.length) {
        notify('没有发现新的日程');
        return;
      }
      updateWorkspace((current) => ({ ...current, events: [...current.events, ...additions] }));
      notify(`已导入 ${additions.length} 条日程`);
    }).catch(() => notify('ICS 文件无法读取'));
  }

  function exportWorkspaceTemplate() {
    const value = serializeWorkspaceTemplate(workspace);
    const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `WyanDesk-template-${workspace.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('桌面模板已导出，不包含任务、便签和日程');
  }

  function importWorkspaceTemplate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (state.workspaces.length >= 8) {
      notify('最多创建 8 个桌面');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      notify('模板文件请小于 4 MB');
      return;
    }
    void file.text().then((value) => {
      let next = parseWorkspaceTemplate(value, uid('workspace'));
      let suffix = 2;
      while (state.workspaces.some((item) => item.name.localeCompare(next.name, 'zh-CN', { sensitivity: 'base' }) === 0)) {
        next = { ...next, name: `${next.name.slice(0, 9)} ${suffix}`.trim() };
        suffix += 1;
      }
      if (!window.confirm(`导入“${next.name}”模板？包含 ${next.shortcuts.length} 个网站，不包含原作者的任务、便签和日程。`)) return;
      setState((current) => ({ ...current, activeWorkspaceId: next.id, workspaces: [...current.workspaces, next] }));
      resetWorkspaceView(next);
      notify('桌面模板已导入');
    }).catch((cause) => notify(cause instanceof Error ? cause.message : '模板文件无法读取'));
  }

  function importDeskBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      notify('备份文件请小于 4 MB');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const imported = parseDeskBackup(String(reader.result || ''));
        const siteCount = imported.workspaces.reduce((count, item) => count + item.shortcuts.length, 0);
        if (!window.confirm(`导入备份会覆盖当前数据。文件中有 ${imported.workspaces.length} 个桌面和 ${siteCount} 个网站，继续吗？`)) return;
        setState(imported);
        const importedWorkspace = imported.workspaces.find((item) => item.id === imported.activeWorkspaceId) || imported.workspaces[0];
        setActiveCategory(importedWorkspace.categories[0]);
        setQuery('');
        notify('桌面数据已导入');
      } catch (error) {
        notify(error instanceof Error ? error.message : '备份文件无法读取');
      }
    });
    reader.readAsText(file);
  }

  function importBrowserBookmarks(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      notify('书签文件请小于 8 MB');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const imported = parseBrowserBookmarks(String(reader.result || ''));
        if (!imported.length) throw new Error('没有找到可导入的网页书签');
        const preview = mergeBrowserBookmarks(workspace.categories, workspace.shortcuts, imported, () => 'preview');
        if (!preview.added) {
          notify('这些书签已经在桌面中');
          return;
        }
        const categoryCount = new Set(imported.map((bookmark) => bookmark.category)).size;
        const detail = preview.skipped ? `，另有 ${preview.skipped} 个重复网址会跳过` : '';
        if (!window.confirm(`找到 ${imported.length} 个书签、${categoryCount} 个分类，可新增 ${preview.added} 个${detail}。继续导入吗？`)) return;
        updateWorkspace((current) => {
          const merged = mergeBrowserBookmarks(current.categories, current.shortcuts, imported, () => uid('shortcut'));
          return { ...current, categories: merged.categories, shortcuts: merged.shortcuts };
        });
        notify(`已导入 ${preview.added} 个浏览器书签`);
      } catch (error) {
        notify(error instanceof Error ? error.message : '书签文件无法读取');
      }
    });
    reader.readAsText(file);
  }

  async function installDeskApp() {
    try {
      const outcome = await pwa.requestInstall();
      if (outcome === 'unavailable') {
        openSettings('data');
        return;
      }
      notify(outcome === 'accepted' ? '微言桌面正在安装' : '已取消安装');
    } catch {
      notify('浏览器暂时无法打开安装窗口，请从浏览器菜单安装');
    }
  }

  function resetDesktop() {
    if (!window.confirm('恢复默认桌面？自定义网站、任务、便签、天气城市、本机剪贴板和设置将被清除。')) return;
    clearDeskState();
    const defaults = createDefaultState();
    setState(defaults);
    setFocusDuration(25);
    setFocusRemaining(25 * 60);
    setFocusRunning(false);
    setActiveCategory(defaults.workspaces[0].categories[0]);
    setSettingsOpen(false);
    setShortcutManagerOpen(false);
    setCategoryModalOpen(false);
    notify('已恢复默认桌面');
  }

  function dynamicCommandsForQuery(input: string): DeskCommand[] {
    const inboxMatch = input.trim().match(/^(?:收集|inbox)\s+(.+)$/i);
    if (inboxMatch) {
      const content = inboxMatch[1].trim();
      const preview = content.length > 34 ? `${content.slice(0, 34)}…` : content;
      return [{
        id: 'quick-inbox',
        label: `收集“${preview}”`,
        description: '先保存，之后再整理',
        keywords: '',
        icon: <Inbox />,
        run: () => addInboxItem('note', content),
      }];
    }
    const command = parseQuickCommand(input);
    if (!command) return [];
    const preview = command.value.length > 34 ? `${command.value.slice(0, 34)}…` : command.value;
    if (command.kind === 'task') {
      return [{
        id: 'quick-task',
        label: `新增任务“${preview}”`,
        description: `保存到“${workspace.name}”桌面`,
        keywords: '',
        icon: <ListTodo />,
        run: () => {
          updatePreferences({ showTasks: true });
          addTaskText(command.value);
        },
      }];
    }
    const labels = { google: 'Google 搜索', baidu: '百度搜索', bing: '必应搜索', translate: '翻译' } as const;
    return [{
      id: `quick-${command.kind}`,
      label: `${labels[command.kind]}“${preview}”`,
      description: '在新标签页中打开',
      keywords: '',
      icon: command.kind === 'translate' ? <Languages /> : <Search />,
      run: () => openExternal(quickCommandURL(command)),
    }];
  }

  const deskCommands: DeskCommand[] = [
    { id: 'new-task', label: '新任务', description: '添加内容、日期与提醒', keywords: '任务 待办 todo', icon: <ListTodo />, run: () => setTaskCreateModalOpen(true) },
    { id: 'new-event', label: '新日程', description: '添加日期和时间', keywords: '日程 日历 安排 calendar', icon: <CalendarPlus />, run: openEventModal },
    { id: 'new-time-event', label: '时间事件', description: '累计日或目标倒计时', keywords: '纪念日 倒计时 累计 天数 countdown anniversary', icon: <CalendarClock />, run: () => openTimeEventModal() },
    { id: 'open-inbox', label: '打开收集箱', description: `${state.inbox.length} 条待整理内容`, keywords: '收集箱 临时 记录 inbox capture', icon: <Inbox />, run: () => openInbox() },
    { id: 'read-later', label: '稍后阅读', description: `${state.inbox.filter((item) => item.kind === 'link' && !item.readAt).length} 条未读资料`, keywords: '阅读 摘录 收藏 资料 read later', icon: <BookMarked />, run: () => openInbox('link') },
    { id: 'start-focus', label: '开始专注', description: `${focusDuration} 分钟专注计时`, keywords: '专注 番茄钟 计时 timer', icon: <TimerReset />, run: startFocus },
    { id: 'shortcut-groups', label: '管理网站组合', description: '创建或编辑一组常用网站', keywords: '组合 分组 标签页 工作组 group tabs', icon: <FolderOpen />, run: () => setShortcutGroupManagerOpen(true) },
    { id: 'wyan-tools', label: '微言工具', description: '图片、PDF、表格与文本工具', keywords: '工具箱 图片 pdf 表格', icon: <Wrench />, run: () => openShortcutById('wyan-tools', 'https://tools.wyanhub.com/tools') },
    { id: 'translate', label: '在线翻译', description: '打开百度翻译', keywords: '翻译 英语 translate', icon: <Languages />, run: () => openExternal('https://fanyi.baidu.com') },
    { id: 'meeting', label: '发起会议', description: '打开腾讯会议', keywords: '会议 视频 meeting', icon: <Video />, run: () => openShortcutById('tencent-meeting', 'https://meeting.tencent.com') },
    { id: 'add-shortcut', label: '添加网站', description: '收藏一个常用网址', keywords: '网站 网址 收藏 shortcut', icon: <Plus />, run: openShortcutModal },
    { id: 'manage-shortcuts', label: '管理网站', description: '编辑、排序或移动当前分类网站', keywords: '网站 编辑 排序 管理 shortcut', icon: <Pencil />, run: openShortcutManager },
    { id: 'manage-categories', label: '管理分类', description: '新增、排序或整理网站分类', keywords: '分类 分组 排序 category', icon: <Grid3X3 />, run: () => setCategoryModalOpen(true) },
    { id: 'manage-workspaces', label: '管理桌面', description: '新建、复制或切换桌面', keywords: '桌面 工作 学习 生活 workspace', icon: <Layers3 />, run: () => setWorkspaceManagerOpen(true) },
    { id: 'edit-layout', label: '调整卡片布局', description: `调整“${workspace.name}”的卡片尺寸`, keywords: '布局 卡片 宽度 高度 放大 缩小 layout resize', icon: <AppWindow />, run: enterLayoutEditing },
    { id: 'import-bookmarks', label: '导入浏览器书签', description: '从 Chrome、Edge 或 Firefox 迁移网站', keywords: '书签 收藏 导入 bookmark chrome edge firefox', icon: <BookMarked />, run: () => openSettings('data') },
    ...(!extensionRuntime ? [{ id: 'install-browser-extension', label: '安装浏览器扩展', description: '下载测试版 ZIP 并查看 Chrome / Edge 安装步骤', keywords: '安装 扩展 插件 zip chrome edge extension', icon: <Download />, run: () => openSettings('data') }] : []),
    { id: 'open-settings', label: '桌面设置', description: '背景、组件与提醒', keywords: '设置 背景 组件 setting', icon: <Settings />, run: () => openSettings() },
    { id: 'keyboard-help', label: '键盘快捷操作', description: '查看搜索与命令快捷键', keywords: '快捷键 键盘 shortcut help', icon: <Keyboard />, run: () => setKeyboardHelpOpen(true) },
    ...(pwa.installMode === 'prompt' ? [{ id: 'install-app', label: '安装到桌面', description: '作为独立应用打开微言桌面', keywords: '安装 桌面 应用 pwa install', icon: <Download />, run: installDeskApp }] : []),
    ...(['ios-safari', 'ios-other', 'browser'].includes(pwa.installMode) ? [{ id: 'install-help', label: '查看安装方法', description: '把微言桌面添加到手机或电脑桌面', keywords: '安装 主屏幕 pwa install', icon: <AppWindow />, run: () => openSettings('data') }] : []),
    { id: 'lock-desktop', label: '锁定桌面', description: '全屏隐藏私人内容', keywords: '锁屏 隐私 lock', icon: <Lock />, run: () => lockDesktop(true) },
    ...state.workspaces.filter((item) => item.id !== workspace.id).map((item) => ({
      id: `switch-workspace-${item.id}`,
      label: `切换到“${item.name}”`,
      description: `${item.shortcuts.length} 个网站 · ${item.tasks.filter((task) => !task.done).length} 个待办`,
      keywords: `桌面 切换 workspace ${item.name}`,
      icon: <Layers3 />,
      run: () => switchWorkspace(item.id),
    })),
    ...workspace.shortcutGroups.map((group) => ({
      id: `open-group-${group.id}`,
      label: group.title,
      description: `打开 ${group.shortcutIds.filter((id) => workspace.shortcuts.some((shortcut) => shortcut.id === id)).length} 个网站`,
      keywords: '网站组合 工作组 group tabs',
      icon: <FolderOpen />,
      run: () => openShortcutGroup(group),
    })),
  ];
  const quickActionCandidates: DeskCommand[] = [
    ...deskCommands.filter((command) => pinnableQuickActionIds.has(command.id) || command.id.startsWith('open-group-')),
    ...workspace.shortcuts.map((shortcut) => ({
      id: `open-shortcut-${shortcut.id}`,
      label: shortcut.title,
      description: `${shortcut.category} · 快捷网站`,
      keywords: `${shortcut.title} ${shortcut.category} ${shortcut.description || ''} ${shortcut.url}`,
      icon: <span style={{ color: shortcut.accent }}>{shortcut.icon}</span>,
      run: () => openShortcut(shortcut),
    })),
  ];
  const quickActionById = new Map(quickActionCandidates.map((command) => [command.id, command]));
  const configuredQuickActions = workspace.quickActionIds.map((id) => quickActionById.get(id)).filter((command): command is DeskCommand => Boolean(command));
  const primaryQuickActions = configuredQuickActions.length
    ? configuredQuickActions
    : DEFAULT_QUICK_ACTION_IDS.map((id) => quickActionById.get(id)).filter((command): command is DeskCommand => Boolean(command));

  function saveQuickActions(ids: string[]) {
    const allowedIds = new Set(quickActionCandidates.map((command) => command.id));
    const nextIds = [...new Set(ids)].filter((id) => allowedIds.has(id)).slice(0, MAX_QUICK_ACTIONS);
    if (!nextIds.length) {
      notify('请至少保留一个快捷操作');
      return;
    }
    updateWorkspace((current) => ({ ...current, quickActionIds: nextIds }));
    setQuickActionsManagerOpen(false);
    notify('快捷操作已更新');
  }

  const timeLabel = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateLabel = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const lockDateLabel = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const nextReminderTomorrow = nextReminder ? minutesFromTime(nextReminder.time) < now.getHours() * 60 + now.getMinutes() : false;
  const railComponentControls: Record<DeskRailWidgetId, { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }> = {
    quickActions: { label: '快捷操作', description: '常用功能入口', checked: state.preferences.showQuickActions, onChange: (checked) => updatePreferences({ showQuickActions: checked }) },
    schedule: { label: '今日日程', description: '近期日程安排', checked: state.preferences.showSchedule, onChange: (checked) => updatePreferences({ showSchedule: checked }) },
    focus: { label: '专注计时', description: '自定义专注时长', checked: state.preferences.showFocusTimer, onChange: (checked) => updatePreferences({ showFocusTimer: checked }) },
    reminders: { label: '下一提醒', description: '上班、喝水与休息', checked: state.preferences.showReminders, onChange: (checked) => updatePreferences({ showReminders: checked }) },
    tasks: { label: '今日任务', description: '待办与今日重点', checked: state.preferences.showTasks, onChange: (checked) => updatePreferences({ showTasks: checked }) },
    notes: { label: '工作便签', description: '临时记录想法', checked: state.preferences.showNotes, onChange: (checked) => updatePreferences({ showNotes: checked }) },
    calendar: { label: '月历', description: '查看月份与事项日期', checked: state.preferences.showCalendar, onChange: (checked) => updatePreferences({ showCalendar: checked }) },
    calculator: { label: '快速计算', description: '无需离开桌面的计算器', checked: state.preferences.showCalculator, onChange: (checked) => updatePreferences({ showCalculator: checked }) },
    worldClock: { label: '世界时钟', description: '跨地区工作时间', checked: state.preferences.showWorldClock, onChange: (checked) => updatePreferences({ showWorldClock: checked }) },
    dailyOverview: { label: '今日概览', description: '汇总待办、日程与提醒', checked: state.preferences.showDailyOverview, onChange: (checked) => updatePreferences({ showDailyOverview: checked }) },
    weather: { label: '天气', description: '手动选择城市，半小时缓存', checked: state.preferences.showWeather, onChange: (checked) => updatePreferences({ showWeather: checked }) },
    clipboard: { label: '剪贴板', description: '点击读取，只保存在本机', checked: state.preferences.showClipboard, onChange: (checked) => updatePreferences({ showClipboard: checked }) },
    countdown: { label: '倒数日', description: '展示最近的目标日期', checked: state.preferences.showCountdown, onChange: (checked) => updatePreferences({ showCountdown: checked }) },
  };
  const visibleRailWidgetOrder = workspace.layout.widgetOrder.filter((id) => railComponentControls[id].checked);
  const displayedRailWidgetOrder = layoutEditing ? visibleRailWidgetOrder : railWidgetOrderForDisplay(workspace.layout, visibleRailWidgetOrder);
  const settingsSceneLabel = state.preferences.customBackground
    ? '自定义背景'
    : sceneOptions.find((scene) => scene.id === state.preferences.scene)?.name || '默认背景';
  const enabledRailWidgetCount = Object.values(railComponentControls).filter((item) => item.checked).length;
  const enabledAuxiliaryContentCount = Number(state.preferences.showRecent) + Number(state.preferences.showTimeEvents);
  const settingsSyncSummary = deskSync.user
    ? deskSync.status === 'saving'
      ? '正在同步'
      : deskSync.status === 'locked'
        ? '等待同步密码'
        : deskSync.status === 'conflict'
          ? '需要选择版本'
          : deskSync.status === 'error'
            ? '同步暂时中断'
            : deskSync.status === 'local'
              ? '仅保留本机'
              : '本机与云端已连接'
    : '本机桌面';
  const mobileSyncLabel = deskSync.user
    ? deskSync.status === 'saving'
      ? '正在同步'
      : deskSync.status === 'checking'
        ? '正在检查'
        : deskSync.status === 'locked'
          ? '等待解锁'
          : deskSync.status === 'conflict'
            ? '需要选择版本'
            : deskSync.status === 'error'
              ? '同步中断'
              : deskSync.status === 'local'
                ? '仅保存在本机'
                : '已同步'
    : '未登录 · 仅本机';
  const settingsLockSummary = state.preferences.autoLockMinutes
    ? `${state.preferences.autoLockMinutes} 分钟后锁定${lockPinEnabled ? ' · 有密码' : ''}`
    : lockPinEnabled ? '手动锁定 · 有密码' : '自动锁定已关闭';
  const activeSettingsMeta = settingsViewMeta[settingsView];

  function renderDailyOverviewCard() {
    return (
      <DailyOverviewCard
        tasks={orderedTasks}
        openTaskCount={openTaskCount}
        focusTaskId={workspace.focusTaskId}
        todayKey={todayKey}
        nextEvent={upcomingEvents[0]}
        nextReminder={nextReminder || undefined}
        onAddTask={addTaskText}
        onAddEvent={openEventModal}
        onOpenTask={setTaskDetailId}
        onToggleTask={toggleTask}
      />
    );
  }

  function renderRailWidget(id: DeskRailWidgetId) {
    const dragProps = {
      dragging: draggingWidgetId === id,
      dropTarget: dragTargetWidgetId === id,
      onDragStart: () => startDraggedRailWidget(id),
      onDragMove: (_widgetId: DeskWidgetId, clientX: number, clientY: number) => moveDraggedRailWidget(id, clientX, clientY),
      onDragEnd: () => finishDraggedRailWidget(id),
    };
    if (id === 'quickActions') return state.preferences.showQuickActions ? (
      <WidgetFrame key={id} id={id} label="快捷操作" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <QuickActionsCard actions={primaryQuickActions} onOpenAll={() => setCommandOpen(true)} onManage={() => setQuickActionsManagerOpen(true)} />
      </WidgetFrame>
    ) : null;

    if (id === 'schedule') return state.preferences.showSchedule ? (
      <WidgetFrame key={id} id={id} label="今日日程" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <ScheduleCard events={upcomingEvents} todayKey={todayKey} limit={widgetItemLimit(workspace.layout.widgets[id].height, 1, 3, 5)} onAdd={openEventModal} onRemove={removeEvent} />
      </WidgetFrame>
    ) : null;

    if (id === 'focus') return state.preferences.showFocusTimer ? (
      <WidgetFrame key={id} id={id} label="专注计时" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <FocusTimerCard durationMinutes={focusDuration} remainingSeconds={focusRemaining} running={focusRunning} onPreset={setFocusPreset} onToggle={toggleFocus} onReset={resetFocus} />
      </WidgetFrame>
    ) : null;

    if (id === 'reminders') return state.preferences.showReminders ? (
      <WidgetFrame key={id} id={id} label="下一提醒" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <section className="glass-panel reminder-card">
          <div className="mini-heading"><span><BellRing aria-hidden="true" />下一提醒</span><button type="button" onClick={() => setReminderSettingsOpen(true)}>设置</button></div>
          {nextReminder ? (
            <div className="next-reminder">
              <span className={`reminder-symbol ${nextReminder.kind}`}>{reminderIcons[nextReminder.kind]}</span>
              <div><strong>{nextReminder.title}</strong><small>{nextReminderTomorrow ? '明天 ' : '今天 '}{nextReminder.time}</small></div>
              <span className="reminder-count">{enabledReminderCount}</span>
            </div>
          ) : <div className="rail-empty">今天没有提醒</div>}
        </section>
      </WidgetFrame>
    ) : null;

    if (id === 'tasks') return state.preferences.showTasks ? (
      <WidgetFrame key={id} id={id} label="今日任务" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <section className="glass-panel tasks-card">
          <div className="mini-heading"><span><ListTodo aria-hidden="true" />今日任务</span><small>{openTaskCount} 待完成</small></div>
          <form className="quick-add" onSubmit={addTask}>
            <input ref={taskInputRef} value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="记录一个任务" aria-label="新任务" />
            <button type="submit" aria-label="添加任务"><CirclePlus aria-hidden="true" /></button>
          </form>
          <div className="task-list">
            {orderedTasks.slice(0, widgetItemLimit(workspace.layout.widgets[id].height, 3, 6, 10)).map((task) => (
              <div className={`task-row${task.done ? ' done' : ''}${workspace.focusTaskId === task.id ? ' focused' : ''}`} key={task.id}>
                <button className="task-check" type="button" onClick={() => toggleTask(task.id)} aria-label={task.done ? '标记未完成' : '标记完成'}>{task.done && <Check />}</button>
                <button className="task-title-button" type="button" onClick={() => setTaskDetailId(task.id)} title={task.text} data-full-text={task.text} aria-label={`查看任务：${task.text}`}><span>{task.text}</span>{task.dueDate && <small className={task.dueDate < todayKey && !task.done ? 'overdue' : ''}>{task.dueDate === todayKey ? '今天' : task.dueDate.slice(5)}{task.reminderTime ? ` ${task.reminderTime}` : ''}</small>}</button>
                <button className="task-focus" type="button" onClick={() => toggleFocusTask(task.id)} disabled={task.done} aria-label={workspace.focusTaskId === task.id ? '取消今日重点' : '设为今日重点'} title={workspace.focusTaskId === task.id ? '今日重点' : '设为今日重点'}><Star fill={workspace.focusTaskId === task.id ? 'currentColor' : 'none'} /></button>
                <button className="task-delete" type="button" onClick={() => removeTask(task.id)} aria-label="删除任务"><Trash2 /></button>
              </div>
            ))}
            {!workspace.tasks.length && <div className="rail-empty">今天没有任务</div>}
          </div>
        </section>
      </WidgetFrame>
    ) : null;

    if (id === 'notes') return state.preferences.showNotes ? (
      <WidgetFrame key={id} id={id} label="工作便签" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <section className="glass-panel note-card">
          <div className="mini-heading"><span><StickyNote aria-hidden="true" />工作便签</span><small>自动保存</small></div>
          <textarea value={workspace.note} onChange={(event) => updateWorkspace((current) => ({ ...current, note: event.target.value }))} placeholder="临时记下一个想法…" aria-label="工作便签" />
        </section>
      </WidgetFrame>
    ) : null;

    if (id === 'calendar') return state.preferences.showCalendar ? (
      <WidgetFrame key={id} id={id} label="月历" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <MonthCalendarCard now={now} events={workspace.events} tasks={workspace.tasks} />
      </WidgetFrame>
    ) : null;

    if (id === 'calculator') return state.preferences.showCalculator ? (
      <WidgetFrame key={id} id={id} label="快速计算" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <CalculatorCard />
      </WidgetFrame>
    ) : null;

    if (id === 'worldClock') return state.preferences.showWorldClock ? (
      <WidgetFrame key={id} id={id} label="世界时钟" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <WorldClockCard now={now} selectedZoneIds={state.preferences.worldClockZones} limit={widgetItemLimit(workspace.layout.widgets[id].height, 2, 3, 5)} onConfigure={() => setWorldClockSettingsOpen(true)} />
      </WidgetFrame>
    ) : null;

    if (id === 'dailyOverview') return state.preferences.showDailyOverview ? (
      <WidgetFrame key={id} id={id} label="今日概览" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        {renderDailyOverviewCard()}
      </WidgetFrame>
    ) : null;

    if (id === 'weather') return state.preferences.showWeather ? (
      <WidgetFrame key={id} id={id} label="天气" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <WeatherCard />
      </WidgetFrame>
    ) : null;

    if (id === 'clipboard') return state.preferences.showClipboard ? (
      <WidgetFrame key={id} id={id} label="剪贴板" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <ClipboardCard now={now} limit={widgetItemLimit(workspace.layout.widgets[id].height, 1, 3, 6)} />
      </WidgetFrame>
    ) : null;

    if (id === 'countdown') return state.preferences.showCountdown ? (
      <WidgetFrame key={id} id={id} label="倒数日" size={workspace.layout.widgets[id]} editing={layoutEditing} onChange={(next) => updateCurrentWidget(id, next)} {...dragProps}>
        <CountdownCard events={state.timeEvents} now={now} limit={widgetItemLimit(workspace.layout.widgets[id].height, 1, 3, 6)} onAdd={() => openTimeEventModal()} onEdit={openTimeEventModal} />
      </WidgetFrame>
    ) : null;

    return null;
  }

  return (
    <div className={`desk-app theme-${state.preferences.scene}`}>
      <SceneBackdrop
        scene={state.preferences.scene}
        motion={state.preferences.sceneMotion}
        customBackground={state.preferences.customBackground}
      />

      <div className={`desktop-content${isLocked ? ' is-locked' : ''}${layoutEditing ? ' layout-mode-active' : ''}`}>

      <header className="desk-header">
        <a className="brand" href={deskHomeURL()} aria-label="微言桌面首页">
          <span className="brand-mark">W</span>
          <span className="brand-copy"><strong>微言桌面</strong><small>个人效率桌面</small></span>
        </a>
        <div className="header-actions">
          <div className="workspace-switcher-wrap">
            <button
              ref={workspaceTriggerRef}
              className={`workspace-trigger${workspaceMenuOpen ? ' active' : ''}`}
              type="button"
              onClick={() => { setWorkspaceMenuOpen((value) => !value); setSwitcherOpen(false); setAccountMenuOpen(false); }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                event.preventDefault();
                const focusLast = event.key === 'ArrowUp';
                setWorkspaceMenuOpen(true);
                setSwitcherOpen(false);
                setAccountMenuOpen(false);
                window.requestAnimationFrame(() => {
                  const items = popoverMenuItems(workspacePopoverRef.current);
                  items[focusLast ? items.length - 1 : 0]?.focus();
                });
              }}
              aria-label="切换桌面"
              aria-expanded={workspaceMenuOpen}
              aria-haspopup="menu"
              aria-controls="workspaceMenu"
            >
              <Layers3 aria-hidden="true" /><span>{workspace.name}</span><ChevronDown aria-hidden="true" />
            </button>
            {workspaceMenuOpen && (
              <div ref={workspacePopoverRef} id="workspaceMenu" className="workspace-popover" role="menu" aria-label="切换桌面" onKeyDown={(event) => handlePopoverNavigation(event, workspacePopoverRef.current)}>
                <div className="popover-heading"><strong>切换桌面</strong><span>{state.workspaces.length}/8</span></div>
                <div className="workspace-menu-list">
                  {state.workspaces.map((item) => (
                    <button key={item.id} className={item.id === workspace.id ? 'active' : ''} type="button" role="menuitemradio" aria-checked={item.id === workspace.id} onClick={() => switchWorkspace(item.id)}>
                      <span><strong>{item.name}</strong><small>{item.shortcuts.length} 个网站 · {item.tasks.filter((task) => !task.done).length} 个待办</small></span>
                      {item.id === workspace.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <button className="workspace-manage-link" type="button" role="menuitem" onClick={() => { setWorkspaceMenuOpen(false); setWorkspaceManagerOpen(true); }}><Settings />管理桌面</button>
              </div>
            )}
          </div>
          <div className="app-switcher-wrap">
            <button
              ref={appSwitcherTriggerRef}
              className={`icon-button${switcherOpen ? ' active' : ''}`}
              type="button"
              onClick={() => { setSwitcherOpen((value) => !value); setWorkspaceMenuOpen(false); setAccountMenuOpen(false); }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                event.preventDefault();
                const focusLast = event.key === 'ArrowUp';
                setSwitcherOpen(true);
                setWorkspaceMenuOpen(false);
                setAccountMenuOpen(false);
                window.requestAnimationFrame(() => {
                  const items = popoverMenuItems(appSwitcherPopoverRef.current);
                  items[focusLast ? items.length - 1 : 0]?.focus();
                });
              }}
              aria-label="微言应用"
              aria-expanded={switcherOpen}
              aria-haspopup="menu"
              aria-controls="appSwitcherMenu"
            >
              <Grid3X3 aria-hidden="true" />
            </button>
            {switcherOpen && (
              <div ref={appSwitcherPopoverRef} id="appSwitcherMenu" className="app-switcher" role="menu" aria-label="微言应用" onKeyDown={(event) => handlePopoverNavigation(event, appSwitcherPopoverRef.current)}>
                <div className="popover-heading"><strong>微言应用</strong><a href="https://wyanhub.com" target="_blank" rel="noreferrer" role="menuitem">WyanHub <ChevronRight /></a></div>
                <div className="switcher-grid">
                  {wyanProducts.slice(1, 7).map((product) => (
                    <a key={product.id} href={product.url} target="_blank" rel="noreferrer" role="menuitem">
                      <span style={{ '--shortcut-color': product.accent } as React.CSSProperties}>{product.icon}</span>
                      <small>{product.title.replace('微言', '')}</small>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className={`text-button assistant-header-button${assistantOpen ? ' active' : ''}`}
            type="button"
            onClick={() => { setAssistantOpen(true); setSwitcherOpen(false); setWorkspaceMenuOpen(false); setAccountMenuOpen(false); }}
            aria-label="打开 WyanHub 助手"
            aria-haspopup="dialog"
            aria-expanded={assistantOpen}
            title="WyanHub 助手"
          >
            <Sparkles aria-hidden="true" /><span>助手</span>
          </button>
          {state.inbox.length > 0 && <button className="icon-button inbox-trigger" type="button" onClick={() => openInbox()} aria-label={`收集箱，${state.inbox.length} 条待整理`} title="收集箱"><Inbox aria-hidden="true" /><span>{Math.min(state.inbox.length, 99)}</span></button>}
          <SlowMessages userKey={isLocked ? null : deskSync.user?.userId ?? null} />
          <button className={`text-button layout-header-button${layoutEditing ? ' active' : ''}`} type="button" onClick={() => layoutEditing ? setLayoutEditing(false) : enterLayoutEditing()} aria-label={layoutEditing ? '完成桌面布局调整' : '调整桌面布局和组件顺序'} aria-pressed={layoutEditing} title={layoutEditing ? '完成布局调整' : '调整桌面布局和组件顺序'}><AppWindow aria-hidden="true" /><span>{layoutEditing ? '完成布局' : '调整布局'}</span></button>
          <div className="account-menu-wrap">
            <button
              ref={accountTriggerRef}
              className={`account-trigger${accountMenuOpen ? ' active' : ''}${deskSync.user ? ' cloud-active' : ''}`}
              type="button"
              onClick={() => { setAccountMenuOpen((value) => !value); setSwitcherOpen(false); setWorkspaceMenuOpen(false); }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                event.preventDefault();
                const focusLast = event.key === 'ArrowUp';
                setAccountMenuOpen(true);
                setSwitcherOpen(false);
                setWorkspaceMenuOpen(false);
                window.requestAnimationFrame(() => {
                  const items = popoverMenuItems(accountPopoverRef.current);
                  items[focusLast ? items.length - 1 : 0]?.focus();
                });
              }}
              aria-label={deskSync.user ? `账号与更多，当前账号 ${deskSync.user.userName}` : '本地桌面与更多'}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              aria-controls="accountMenu"
            >
              {deskSync.user ? <Cloud aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
              <span>{deskSync.user ? deskSync.user.userName : deskSync.status === 'checking' ? '正在连接' : '本地'}</span>
              <ChevronDown aria-hidden="true" />
            </button>
            {accountMenuOpen && (
              <div ref={accountPopoverRef} id="accountMenu" className="account-popover" role="menu" aria-label="账号与更多" onKeyDown={(event) => handlePopoverNavigation(event, accountPopoverRef.current)}>
                <div className="account-summary">
                  <span className={deskSync.user ? 'cloud-active' : ''}>{deskSync.user ? <Cloud aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}</span>
                  <div><strong>{deskSync.user ? deskSync.user.userName : '本地桌面'}</strong><small>{settingsSyncSummary}</small></div>
                </div>
                <button type="button" role="menuitem" onClick={deskSync.user ? () => openSettings('sync') : () => { setAccountMenuOpen(false); deskSync.login(); }}>
                  {deskSync.user ? <Cloud aria-hidden="true" /> : <LogIn aria-hidden="true" />}<span><strong>{deskSync.user ? '账号与同步' : '登录并同步'}</strong><small>{deskSync.user ? '查看同步状态和历史版本' : '跨设备保留桌面数据'}</small></span><ChevronRight aria-hidden="true" />
                </button>
                <button type="button" role="menuitem" onClick={() => lockDesktop(true)}><Lock aria-hidden="true" /><span><strong>锁定桌面</strong><small>临时隐藏当前桌面内容</small></span></button>
                <button type="button" role="menuitem" onClick={() => openSettings()}><Settings aria-hidden="true" /><span><strong>桌面设置</strong><small>外观、组件与数据</small></span><ChevronRight aria-hidden="true" /></button>
                {deskSync.user && (
                  <button
                    className="account-logout-button"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      void deskSync.logout().catch((cause) => notify(cause instanceof Error ? cause.message : '退出失败，请稍后重试'));
                    }}
                  >
                    <LogOut aria-hidden="true" /><span><strong>退出账号</strong><small>本机桌面数据会保留</small></span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="desk-main">
        <section className="welcome" aria-labelledby="welcomeTitle">
          <p>{dateLabel}</p>
          <h1 id="welcomeTitle"><time>{timeLabel}</time><span>{greeting(now.getHours())}</span></h1>
          <form
            className="desk-search"
            onSubmit={submitSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchFocused(false);
            }}
            role="search"
          >
            <Search aria-hidden="true" />
            <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站或输入关键词" aria-label="搜索网站或网页" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><X /></button>}
            <button className="command-trigger" type="button" onClick={() => { setCommandInitialQuery(query); setCommandOpen(true); }} aria-label="搜索全部桌面内容"><Command /><span>全部内容</span></button>
            {showRecentSearchSuggestions && (
              <section className="search-recent-suggestions" aria-label="最近使用的网站">
                <div className="search-recent-label"><History aria-hidden="true" /><span>最近打开</span></div>
                <div className="search-recent-list">
                  {recentSearchSuggestions.map((shortcut) => (
                    <button key={shortcut.id} type="button" onClick={() => { openShortcut(shortcut); setSearchFocused(false); }} title={shortcut.title}>
                      <span style={{ '--shortcut-color': shortcut.accent } as React.CSSProperties}>{shortcut.icon}</span><small>{shortcut.title}</small>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </form>
        </section>

        <div className="desk-layout" data-rail-width={workspace.layout.railWidth} data-mobile-priority={state.preferences.mobileLayoutPriority}>
          <div className="mobile-today-shell">
            {state.preferences.showDailyOverview && renderDailyOverviewCard()}
          </div>

          <section className="mobile-capture-strip glass-panel" aria-label="快速记录与同步">
            <div className="mobile-capture-heading">
              <span><Inbox aria-hidden="true" /><strong>快速记录</strong></span>
              <button type="button" onClick={deskSync.user ? () => openSettings('sync') : deskSync.login} aria-label={deskSync.user ? `同步状态：${mobileSyncLabel}` : '未登录，点击登录并同步'}>
                {deskSync.user ? <Cloud aria-hidden="true" /> : <CloudOff aria-hidden="true" />}<span>{mobileSyncLabel}</span>
              </button>
            </div>
            <div className="mobile-capture-actions">
              <button type="button" onClick={() => openInbox('task')}><ListTodo aria-hidden="true" /><span>任务</span></button>
              <button type="button" onClick={() => openInbox('note')}><StickyNote aria-hidden="true" /><span>想法</span></button>
              <button type="button" onClick={() => openInbox('link')}><BookMarked aria-hidden="true" /><span>网址</span></button>
            </div>
          </section>

          <div className="desk-primary">
          {extensionRuntime && <ContinueWorkCard workspaceName={workspace.name} />}
          {state.inbox.some((item) => item.kind === 'link' && !item.readAt) && <section className="reading-strip glass-panel" aria-label="稍后阅读"><BookMarked aria-hidden="true" /><strong>稍后阅读</strong><span>{state.inbox.filter((item) => item.kind === 'link' && !item.readAt).length} 条未读</span><button className="quiet-button" type="button" onClick={() => openInbox('link')}>继续阅读<ChevronRight aria-hidden="true" /></button></section>}
          {state.preferences.showTimeEvents && state.timeEvents.length > 0 && (
            <TimeEventsStrip events={state.timeEvents} now={now} onAdd={() => openTimeEventModal()} onEdit={openTimeEventModal} />
          )}
          <WidgetFrame id="shortcuts" label="快捷网站" size={workspace.layout.widgets.shortcuts} editing={layoutEditing} allowWide={false} onChange={(next) => updateCurrentWidget('shortcuts', next)}>
          <section className="shortcut-section glass-panel" aria-labelledby="shortcutsTitle">
            <div className="panel-heading shortcut-heading">
              <div>
                <h2 id="shortcutsTitle">{query ? '搜索结果' : '快捷网站'}</h2>
                <span>{query ? `${visibleShortcuts.length} 个匹配` : `${visibleShortcuts.length} 个网站`}</span>
              </div>
              <div className="heading-actions">
                <div className="shortcut-groups-wrap">
                  <button
                    ref={shortcutGroupsTriggerRef}
                    className={`quiet-button shortcut-groups-trigger${shortcutGroupsMenuOpen ? ' active' : ''}`}
                    type="button"
                    onClick={() => {
                      setShortcutManageMenuOpen(false);
                      setShortcutGroupsMenuOpen((value) => !value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                      event.preventDefault();
                      const focusLast = event.key === 'ArrowUp';
                      setShortcutManageMenuOpen(false);
                      setShortcutGroupsMenuOpen(true);
                      window.requestAnimationFrame(() => {
                        const items = popoverMenuItems(shortcutGroupsPopoverRef.current);
                        items[focusLast ? items.length - 1 : 0]?.focus();
                      });
                    }}
                    aria-label={`选择网站组合，共 ${workspace.shortcutGroups.length} 个`}
                    aria-expanded={shortcutGroupsMenuOpen}
                    aria-haspopup="menu"
                    aria-controls="shortcutGroupsMenu"
                  >
                    <FolderOpen aria-hidden="true" />网站组合{workspace.shortcutGroups.length > 0 && <span>{workspace.shortcutGroups.length}</span>}
                  </button>
                  {shortcutGroupsMenuOpen && (
                    <div ref={shortcutGroupsPopoverRef} id="shortcutGroupsMenu" className="shortcut-groups-menu" role="menu" aria-label="选择要打开的网站组合" onKeyDown={(event) => handlePopoverNavigation(event, shortcutGroupsPopoverRef.current)}>
                      <div className="shortcut-groups-menu-heading"><strong>选择组合</strong><small>{workspace.shortcutGroups.length} 个组合</small></div>
                      {workspace.shortcutGroups.length > 0 ? (
                        <div className="shortcut-groups-list">
                          {workspace.shortcutGroups.map((group) => {
                            const count = group.shortcutIds.filter((id) => workspace.shortcuts.some((shortcut) => shortcut.id === id)).length;
                            return (
                              <button
                                className="shortcut-group-launch"
                                key={group.id}
                                type="button"
                                role="menuitem"
                                disabled={!count}
                                onClick={() => {
                                  if (openShortcutGroup(group)) setShortcutGroupsMenuOpen(false);
                                }}
                              >
                                <FolderOpen aria-hidden="true" />
                                <span className="shortcut-group-launch-copy"><strong>{group.title}</strong><small>{count ? `${count} 个网站` : '需要先选择网站'}</small></span>
                                <span className="shortcut-group-launch-action"><Play aria-hidden="true" />打开全部</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="shortcut-groups-empty"><strong>还没有网站组合</strong><small>新建后可一次打开一组网站</small></div>
                      )}
                      <button className="shortcut-groups-manage" type="button" role="menuitem" onClick={() => { setShortcutGroupsMenuOpen(false); setShortcutGroupManagerOpen(true); }}>
                        <Settings aria-hidden="true" /><span><strong>{workspace.shortcutGroups.length ? '管理网站组合' : '新建网站组合'}</strong><small>添加、编辑或删除组合</small></span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="shortcut-manage-wrap">
                  <button
                    ref={shortcutManageTriggerRef}
                    className={`quiet-button shortcut-manage-trigger${shortcutManageMenuOpen ? ' active' : ''}`}
                    type="button"
                    onClick={() => {
                      setShortcutGroupsMenuOpen(false);
                      setShortcutManageMenuOpen((value) => !value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                      event.preventDefault();
                      const focusLast = event.key === 'ArrowUp';
                      setShortcutGroupsMenuOpen(false);
                      setShortcutManageMenuOpen(true);
                      window.requestAnimationFrame(() => {
                        const items = popoverMenuItems(shortcutManagePopoverRef.current);
                        items[focusLast ? items.length - 1 : 0]?.focus();
                      });
                    }}
                    aria-expanded={shortcutManageMenuOpen}
                    aria-haspopup="menu"
                    aria-controls="shortcutManageMenu"
                  >
                    管理<ChevronDown aria-hidden="true" />
                  </button>
                  {shortcutManageMenuOpen && (
                    <div ref={shortcutManagePopoverRef} id="shortcutManageMenu" className="shortcut-manage-menu" role="menu" aria-label="管理快捷网站" onKeyDown={(event) => handlePopoverNavigation(event, shortcutManagePopoverRef.current)}>
                      <button type="button" role="menuitem" onClick={() => { setShortcutManageMenuOpen(false); openShortcutManager(); }}><Pencil aria-hidden="true" /><span><strong>管理网站</strong><small>编辑、排序或移动网站</small></span></button>
                      <button type="button" role="menuitem" onClick={() => { setShortcutManageMenuOpen(false); setCategoryModalOpen(true); }}><Grid3X3 aria-hidden="true" /><span><strong>管理分类</strong><small>新增、排序或整理分类</small></span></button>
                      <button type="button" role="menuitem" onClick={() => openSettings('data')}><BookMarked aria-hidden="true" /><span><strong>导入书签</strong><small>从浏览器迁移常用网站</small></span></button>
                    </div>
                  )}
                </div>
                <button className="primary-small-button" type="button" onClick={openShortcutModal}><Plus aria-hidden="true" />添加</button>
              </div>
            </div>

            {!query && (
              <div ref={categoryNavigationRef} className="category-navigation">
                <div className="category-tabs" role="tablist" aria-label="常用网站分类">
                  {primaryCategories.map((category) => (
                    <button
                      key={category}
                      className={category === activeCategory ? 'active' : ''}
                      type="button"
                      role="tab"
                      aria-selected={category === activeCategory}
                      onClick={() => { setCategoryContextMenu(null); setActiveCategory(category); }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        const bounds = event.currentTarget.getBoundingClientRect();
                        setShortcutContextMenu(null);
                        setActiveCategory(category);
                        setCategoryContextMenu({
                          category,
                          x: event.clientX || bounds.left + 12,
                          y: event.clientY || bounds.bottom,
                        });
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {overflowCategories.length > 0 && (
                  <label className={`category-overflow-select${overflowCategoryActive ? ' active' : ''}`}>
                    <select value={overflowCategoryActive ? activeCategory : ''} onChange={(event) => { if (event.target.value) setActiveCategory(event.target.value); }} aria-label="更多网站分类">
                      <option value="">更多</option>
                      {overflowCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <span aria-hidden="true">更多</span>
                    <ChevronDown aria-hidden="true" />
                  </label>
                )}
                <button
                  ref={categoryOpenAllRef}
                  className="category-open-all"
                  type="button"
                  disabled={!activeCategoryShortcuts.length}
                  onClick={() => openShortcutCategory(activeCategory)}
                  aria-label={activeCategoryShortcuts.length
                    ? `打开“${activeCategory}”分类的全部 ${activeCategoryShortcuts.length} 个网站`
                    : `“${activeCategory}”分类暂无网站`}
                >
                  <Play aria-hidden="true" />打开全部<span>{activeCategoryShortcuts.length}</span>
                </button>
                <div className="category-navigation-measure" aria-hidden="true">
                  <div ref={categoryMeasureRef} className="category-tabs">
                    {categories.slice(0, MAX_VISIBLE_SHORTCUT_CATEGORIES).map((category) => (
                      <button key={category} className={category === activeCategory ? 'active' : ''} type="button" tabIndex={-1}>{category}</button>
                    ))}
                  </div>
                  <span ref={categoryMoreMeasureRef} className="category-overflow-select active">
                    <span>更多</span><ChevronDown aria-hidden="true" />
                  </span>
                </div>
              </div>
            )}

            {visibleShortcuts.length ? (
              <>
                <div className={`shortcut-grid${state.preferences.compactShortcuts ? ' compact-grid' : ''}`}>
                  {displayedShortcuts.map((shortcut) => (
                    <ShortcutCard key={shortcut.id} shortcut={shortcut} compact={state.preferences.compactShortcuts} onOpen={recordShortcut} onContextMenu={(item, position) => { setCategoryContextMenu(null); setShortcutContextMenu({ shortcutId: item.id, ...position }); }} />
                  ))}
                </div>
                {visibleShortcuts.length > shortcutDisplayLimit && (
                  <div className="shortcut-overflow">
                    <span>{shortcutsExpanded ? `已显示全部 ${visibleShortcuts.length} 个网站` : `首屏显示 ${displayedShortcuts.length} 个网站`}</span>
                    <button type="button" onClick={() => setShortcutsExpanded((current) => !current)} aria-expanded={shortcutsExpanded}>
                      {shortcutsExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                      {shortcutsExpanded ? '收起网站' : `展开其余 ${hiddenShortcutCount} 个`}
                    </button>
                  </div>
                )}
              </>
            ) : query ? (
              <div className="empty-state"><Search aria-hidden="true" /><strong>没有匹配的网站</strong><span>按回车使用{state.preferences.searchEngine === 'baidu' ? '百度' : '必应'}搜索</span></div>
            ) : (
              <div className="empty-state"><Grid3X3 aria-hidden="true" /><strong>这个分类还没有网站</strong><span>点击“添加”，把常用网站放进来</span></div>
            )}
          </section>
          </WidgetFrame>
          </div>

          <aside className={`today-rail${draggingWidgetId ? ' is-widget-dragging' : ''}`} aria-label="今日工作区">
            {displayedRailWidgetOrder.map(renderRailWidget)}
          </aside>
        </div>
      </main>

      {layoutEditing && (
        <div className="layout-mode-bar" role="toolbar" aria-label="布局调整">
          <span className="layout-mode-title"><AppWindow aria-hidden="true" /><span><strong>调整“{workspace.name}”布局</strong><small>拖动卡片顶部排序，手机端保持单列</small></span></span>
          <span className="layout-balance-control" role="group" aria-label="主区域宽度">
            {([
              ['sites', '网站优先'],
              ['balanced', '均衡'],
              ['widgets', '组件优先'],
            ] as Array<[DeskRailWidth, string]>).map(([value, label]) => (
              <button key={value} className={workspace.layout.railWidth === value ? 'active' : ''} type="button" aria-pressed={workspace.layout.railWidth === value} onClick={() => setRailWidth(value)}>{label}</button>
            ))}
          </span>
          <button className="layout-reset-button" type="button" onClick={resetCurrentLayout}><RotateCcw aria-hidden="true" />恢复默认</button>
          <button className="layout-done-button" type="button" onClick={() => setLayoutEditing(false)}><Check aria-hidden="true" />完成</button>
        </div>
      )}

      <footer className="desk-footer">
        <span className="desk-footer-brand">WyanDesk</span>
        <a className="desk-filing" href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" aria-label="鄂ICP备2023002649号-3，打开工业和信息化部备案管理系统">鄂ICP备2023002649号-3</a>
        <span className={`desk-save-status${!pwa.online ? ' is-offline' : ''}`}>{!pwa.online ? '离线 · 数据仍保存在本机' : saveStatus === 'error' ? '保存失败，请导出备份' : saveStatus === 'saving' ? '正在保存…' : '已保存到当前浏览器'}</span>
      </footer>

      {shortcutContextMenu && shortcutContextTarget && (
        <ShortcutContextMenu
          shortcut={shortcutContextTarget}
          categories={categories}
          groups={workspace.shortcutGroups}
          x={shortcutContextMenu.x}
          y={shortcutContextMenu.y}
          onClose={closeShortcutContextMenu}
          onDelete={(shortcut) => removeShortcut(shortcut.id)}
          onEdit={openShortcutEditor}
          onManageGroups={() => setShortcutGroupManagerOpen(true)}
          onMove={moveShortcutCategory}
          onOpen={openShortcut}
          onToggleGroup={toggleShortcutInGroup}
        />
      )}

      {categoryContextMenu && categories.includes(categoryContextMenu.category) && (
        <CategoryContextMenu
          category={categoryContextMenu.category}
          count={categoryCounts[categoryContextMenu.category] || 0}
          x={categoryContextMenu.x}
          y={categoryContextMenu.y}
          onClose={closeCategoryContextMenu}
          onManage={() => setCategoryModalOpen(true)}
          onOpen={() => openShortcutCategory(categoryContextMenu.category)}
        />
      )}

      {settingsOpen && (
        <ManagedLayer className="drawer-layer" onEscape={closeSettings}>
          <button className="drawer-backdrop" type="button" onClick={closeSettings} aria-label="关闭设置" />
          <aside className="settings-drawer" data-settings-view={settingsView} role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
            <div className="drawer-heading settings-drawer-heading">
              <div className="settings-heading-main">
                {settingsView !== 'home' && <button autoFocus className="settings-back-button" type="button" onClick={() => setSettingsView('home')} aria-label="返回设置首页"><ChevronLeft /></button>}
                <div><h2 id="settingsTitle">{activeSettingsMeta.title}</h2><p>{activeSettingsMeta.description}</p></div>
              </div>
              <button className="icon-button" type="button" onClick={closeSettings} aria-label="关闭"><X /></button>
            </div>

            <div ref={settingsScrollRef} className="settings-scroll">
              {settingsView === 'home' && (
                <div className="settings-home">
                  <BrowserExtensionInstallCard installed={extensionRuntime} version={appVersion} />
                  <nav className="settings-navigation" aria-label="设置分类">
                    <SettingsNavigationItem autoFocus icon={<Palette />} title="外观与桌面" description="背景、搜索与网站密度" summary={`${settingsSceneLabel} · ${state.preferences.searchEngine === 'baidu' ? '百度' : '必应'}`} onClick={() => setSettingsView('appearance')} />
                    <SettingsNavigationItem icon={<AppWindow />} title="组件布局" description="显示、排序与卡片尺寸" summary={`${enabledRailWidgetCount} 个组件 · 辅助 ${enabledAuxiliaryContentCount} 项`} onClick={() => setSettingsView('components')} />
                    <SettingsNavigationItem icon={deskSync.user ? <Cloud /> : <CloudOff />} title="账号与同步" description="登录、加密与历史版本" summary={settingsSyncSummary} onClick={() => setSettingsView('sync')} />
                    <SettingsNavigationItem icon={<LockKeyhole />} title="锁屏与隐私" description="自动锁定、密码与活动记录" summary={settingsLockSummary} onClick={() => setSettingsView('privacy')} />
                    <SettingsNavigationItem icon={<Database />} title="导入与备份" description="书签、日历、模板与完整备份" summary={`当前“${workspace.name}”桌面`} onClick={() => setSettingsView('data')} />
                    <SettingsNavigationItem icon={<Info />} title="关于与支持" description="隐私、协议与问题反馈" summary={`WyanDesk v${appVersion}`} onClick={() => setSettingsView('about')} />
                  </nav>
                  <p className="settings-home-hint">设置会自动保存到当前浏览器；登录后的同步状态可在“账号与同步”中查看。</p>
                </div>
              )}

              {settingsView === 'appearance' && (
                <div className="settings-page">
                  <section className="settings-section">
                    <div className="settings-title"><Palette /><div><strong>环境风格</strong><small>场景位于内容底层</small></div></div>
                    <div className="scene-options">
                      {sceneOptions.map((scene) => (
                        <button key={scene.id} className={`scene-option preview-${scene.id}${state.preferences.scene === scene.id && !state.preferences.customBackground ? ' active' : ''}`} type="button" onClick={() => selectScene(scene.id)}>
                          <span className="scene-preview"><i /><b /></span>
                          <span><strong>{scene.name}</strong><small>{scene.description}</small></span>
                          {state.preferences.scene === scene.id && !state.preferences.customBackground && <Check />}
                        </button>
                      ))}
                    </div>
                    <label className={`upload-background${state.preferences.customBackground ? ' active' : ''}`}>
                      <input type="file" accept="image/*" onChange={uploadBackground} />
                      <ImagePlus /><span><strong>自定义背景</strong><small>JPG、PNG 或 WebP，小于 1.5 MB</small></span><Upload />
                    </label>
                    {state.preferences.customBackground && <button className="full-quiet-button" type="button" onClick={() => updatePreferences({ customBackground: '' })}>移除自定义背景</button>}
                    <SettingToggle label="环境动效" description="慢速光影与立体层次" checked={state.preferences.sceneMotion} onChange={(checked) => updatePreferences({ sceneMotion: checked })} />
                  </section>
                  <section className="settings-section compact-section">
                    <div className="settings-title"><Search /><div><strong>默认搜索</strong><small>搜索框直接使用</small></div></div>
                    <div className="segmented-control">
                      <button className={state.preferences.searchEngine === 'baidu' ? 'active' : ''} type="button" onClick={() => updatePreferences({ searchEngine: 'baidu' })}>百度</button>
                      <button className={state.preferences.searchEngine === 'bing' ? 'active' : ''} type="button" onClick={() => updatePreferences({ searchEngine: 'bing' })}>必应</button>
                    </div>
                  </section>
                  <section className="settings-section">
                    <SettingToggle label="紧凑网站卡片" description="同一屏显示更多网站" checked={state.preferences.compactShortcuts} onChange={(checked) => updatePreferences({ compactShortcuts: checked })} />
                  </section>
                </div>
              )}

              {settingsView === 'components' && (
                <div className="settings-page">
                  <section className="settings-section">
                    <div className="settings-title"><AppWindow /><div><strong>桌面布局</strong><small>在桌面直接拖动和调整尺寸</small></div></div>
                    <button className="layout-edit-trigger" type="button" onClick={enterLayoutEditing}><AppWindow aria-hidden="true" /><span><strong>进入布局调整</strong><small>宽度、高度与主区域比例</small></span><ChevronRight aria-hidden="true" /></button>
                    <div className="mobile-layout-setting">
                      <span><Smartphone aria-hidden="true" /><span><strong>手机端首页顺序</strong><small>快捷网站默认只展示 4 个，其余可展开</small></span></span>
                      <div className="segmented-control mobile-priority-control" role="group" aria-label="手机端首页顺序">
                        <button className={state.preferences.mobileLayoutPriority === 'tasks' ? 'active' : ''} type="button" aria-pressed={state.preferences.mobileLayoutPriority === 'tasks'} onClick={() => updatePreferences({ mobileLayoutPriority: 'tasks' })}>任务优先</button>
                        <button className={state.preferences.mobileLayoutPriority === 'sites' ? 'active' : ''} type="button" aria-pressed={state.preferences.mobileLayoutPriority === 'sites'} onClick={() => updatePreferences({ mobileLayoutPriority: 'sites' })}>网站优先</button>
                      </div>
                    </div>
                  </section>
                  <section className="settings-section">
                    <div className="component-settings-heading"><strong>右侧工作区</strong><small>隐藏不会删除数据</small></div>
                    <div className="component-settings-grid">
                      {workspace.layout.widgetOrder.map((id, index) => {
                        const item = railComponentControls[id];
                        return (
                          <ComponentSettingCard
                            key={id}
                            label={item.label}
                            description={item.description}
                            checked={item.checked}
                            onChange={item.onChange}
                            onMoveUp={() => moveCurrentRailWidget(id, -1)}
                            onMoveDown={() => moveCurrentRailWidget(id, 1)}
                            moveUpDisabled={index === 0}
                            moveDownDisabled={index === workspace.layout.widgetOrder.length - 1}
                            onConfigure={id === 'reminders'
                              ? () => { setSettingsOpen(false); setReminderSettingsOpen(true); }
                              : id === 'worldClock'
                                ? () => { setSettingsOpen(false); setWorldClockSettingsOpen(true); }
                                : id === 'countdown'
                                  ? () => { setSettingsOpen(false); openTimeEventModal(); }
                                : undefined}
                          />
                        );
                      })}
                    </div>
                  </section>
                  <section className="settings-section">
                    <div className="component-settings-heading"><strong>辅助内容</strong><small>仅在需要时出现</small></div>
                    <div className="component-settings-grid auxiliary">
                      <ComponentSettingCard label="搜索最近网站" description="聚焦搜索框时显示" checked={state.preferences.showRecent} onChange={(checked) => updatePreferences({ showRecent: checked })} />
                      <ComponentSettingCard label="时间事件" description={state.timeEvents.length ? `${state.timeEvents.length} 个累计或倒计时` : '添加后才显示'} checked={state.preferences.showTimeEvents} onChange={(checked) => updatePreferences({ showTimeEvents: checked })} />
                    </div>
                  </section>
                </div>
              )}

              {settingsView === 'sync' && (
                <div className="settings-page">
                  <section className="settings-section settings-section-leading">
                    {deskSync.user ? (
                      <>
                        <div className={`sync-account-row${deskSync.status === 'local' ? ' muted' : ''}`}><span>{deskSync.status === 'local' ? <CloudOff /> : deskSync.status === 'locked' ? <LockKeyhole /> : <Cloud />}</span><span><strong>{deskSync.user.userName}</strong><small>{deskSync.status === 'saving' ? '正在处理云端数据…' : deskSync.status === 'local' ? '云端桌面已删除，本机内容仍保留' : deskSync.status === 'locked' ? '云端数据已加密，请输入同步密码' : deskSync.status === 'conflict' ? '需要选择数据版本' : deskSync.status === 'error' ? '同步暂时中断' : '本机与云端已连接'}</small></span></div>
                        <div className="sync-actions">
                          <button type="button" onClick={() => void deskSync.syncNow()} disabled={deskSync.status === 'saving'}><RefreshCw />{deskSync.status === 'local' ? '重新开启同步' : '立即同步'}</button>
                          {deskSync.status !== 'local' && <button type="button" onClick={() => setCloudHistoryOpen(true)}><History />历史版本</button>}
                        </div>
                        {deskSync.status !== 'local' && (
                          <div className={`sync-encryption-card${deskSync.encryptionEnabled ? ' active' : ''}`}>
                            <div className="sync-encryption-heading">
                              <span><ShieldCheck /></span>
                              <span><strong>端到端加密</strong><small>{deskSync.encryptionEnabled ? '云端仅保存密文' : '可选，由当前设备加解密'}</small></span>
                            </div>
                            {deskSync.status === 'locked' || !deskSync.encryptionEnabled ? (
                              <form className="sync-encryption-form" onSubmit={(event) => void submitSyncEncryption(event)}>
                                <input type="password" value={syncPassphrase} onChange={(event) => setSyncPassphrase(event.target.value)} minLength={10} maxLength={200} autoComplete="current-password" placeholder={deskSync.status === 'locked' ? '输入同步密码' : '设置至少 10 个字符'} aria-label={deskSync.status === 'locked' ? '同步密码' : '设置同步密码'} />
                                <button type="submit" disabled={deskSync.status === 'saving' || deskSync.status === 'checking'}>{deskSync.status === 'locked' ? '解锁' : '开启'}</button>
                              </form>
                            ) : <button className="sync-encryption-disable" type="button" onClick={() => void disableSyncEncryption()} disabled={deskSync.status === 'saving'}>关闭并改为明文同步</button>}
                            <p>密码不会上传，仅在当前标签页会话中保留；遗忘后无法找回云端数据。</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="sync-account-row muted"><span><CloudOff /></span><span><strong>本机桌面</strong><small>未登录时，数据只保存在当前浏览器</small></span></div>
                        <button className="install-app-button" type="button" onClick={deskSync.login}><Cloud />登录并开启同步</button>
                      </>
                    )}
                    {deskSync.error && <p className="settings-error">{deskSync.error}</p>}
                    <p className="settings-hint">登录后可跨设备同步；离线时仍可继续使用当前浏览器的数据。</p>
                  </section>
                  {deskSync.user && deskSync.status !== 'local' && (
                    <section className="settings-section settings-danger-section">
                      <div className="settings-title"><Trash2 /><div><strong>云端数据</strong><small>不会删除当前浏览器里的桌面</small></div></div>
                      <button className="cloud-delete-trigger" type="button" onClick={() => { setSettingsOpen(false); setDeleteCloudOpen(true); }} disabled={deskSync.status === 'saving'}><Trash2 />删除云端桌面数据</button>
                    </section>
                  )}
                </div>
              )}

              {settingsView === 'privacy' && (
                <div className="settings-page">
                  <section className="settings-section settings-section-leading">
                    <div className="auto-lock-row">
                      <span>空闲自动锁定</span>
                      <div className="segmented-control auto-lock-control" aria-label="空闲自动锁定时间">
                        {[0, 5, 15, 30].map((minutes) => (
                          <button key={minutes} className={state.preferences.autoLockMinutes === minutes ? 'active' : ''} type="button" aria-pressed={state.preferences.autoLockMinutes === minutes} onClick={() => updatePreferences({ autoLockMinutes: minutes })}>
                            {minutes === 0 ? '关闭' : `${minutes} 分`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="lock-message-field">
                      <span><strong>锁屏提示</strong><small>留空不显示，最多 48 个字</small></span>
                      <input value={state.preferences.lockMessage} onChange={(event) => updatePreferences({ lockMessage: event.target.value.slice(0, 48) })} maxLength={48} placeholder="例如：专注一下，慢慢来" />
                    </label>
                    <div className="lock-security-row">
                      <span><strong>本地解锁密码</strong><small>{lockPinEnabled ? '已启用，仅保存在当前浏览器' : '默认关闭'}</small></span>
                      {lockPinEnabled ? <span className="lock-security-actions"><button type="button" onClick={() => setLockPinMode('change')}>修改</button><button type="button" onClick={() => setLockPinMode('disable')}>关闭</button></span> : <button type="button" onClick={() => setLockPinMode('create')}>启用</button>}
                    </div>
                    <SettingToggle label="锁屏活动记录" description="记录页面内操作与切屏，不保存输入内容" checked={state.preferences.lockActivityEnabled} onChange={(checked) => updatePreferences({ lockActivityEnabled: checked })} />
                    <div className="lock-activity-setting-row">
                      <span><strong>{lockActivityCount ? `${lockActivityCount} 次本地活动` : '还没有活动记录'}</strong><small>{latestLockActivity ? `最近 ${new Date(latestLockActivity.lastAt).toLocaleString('zh-CN', { hour12: false })}` : '只保存在当前浏览器'}</small></span>
                      <button type="button" disabled={!lockActivityLog.length} onClick={() => { setSettingsOpen(false); setLockActivityPanelOpen(true); }}>查看记录</button>
                    </div>
                    <button className="lock-now-button" type="button" onClick={() => lockDesktop(true)}><Lock />立即全屏锁定</button>
                    <p className="settings-hint">活动记录不包含具体按键、鼠标位置或其他应用；网页锁屏不能替代系统锁屏。</p>
                  </section>
                </div>
              )}

              {settingsView === 'data' && (
                <div className="settings-page">
                  <section className="settings-section">
                    <div className="settings-title"><Database /><div><strong>完整备份</strong><small>迁移到其他浏览器或设备</small></div></div>
                    <div className="backup-actions">
                      <button type="button" onClick={exportDeskBackup}><Download />导出数据</button>
                      <label><input type="file" accept="application/json,.json" onChange={importDeskBackup} /><FileUp />导入备份</label>
                    </div>
                    {recoveryAvailable && <button className="recovery-download" type="button" onClick={exportRecoveryData}><Download />下载异常数据副本</button>}
                    <label className="bookmark-import"><input type="file" accept="text/html,.html,.htm" onChange={importBrowserBookmarks} /><BookMarked /><span><strong>导入书签 HTML</strong><small>跨浏览器兼容方式；扩展支持直接迁移</small></span><FileUp /></label>
                    <p className="settings-hint">完整备份包含网站、分类、任务、便签和桌面设置。</p>
                  </section>
                  <section className="settings-section">
                    <div className="settings-title"><CalendarDays /><div><strong>日历与桌面模板</strong><small>只处理当前“{workspace.name}”桌面</small></div></div>
                    <div className="settings-tool-grid">
                      <article className="settings-tool-card">
                        <div className="settings-tool-heading"><span><CalendarDays /></span><div><strong>日历交换</strong><small>自动跳过重复日程</small></div></div>
                        <div className="settings-tool-actions"><button type="button" onClick={exportCalendar}><Download />导出</button><label><input type="file" accept="text/calendar,.ics" onChange={importCalendar} /><FileUp />导入</label></div>
                      </article>
                      <article className="settings-tool-card">
                        <div className="settings-tool-heading"><span><FileJson /></span><div><strong>桌面模板</strong><small>仅分享网站与分类</small></div></div>
                        <div className="settings-tool-actions"><button type="button" onClick={exportWorkspaceTemplate}><Download />导出</button><label><input type="file" accept="application/json,.json" onChange={importWorkspaceTemplate} /><FileUp />导入</label></div>
                      </article>
                    </div>
                  </section>
                  <section className="settings-section">
                    <div className="settings-title"><Wrench /><div><strong>应用与操作</strong><small>按需要使用的辅助功能</small></div></div>
                    <div className="settings-tool-grid">
                      {pwa.installMode !== 'unavailable' && <PwaInstallCard installMode={pwa.installMode} offlineReady={pwa.offlineReady} registrationError={pwa.registrationError} updateAvailable={pwa.updateAvailable} updateBusy={pwa.updateBusy} onInstall={() => void installDeskApp()} onUpdate={pwa.applyUpdate} />}
                      <article className="settings-tool-card"><div className="settings-tool-heading"><span><Keyboard /></span><div><strong>键盘操作</strong><small>搜索、命令与弹层</small></div></div><div className="settings-tool-actions single"><button type="button" onClick={() => setKeyboardHelpOpen(true)}>查看快捷键</button></div></article>
                    </div>
                  </section>
                  <section className="settings-section settings-danger-section">
                    <div className="settings-title"><RotateCcw /><div><strong>恢复默认桌面</strong><small>会清除自定义网站、任务、便签和设置</small></div></div>
                    <button className="reset-button" type="button" onClick={resetDesktop}><RotateCcw />恢复默认桌面</button>
                  </section>
                </div>
              )}

              {settingsView === 'about' && (
                <div className="settings-page">
                  <section className="settings-section settings-section-leading about-section">
                    <div className="about-summary"><span>W</span><span><strong>微言桌面 WyanDesk</strong><small>v{appVersion} · 本地优先，安静好用</small></span></div>
                    <div className="about-actions">
                      <button type="button" onClick={() => { setSettingsOpen(false); setOnboardingOpen(true); }}><CircleHelp />使用指南</button>
                      <button type="button" onClick={() => { setSettingsOpen(false); setTrustPanel('privacy'); }}><ShieldCheck />隐私说明</button>
                      <button type="button" onClick={() => { setSettingsOpen(false); setTrustPanel('terms'); }}><FileText />用户协议</button>
                      <button type="button" onClick={() => { setSettingsOpen(false); setTrustPanel('feedback'); }}><MessageSquareText />反馈问题</button>
                    </div>
                    <p className="settings-hint">需要帮助或发现问题，可直接提交反馈；反馈不会自动附带桌面内容。</p>
                  </section>
                </div>
              )}
            </div>
          </aside>
        </ManagedLayer>
      )}

      {shortcutModalOpen && (
        <ManagedLayer className="modal-layer" onEscape={closeShortcutModal}>
          <button className="modal-backdrop" type="button" onClick={closeShortcutModal} aria-label="关闭" />
          <form className="shortcut-modal" onSubmit={saveShortcut} role="dialog" aria-modal="true" aria-labelledby="shortcutModalTitle">
            <div className="modal-heading"><div><span className="modal-icon">{editingShortcutId ? <Pencil /> : <Sparkles />}</span><div><h2 id="shortcutModalTitle">{editingShortcutId ? '编辑快捷网站' : '添加快捷网站'}</h2><p>{editingShortcutId ? '可修改名称、网址和所在分类' : '保存到当前浏览器'}</p></div></div><button className="icon-button" type="button" onClick={closeShortcutModal} aria-label="关闭"><X /></button></div>
            <div className="form-grid">
              <label><span>网站名称</span><input autoFocus value={shortcutDraft.title} onChange={(event) => setShortcutDraft((current) => ({ ...current, title: event.target.value }))} placeholder="例如：项目文档" required /></label>
              <label><span>网站地址</span><input value={shortcutDraft.url} onChange={(event) => setShortcutDraft((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com" required /></label>
              <label><span>分类</span><input list="shortcutCategories" maxLength={16} value={shortcutDraft.category} onChange={(event) => setShortcutDraft((current) => ({ ...current, category: event.target.value }))} required /><datalist id="shortcutCategories">{categories.map((category) => <option key={category} value={category} />)}</datalist></label>
              <div className="split-fields"><label><span>图标文字</span><input maxLength={2} value={shortcutDraft.icon} onChange={(event) => setShortcutDraft((current) => ({ ...current, icon: event.target.value }))} placeholder="自动" /></label><label><span>图标颜色</span><input className="color-input" type="color" value={shortcutDraft.accent} onChange={(event) => setShortcutDraft((current) => ({ ...current, accent: event.target.value }))} /></label></div>
            </div>
            <div className="modal-actions"><button className="quiet-button" type="button" onClick={closeShortcutModal}>取消</button><button className="primary-button" type="submit">{editingShortcutId ? <Check /> : <Plus />}{editingShortcutId ? '保存修改' : '添加到桌面'}</button></div>
          </form>
        </ManagedLayer>
      )}

      {categoryModalOpen && (
        <CategoryManager
          categories={categories}
          counts={categoryCounts}
          onAdd={addCategory}
          onClose={() => setCategoryModalOpen(false)}
          onDelete={removeCategory}
          onMove={reorderCategory}
          onRename={updateCategoryName}
        />
      )}

      {shortcutManagerOpen && (
        <ShortcutManager
          category={activeCategory}
          shortcuts={workspace.shortcuts.filter((shortcut) => shortcut.category === activeCategory)}
          onAdd={openShortcutModal}
          onClose={() => setShortcutManagerOpen(false)}
          onDelete={removeShortcut}
          onEdit={openShortcutEditor}
          onMove={reorderShortcut}
        />
      )}

      {eventModalOpen && (
        <ManagedLayer className="modal-layer" onEscape={() => setEventModalOpen(false)}>
          <button className="modal-backdrop" type="button" onClick={() => setEventModalOpen(false)} aria-label="关闭" />
          <form className="shortcut-modal" onSubmit={addEvent} role="dialog" aria-modal="true" aria-labelledby="eventModalTitle">
            <div className="modal-heading"><div><span className="modal-icon"><CalendarPlus /></span><div><h2 id="eventModalTitle">添加日程</h2><p>本地保存，不连接第三方账号</p></div></div><button className="icon-button" type="button" onClick={() => setEventModalOpen(false)} aria-label="关闭"><X /></button></div>
            <div className="form-grid">
              <label><span>日程名称</span><input autoFocus value={eventDraft.title} onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))} placeholder="例如：项目周会" required /></label>
              <div className="split-fields"><label><span>日期</span><input type="date" min={todayKey} value={eventDraft.date} onChange={(event) => setEventDraft((current) => ({ ...current, date: event.target.value }))} required /></label><label><span>时间</span><input type="time" value={eventDraft.time} onChange={(event) => setEventDraft((current) => ({ ...current, time: event.target.value }))} required /></label></div>
            </div>
            <div className="modal-actions"><button className="quiet-button" type="button" onClick={() => setEventModalOpen(false)}>取消</button><button className="primary-button" type="submit"><Plus />保存日程</button></div>
          </form>
        </ManagedLayer>
      )}

      {timeEventModalOpen && (
        <TimeEventModal
          event={selectedTimeEvent}
          todayKey={todayKey}
          onClose={closeTimeEventModal}
          onDelete={deleteTimeEvent}
          onSave={saveTimeEvent}
        />
      )}

      {taskCreateModalOpen && (
        <TaskCreateModal
          todayKey={todayKey}
          onClose={() => setTaskCreateModalOpen(false)}
          onSave={addTaskDetails}
        />
      )}

      {reminderSettingsOpen && (
        <ReminderSettingsModal
          reminders={state.reminders}
          systemNotifications={state.preferences.systemNotifications}
          onAdd={addReminder}
          onClose={() => setReminderSettingsOpen(false)}
          onDelete={removeReminder}
          onEnableNotifications={() => void enableNotifications()}
          onDisableNotifications={() => updatePreferences({ systemNotifications: false })}
          onUpdate={updateReminder}
        />
      )}

      {activeReminderAlert && (
        <ReminderAlertModal
          alert={activeReminderAlert}
          onDismiss={dismissActiveReminder}
          onSnooze={snoozeActiveReminder}
        />
      )}

      {worldClockSettingsOpen && (
        <WorldClockSettingsModal
          selectedZoneIds={state.preferences.worldClockZones}
          onClose={() => setWorldClockSettingsOpen(false)}
          onSave={(worldClockZones) => {
            updatePreferences({ worldClockZones });
            setWorldClockSettingsOpen(false);
            notify('世界时钟已更新');
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          focused={workspace.focusTaskId === selectedTask.id}
          onClose={() => setTaskDetailId('')}
          onDelete={() => removeTask(selectedTask.id)}
          onSave={(text) => saveTask(selectedTask.id, text)}
          onToggleDone={() => toggleTask(selectedTask.id)}
          onToggleFocus={() => toggleFocusTask(selectedTask.id)}
        />
      )}

      {shortcutGroupManagerOpen && (
        <ShortcutGroupManager
          groups={workspace.shortcutGroups}
          shortcuts={workspace.shortcuts}
          onClose={() => setShortcutGroupManagerOpen(false)}
          onDelete={removeShortcutGroup}
          onOpen={openShortcutGroup}
          onSave={saveShortcutGroup}
        />
      )}

      {quickActionsManagerOpen && (
        <QuickActionsManager
          actions={quickActionCandidates}
          selectedIds={workspace.quickActionIds}
          onClose={() => setQuickActionsManagerOpen(false)}
          onManageGroups={() => {
            setQuickActionsManagerOpen(false);
            setShortcutGroupManagerOpen(true);
          }}
          onSave={saveQuickActions}
        />
      )}

      {workspaceManagerOpen && (
        <WorkspaceManager
          workspaces={state.workspaces}
          activeId={workspace.id}
          onAdd={addWorkspace}
          onClose={() => setWorkspaceManagerOpen(false)}
          onDelete={removeWorkspace}
          onDuplicate={duplicateCurrentWorkspace}
          onMove={reorderWorkspace}
          onRename={renameWorkspace}
          onSwitch={switchWorkspace}
        />
      )}

      {inboxOpen && <InboxModal items={state.inbox} workspaces={state.workspaces} activeWorkspaceId={workspace.id} initialKind={inboxInitialKind} initialItemId={inboxInitialItemId} saveLabel={saveStatus === 'error' ? '本机保存失败，请先导出备份' : saveStatus === 'saving' ? '正在保存到本机…' : deskSync.user ? `本机已保存 · ${mobileSyncLabel}` : '已保存在本机，未登录账号'} onUpdate={(id, patch) => { setState((current) => ({ ...current, inbox: current.inbox.map((item) => item.id === id ? { ...item, ...patch } : item) })); }} onAdd={addInboxItem} onClose={() => setInboxOpen(false)} onDelete={removeInboxItem} onOrganize={organizeInboxItem} />}

      {onboardingOpen && <OnboardingModal extensionInstalled={extensionRuntime} onComplete={completeOnboarding} onImportBookmarks={importBrowserBookmarks} onTemplate={applyOnboardingTemplate} />}

      <CommandPalette open={commandOpen} initialQuery={commandInitialQuery} resources={commandResources} onLoadTabs={extensionRuntime ? loadSearchTabs : undefined} commands={deskCommands} shortcuts={commandShortcuts} currentWorkspaceId={workspace.id} getDynamicCommands={dynamicCommandsForQuery} onClose={() => { setCommandOpen(false); setCommandInitialQuery(''); }} onOpenShortcut={openCommandShortcut} />

      <AssistantPanel
        open={assistantOpen}
        signedIn={Boolean(deskSync.user)}
        userName={deskSync.user?.userName}
        onClose={() => setAssistantOpen(false)}
        onLogin={deskSync.login}
        onNotify={notify}
        onOpenFeedback={() => {
          setAssistantOpen(false);
          setTrustPanel('feedback');
        }}
      />

      {keyboardHelpOpen && <KeyboardHelpModal onClose={() => setKeyboardHelpOpen(false)} />}
      {lockPinMode && <LockPinModal mode={lockPinMode} onClose={() => setLockPinMode(null)} onChanged={(enabled) => { setLockPinEnabled(enabled); setLockPinMode(null); notify(enabled ? '解锁密码已启用' : '解锁密码已关闭'); }} />}
      {lockActivityPanelOpen && <LockActivityModal entries={lockActivityLog} onClose={() => setLockActivityPanelOpen(false)} onClear={clearLockActivityHistory} />}

      {trustPanel && <TrustCenterModal initialPanel={trustPanel} version={appVersion} signedIn={Boolean(deskSync.user)} onClose={() => { setTrustPanel(null); openSettings('about'); }} onLogin={deskSync.login} onSubmitFeedback={(message) => deskSync.submitFeedback(message, appVersion)} />}

      {deleteCloudOpen && deskSync.user && <DeleteCloudDataModal userName={deskSync.user.userName} onClose={() => { setDeleteCloudOpen(false); openSettings('sync'); }} onDelete={deskSync.deleteCloudData} onDeleted={() => { setDeleteCloudOpen(false); setCloudHistoryOpen(false); openSettings('sync'); notify('云端数据已删除，本地桌面仍保留'); }} />}

      {cloudHistoryOpen && <CloudHistoryModal onClose={() => setCloudHistoryOpen(false)} onLoad={deskSync.listRevisions} onRestore={deskSync.restoreRevision} />}

      {syncConflictOpen && deskSync.conflict && <SyncConflictModal onClose={() => setSyncConflictOpen(false)} onKeepLocal={deskSync.keepLocal} onUseCloud={deskSync.useCloud} />}

      {deskSync.loginError && (
        <div className="pwa-update-notice extension-login-notice" role="alert">
          <CircleAlert aria-hidden="true" />
          <span><strong>{deskSync.user ? '账号已连接，同步尚未完成' : '登录未完成'}</strong><small>{deskSync.loginError}</small></span>
          <button type="button" onClick={deskSync.user ? () => { deskSync.dismissLoginError(); openSettings('sync'); } : deskSync.login}>{deskSync.user ? '查看同步' : '重试'}</button>
          <button className="pwa-update-dismiss" type="button" onClick={deskSync.dismissLoginError} aria-label="关闭登录提示"><X /></button>
        </div>
      )}
      {pwa.updateNoticeVisible && !deskSync.loginError && <PwaUpdateNotice busy={pwa.updateBusy} onDismiss={pwa.dismissUpdateNotice} onUpdate={pwa.applyUpdate} />}
      {toast && <div className="toast" role="status"><Check aria-hidden="true" /><span>{toast.message}</span>{toast.undo && <button type="button" onClick={undoToast}><Undo2 />撤销</button>}</div>}
      </div>

      {isLocked && (
        <section className={`lock-screen${unlockPending ? ' is-unlocking' : ''}`} role="dialog" aria-modal="true" aria-labelledby="lockScreenTitle" aria-busy={unlockPending}>
          <header className="lock-topbar">
            <span className="lock-brand"><i>W</i><span><strong>微言桌面</strong><small>WyanDesk</small></span></span>
            {isFullscreen || unlockPending ? (
              <button className="lock-fullscreen-exit" data-lock-action type="button" onClick={unlockDesktop} disabled={unlockPending} aria-label={unlockPending ? '正在退出全屏并返回桌面' : '退出全屏并返回桌面'}><Minimize2 aria-hidden="true" /><span>{unlockPending ? '正在退出' : '退出全屏'}</span></button>
            ) : (
              <span className="lock-status"><LockKeyhole aria-hidden="true" />桌面已锁定</span>
            )}
          </header>
          <div className="lock-center">
            <p className="lock-date">{lockDateLabel}</p>
            <h1 id="lockScreenTitle"><FlipClock /></h1>
            <p className={`lock-greeting${state.preferences.lockMessage.trim() ? ' has-message' : ''}`}>{greeting(now.getHours())}，给自己留一点安静</p>
            {state.preferences.lockMessage.trim() && <p className="lock-custom-message">{state.preferences.lockMessage.trim()}</p>}
            {lockPinEnabled ? (
              <form className="unlock-pin-form" data-lock-action onSubmit={submitUnlockPin}>
                <div className="unlock-pin-control"><LockKeyhole aria-hidden="true" /><input ref={unlockPinRef} type="password" inputMode="numeric" autoComplete="current-password" value={unlockPin} onChange={(event) => setUnlockPin(event.target.value.replace(/\D/g, '').slice(0, 8))} maxLength={8} placeholder="输入解锁密码" aria-label="解锁密码" /></div>
                <button type="submit" disabled={unlocking || unlockPending || unlockPin.length < 4}>{unlocking ? '验证中…' : unlockPending ? '正在返回…' : '进入桌面'}</button>
                {unlockError && <p role="alert">{unlockError}</p>}
              </form>
            ) : (
              <button ref={unlockButtonRef} className="unlock-button" data-lock-action type="button" onClick={unlockDesktop} disabled={unlockPending}>
                <Unlock aria-hidden="true" />
                <span><strong>{unlockPending ? '正在返回桌面' : '进入桌面'}</strong><small>{unlockPending ? '正在恢复浏览器窗口' : '按空格键或回车'}</small></span>
              </button>
            )}
          </div>
          <footer className="lock-footer"><span>{[lockPinEnabled ? '本地密码已启用' : '', state.preferences.lockActivityEnabled ? '活动记录已开启' : ''].filter(Boolean).join(' · ') || '隐私遮挡模式'}</span><span>{isFullscreen ? '退出全屏将返回桌面' : '自动锁定仅隐藏当前网页内容'}</span></footer>
        </section>
      )}
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SettingsNavigationItemProps {
  autoFocus?: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  summary: string;
  onClick: () => void;
}

function SettingsNavigationItem({ autoFocus, icon, title, description, summary, onClick }: SettingsNavigationItemProps) {
  return (
    <button autoFocus={autoFocus} className="settings-navigation-item" type="button" onClick={onClick}>
      <span className="settings-navigation-icon" aria-hidden="true">{icon}</span>
      <span className="settings-navigation-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="settings-navigation-summary">{summary}</span>
      <ChevronRight aria-hidden="true" />
    </button>
  );
}

function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  return (
    <button className="setting-toggle" type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
      <span className={`toggle-track${checked ? ' active' : ''}`}><i /></span>
    </button>
  );
}

interface ComponentSettingCardProps extends SettingToggleProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  moveUpDisabled?: boolean;
  moveDownDisabled?: boolean;
  onConfigure?: () => void;
}

function ComponentSettingCard({ label, description, checked, onChange, onMoveUp, onMoveDown, moveUpDisabled, moveDownDisabled, onConfigure }: ComponentSettingCardProps) {
  const sortable = Boolean(onMoveUp && onMoveDown);
  return (
    <div className={`component-setting-card${checked ? ' enabled' : ''}`}>
      <button className="component-setting-switch" type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
        <span><strong>{label}</strong>{description && <small>{description}</small>}</span>
        <span className={`toggle-track${checked ? ' active' : ''}`}><i /></span>
      </button>
      {(sortable || onConfigure) && (
        <div className="component-setting-actions">
          {sortable && <span role="group" aria-label={`${label}排序`}><button type="button" onClick={onMoveUp} disabled={moveUpDisabled} aria-label={`上移${label}`} title="上移"><ChevronUp /></button><button type="button" onClick={onMoveDown} disabled={moveDownDisabled} aria-label={`下移${label}`} title="下移"><ChevronDown /></button></span>}
          {onConfigure && <button className="component-configure" type="button" onClick={onConfigure}><Settings />设置</button>}
        </div>
      )}
    </div>
  );
}

export default App;
