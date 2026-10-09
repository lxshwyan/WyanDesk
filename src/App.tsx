import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { flushSync } from 'react-dom';
import packageInfo from '../package.json';
import {
  AppWindow,
  BellRing,
  BookMarked,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  CirclePlus,
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
  Layers3,
  Lock,
  LockKeyhole,
  Minimize2,
  MessageSquareText,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  StickyNote,
  TimerReset,
  Trash2,
  Upload,
  Undo2,
  Unlock,
  Video,
  Wrench,
  X,
} from 'lucide-react';
import { CommandPalette, type CommandShortcut, type DeskCommand } from './components/CommandPalette';
import { CategoryManager } from './components/CategoryManager';
import { CalculatorCard } from './components/CalculatorCard';
import { CloudHistoryModal } from './components/CloudHistoryModal';
import { DeleteCloudDataModal } from './components/DeleteCloudDataModal';
import { DailyOverviewCard } from './components/DailyOverviewCard';
import { FocusTimerCard } from './components/FocusTimerCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { SceneBackdrop } from './components/SceneBackdrop';
import { ScheduleCard } from './components/ScheduleCard';
import { ShortcutCard } from './components/ShortcutCard';
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
import { MonthCalendarCard } from './components/MonthCalendarCard';
import { TrustCenterModal, type TrustPanel } from './components/TrustCenterModal';
import { InboxModal } from './components/InboxModal';
import { OnboardingModal, type DeskTemplate } from './components/OnboardingModal';
import { WorkspaceManager } from './components/WorkspaceManager';
import { WidgetFrame } from './components/WidgetFrame';
import { WorldClockCard } from './components/WorldClockCard';
import { WorldClockSettingsModal } from './components/WorldClockSettingsModal';
import { createDefaultState, defaultShortcuts } from './data/defaults';
import { mergeBrowserBookmarks, parseBrowserBookmarks } from './lib/bookmarks';
import { categoryDeleteTarget, categoryExists, cleanCategoryName, deleteCategory, moveCategory, renameCategory } from './lib/categories';
import { parseQuickCommand, quickCommandURL } from './lib/commandShortcuts';
import { getNextReminder, minutesFromTime, reminderIsDue } from './lib/reminders';
import { directURLFromInput, moveShortcutInCategory, shortcutURLExists } from './lib/shortcuts';
import { parseICS, serializeWorkspaceICS } from './lib/ics';
import { clearDeskState, normalizeURL, parseDeskBackup, readDeskStateWithStatus, readRecoverySnapshot, serializeDeskBackup, writeDeskState } from './lib/storage';
import { nextRecurringDate, prioritizeTasks } from './lib/tasks';
import { applyExtensionCaptures, isExtensionRuntime, publishExtensionSummary, subscribeExtensionCaptures } from './lib/extensionBridge';
import { cleanWorkspaceName, createBlankWorkspace, duplicateWorkspace, moveWorkspace } from './lib/workspaces';
import { parseWorkspaceTemplate, serializeWorkspaceTemplate } from './lib/workspaceTemplate';
import { useDeskSync } from './hooks/useDeskSync';
import { hasLockPin, verifyLockPin } from './lib/lockPin';
import { appendLockActivity, clearLockActivityLog, countLockActivity, readLockActivityLog, writeLockActivityLog, type LockActivityKind } from './lib/lockActivity';
import { createDefaultWorkspaceLayout, moveRailWidget, shortcutItemLimit, swapRailWidgets, updateWidgetSize } from './lib/widgetLayout';
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

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ToastMessage {
  message: string;
  undo?: () => void;
}

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

function openExternal(url: string): void {
  const target = window.open(url, '_blank', 'noopener,noreferrer');
  if (target) target.opener = null;
}

function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const date = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function App() {
  const [initialRead] = useState(() => readDeskStateWithStatus());
  const [state, setState] = useState<DeskState>(initialRead.state);
  const [now, setNow] = useState(() => new Date());
  const [activeCategory, setActiveCategory] = useState('常用');
  const [query, setQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [draggingWidgetId, setDraggingWidgetId] = useState<DeskRailWidgetId | null>(null);
  const [dragTargetWidgetId, setDragTargetWidgetId] = useState<DeskRailWidgetId | null>(null);
  const dragTargetWidgetIdRef = useRef<DeskRailWidgetId | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [shortcutManagerOpen, setShortcutManagerOpen] = useState(false);
  const [shortcutGroupManagerOpen, setShortcutGroupManagerOpen] = useState(false);
  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);
  const [editingShortcutId, setEditingShortcutId] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [timeEventModalOpen, setTimeEventModalOpen] = useState(false);
  const [editingTimeEventId, setEditingTimeEventId] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => initialRead.isNew && !initialRead.state.preferences.onboardingCompleted);
  const [cloudHistoryOpen, setCloudHistoryOpen] = useState(false);
  const [syncConflictOpen, setSyncConflictOpen] = useState(false);
  const [deleteCloudOpen, setDeleteCloudOpen] = useState(false);
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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [taskDraft, setTaskDraft] = useState('');
  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false);
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
  const unlockButtonRef = useRef<HTMLButtonElement>(null);
  const unlockPinRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const fullscreenOwnedRef = useRef(false);
  const fullscreenRequestPendingRef = useRef(false);
  const unlockRequestedRef = useRef(false);
  const unlockRevealFrameRef = useRef<number | undefined>(undefined);
  const unlockRevealSecondFrameRef = useRef<number | undefined>(undefined);
  const lockActivityLogRef = useRef(lockActivityLog);
  const activeLockSessionRef = useRef<{ id: string; startedAt: string } | null>(null);
  const deskSync = useDeskSync(state, setState, initialRead.isNew);

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
    setWorkspaceManagerOpen(false);
    setShortcutModalOpen(false);
    setShortcutManagerOpen(false);
    setShortcutGroupManagerOpen(false);
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

  const undoToast = useCallback(() => {
    if (!toast?.undo) return;
    const undo = toast.undo;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    undo();
    window.setTimeout(() => notify('已恢复'), 0);
  }, [notify, toast]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
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
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const clearInstallPrompt = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', clearInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', clearInstallPrompt);
    };
  }, []);

  useEffect(() => {
    setSaveStatus('saving');
    try {
      writeDeskState(state);
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
    if (!isExtensionRuntime()) return;
    void publishExtensionSummary(state).catch(() => undefined);
  }, [state]);

  useEffect(() => subscribeExtensionCaptures((queue) => {
    setState((current) => {
      const result = applyExtensionCaptures(current, queue);
      if (result.addedSites || result.addedGroups) {
        const message = result.addedGroups
          ? `已收藏 ${result.addedSites} 个网页并创建 ${result.addedGroups} 个组合`
          : `已从浏览器收藏 ${result.addedSites} 个网页`;
        window.setTimeout(() => notify(message), 0);
      }
      return result.state;
    });
  }), [notify]);

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
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setSwitcherOpen(false);
        setWorkspaceMenuOpen(false);
        setWorkspaceManagerOpen(false);
        setShortcutModalOpen(false);
        setShortcutManagerOpen(false);
        setShortcutGroupManagerOpen(false);
        setCategoryModalOpen(false);
        setEventModalOpen(false);
        setTaskCreateModalOpen(false);
        setReminderSettingsOpen(false);
        setTaskDetailId('');
        setCommandOpen(false);
        setKeyboardHelpOpen(false);
        setInboxOpen(false);
        setCloudHistoryOpen(false);
        setSyncConflictOpen(false);
        setDeleteCloudOpen(false);
        setTrustPanel(null);
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
        notify(`${reminder.time}  ${reminder.title}`);
        if (state.preferences.systemNotifications && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('微言桌面', { body: reminder.title, icon: '/favicon.svg' });
        }
      }
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [notify, state.preferences.systemNotifications, state.reminders]);

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
          const message = `${item.name} · ${task.text}`;
          notify(message);
          if (state.preferences.systemNotifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('任务提醒', { body: message, icon: '/favicon.svg' });
          }
        }
      }
    };
    checkTaskReminders();
    const timer = window.setInterval(checkTaskReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [notify, state.preferences.systemNotifications, state.workspaces]);

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

  const categories = workspace.categories;
  const categoryCounts = useMemo(() => workspace.shortcuts.reduce<Record<string, number>>((counts, shortcut) => {
    counts[shortcut.category] = (counts[shortcut.category] || 0) + 1;
    return counts;
  }, {}), [workspace.shortcuts]);

  useEffect(() => {
    if (!categories.includes(activeCategory) && categories.length) setActiveCategory(categories[0]);
  }, [activeCategory, categories]);

  const visibleShortcuts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    return workspace.shortcuts.filter((item) => {
      if (!normalized) return item.category === activeCategory;
      return [item.title, item.description, item.url, item.category].join(' ').toLocaleLowerCase('zh-CN').includes(normalized);
    });
  }, [activeCategory, query, workspace.shortcuts]);
  const shortcutDisplayLimit = shortcutItemLimit(workspace.layout.widgets.shortcuts.height, state.preferences.compactShortcuts);
  const displayedShortcuts = shortcutsExpanded ? visibleShortcuts : visibleShortcuts.slice(0, shortcutDisplayLimit);
  const hiddenShortcutCount = Math.max(0, visibleShortcuts.length - displayedShortcuts.length);

  useEffect(() => {
    setShortcutsExpanded(false);
  }, [activeCategory, query, state.activeWorkspaceId, state.preferences.compactShortcuts, workspace.layout.widgets.shortcuts.height]);

  const wyanProducts = useMemo(() => defaultShortcuts.filter((item) => item.category === '微言服务'), []);
  const recentShortcuts = useMemo(() => workspace.recentShortcutIds
    .map((id) => workspace.shortcuts.find((shortcut) => shortcut.id === id))
    .filter((shortcut): shortcut is Shortcut => Boolean(shortcut)), [workspace.recentShortcutIds, workspace.shortcuts]);
  const todayKey = localDateKey(now);
  const upcomingEvents = useMemo(() => [...workspace.events]
    .filter((event) => event.date >= todayKey)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)), [workspace.events, todayKey]);
  const nextReminder = useMemo(() => getNextReminder(state.reminders, now), [now, state.reminders]);
  const enabledReminderCount = state.reminders.filter((item) => item.enabled).length;
  const openTaskCount = workspace.tasks.filter((item) => !item.done).length;
  const todayEventCount = workspace.events.filter((item) => item.date === todayKey).length;
  const focusTaskTitle = workspace.tasks.find((item) => item.id === workspace.focusTaskId && !item.done)?.text || '';
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
    const defaults = createDefaultState();
    const workspaces = template === 'balanced'
      ? defaults.workspaces
      : template === 'simple'
        ? [defaults.workspaces[0]]
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
    if (item.kind === 'link' && item.url && shortcutURLExists(target.shortcuts, item.url)) {
      setState((current) => ({ ...current, inbox: current.inbox.filter((candidate) => candidate.id !== item.id) }));
      notify('该网址已经在目标桌面中');
      return;
    }
    setState((current) => ({
      ...current,
      inbox: current.inbox.filter((candidate) => candidate.id !== item.id),
      workspaces: current.workspaces.map((candidate) => {
        if (candidate.id !== workspaceId) return candidate;
        if (item.kind === 'task') {
          return { ...candidate, tasks: [{ id: uid('task'), text: item.content, done: false, createdAt: new Date().toISOString() }, ...candidate.tasks] };
        }
        if (item.kind === 'note') {
          return { ...candidate, note: [candidate.note.trim(), item.content].filter(Boolean).join('\n') };
        }
        if (!item.url) return candidate;
        const title = new URL(item.url).hostname.replace(/^www\./, '').slice(0, 50);
        const shortcut: Shortcut = { id: uid('shortcut'), title, url: item.url, category, icon: title.slice(0, 2), accent: '#3478f6', description: '来自收集箱' };
        return {
          ...candidate,
          categories: candidate.categories.includes(category) ? candidate.categories : [...candidate.categories, category],
          shortcuts: [...candidate.shortcuts, shortcut],
        };
      }),
    }));
    notify(item.kind === 'link' ? `已整理到“${target.name}”网站` : item.kind === 'task' ? `已整理到“${target.name}”任务` : `已整理到“${target.name}”便签`);
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

  function openShortcutGroup(group: ShortcutGroup) {
    const shortcuts = group.shortcutIds
      .map((id) => workspace.shortcuts.find((shortcut) => shortcut.id === id))
      .filter((shortcut): shortcut is Shortcut => Boolean(shortcut));
    if (!shortcuts.length) {
      notify('这个组合里暂时没有可打开的网站');
      return;
    }
    for (const shortcut of shortcuts) {
      try {
        openExternal(normalizeURL(shortcut.url));
      } catch {
        // Skip invalid legacy URLs without interrupting the remaining group.
      }
    }
    updateWorkspace((current) => ({
      ...current,
      recentShortcutIds: [...shortcuts.map((shortcut) => shortcut.id), ...current.recentShortcutIds.filter((id) => !shortcuts.some((shortcut) => shortcut.id === id))].slice(0, 6),
    }));
    notify(`正在打开“${group.title}”`);
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
    updateWorkspace((current) => ({ ...current, shortcutGroups: current.shortcutGroups.filter((item) => item.id !== group.id) }));
    notify('网站组合已删除');
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
    const detail = count ? `其中 ${count} 个网站会移到“${target}”。` : '';
    if (!window.confirm(`删除“${name}”分类？${detail}`)) return;
    updateWorkspace((current) => ({ ...current, ...deleteCategory(current.categories, current.shortcuts, name) }));
    if (activeCategory === name) setActiveCategory(target);
    notify(count ? `已删除分类并迁移 ${count} 个网站` : '已删除分类');
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
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    notify(choice.outcome === 'accepted' ? '微言桌面正在安装' : '已取消安装');
  }

  function resetDesktop() {
    if (!window.confirm('恢复默认桌面？自定义网站、任务、便签和设置将被清除。')) return;
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
    { id: 'open-inbox', label: '打开收集箱', description: `${state.inbox.length} 条待整理内容`, keywords: '收集箱 临时 记录 inbox capture', icon: <Inbox />, run: () => setInboxOpen(true) },
    { id: 'start-focus', label: '开始专注', description: `${focusDuration} 分钟专注计时`, keywords: '专注 番茄钟 计时 timer', icon: <TimerReset />, run: startFocus },
    { id: 'shortcut-groups', label: '网站组合', description: '一次打开一组常用网站', keywords: '组合 分组 标签页 工作组 group tabs', icon: <FolderOpen />, run: () => setShortcutGroupManagerOpen(true) },
    { id: 'wyan-tools', label: '微言工具', description: '图片、PDF、表格与文本工具', keywords: '工具箱 图片 pdf 表格', icon: <Wrench />, run: () => openShortcutById('wyan-tools', 'https://tools.wyanhub.com/tools') },
    { id: 'translate', label: '在线翻译', description: '打开百度翻译', keywords: '翻译 英语 translate', icon: <Languages />, run: () => openExternal('https://fanyi.baidu.com') },
    { id: 'meeting', label: '发起会议', description: '打开腾讯会议', keywords: '会议 视频 meeting', icon: <Video />, run: () => openShortcutById('tencent-meeting', 'https://meeting.tencent.com') },
    { id: 'add-shortcut', label: '添加网站', description: '收藏一个常用网址', keywords: '网站 网址 收藏 shortcut', icon: <Plus />, run: openShortcutModal },
    { id: 'manage-shortcuts', label: '管理网站', description: '编辑、排序或移动当前分类网站', keywords: '网站 编辑 排序 管理 shortcut', icon: <Pencil />, run: openShortcutManager },
    { id: 'manage-categories', label: '管理分类', description: '新增、排序或整理网站分类', keywords: '分类 分组 排序 category', icon: <Grid3X3 />, run: () => setCategoryModalOpen(true) },
    { id: 'manage-workspaces', label: '管理桌面', description: '新建、复制或切换桌面', keywords: '桌面 工作 学习 生活 workspace', icon: <Layers3 />, run: () => setWorkspaceManagerOpen(true) },
    { id: 'edit-layout', label: '调整卡片布局', description: `调整“${workspace.name}”的卡片尺寸`, keywords: '布局 卡片 宽度 高度 放大 缩小 layout resize', icon: <AppWindow />, run: enterLayoutEditing },
    { id: 'import-bookmarks', label: '导入浏览器书签', description: '从 Chrome、Edge 或 Firefox 迁移网站', keywords: '书签 收藏 导入 bookmark chrome edge firefox', icon: <BookMarked />, run: () => setSettingsOpen(true) },
    { id: 'open-settings', label: '桌面设置', description: '背景、组件与提醒', keywords: '设置 背景 组件 setting', icon: <Settings />, run: () => setSettingsOpen(true) },
    { id: 'keyboard-help', label: '键盘快捷操作', description: '查看搜索与命令快捷键', keywords: '快捷键 键盘 shortcut help', icon: <Keyboard />, run: () => setKeyboardHelpOpen(true) },
    ...(installPrompt ? [{ id: 'install-app', label: '安装到桌面', description: '作为独立应用打开微言桌面', keywords: '安装 桌面 应用 pwa install', icon: <Download />, run: installDeskApp }] : []),
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
  };

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
        <QuickActionsCard actions={deskCommands} limit={widgetItemLimit(workspace.layout.widgets[id].height, 3, 6, 9)} onOpenAll={() => setCommandOpen(true)} />
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
        <DailyOverviewCard openTaskCount={openTaskCount} todayEventCount={todayEventCount} nextReminderTime={nextReminder?.time || ''} focusTaskTitle={focusTaskTitle} />
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
        <a className="brand" href="/" aria-label="微言桌面首页">
          <span className="brand-mark">W</span>
          <span className="brand-copy"><strong>微言桌面</strong><small>WyanDesk</small></span>
        </a>
        <div className="header-actions">
          <div className="workspace-switcher-wrap">
            <button className={`workspace-trigger${workspaceMenuOpen ? ' active' : ''}`} type="button" onClick={() => { setWorkspaceMenuOpen((value) => !value); setSwitcherOpen(false); }} aria-label="切换桌面" aria-expanded={workspaceMenuOpen}>
              <Layers3 aria-hidden="true" /><span>{workspace.name}</span><ChevronDown aria-hidden="true" />
            </button>
            {workspaceMenuOpen && (
              <div className="workspace-popover" role="menu">
                <div className="popover-heading"><strong>切换桌面</strong><span>{state.workspaces.length}/8</span></div>
                <div className="workspace-menu-list">
                  {state.workspaces.map((item) => (
                    <button key={item.id} className={item.id === workspace.id ? 'active' : ''} type="button" role="menuitem" onClick={() => switchWorkspace(item.id)}>
                      <span><strong>{item.name}</strong><small>{item.shortcuts.length} 个网站 · {item.tasks.filter((task) => !task.done).length} 个待办</small></span>
                      {item.id === workspace.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <button className="workspace-manage-link" type="button" onClick={() => { setWorkspaceMenuOpen(false); setWorkspaceManagerOpen(true); }}><Settings />管理桌面</button>
              </div>
            )}
          </div>
          <div className="app-switcher-wrap">
            <button className={`icon-button${switcherOpen ? ' active' : ''}`} type="button" onClick={() => { setSwitcherOpen((value) => !value); setWorkspaceMenuOpen(false); }} aria-label="微言应用" aria-expanded={switcherOpen}>
              <Grid3X3 aria-hidden="true" />
            </button>
            {switcherOpen && (
              <div className="app-switcher" role="menu">
                <div className="popover-heading"><strong>微言应用</strong><a href="https://wyanhub.com" target="_blank" rel="noreferrer">WyanHub <ChevronRight /></a></div>
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
          <span className={`local-status${deskSync.user && deskSync.status !== 'local' ? ' cloud-active' : ''}`}>
            {deskSync.user && deskSync.status !== 'local' ? <Cloud aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
            {deskSync.status === 'saving' ? '同步中' : deskSync.user && deskSync.status === 'local' ? '仅本机' : deskSync.user ? '云端已连接' : deskSync.status === 'checking' ? '检查登录' : deskSync.status === 'extension' ? '扩展本地' : '本地模式'}
          </span>
          <button className="text-button login-button" type="button" onClick={deskSync.user ? () => setSettingsOpen(true) : deskSync.login}>{deskSync.user ? deskSync.user.userName : deskSync.status === 'extension' ? '网页同步' : '登录同步'}</button>
          <button className="icon-button inbox-trigger" type="button" onClick={() => setInboxOpen(true)} aria-label={`收集箱，${state.inbox.length} 条待整理`} title="收集箱"><Inbox aria-hidden="true" />{state.inbox.length > 0 && <span>{Math.min(state.inbox.length, 99)}</span>}</button>
          <button className={`text-button layout-header-button${layoutEditing ? ' active' : ''}`} type="button" onClick={() => layoutEditing ? setLayoutEditing(false) : enterLayoutEditing()} aria-label={layoutEditing ? '完成桌面布局调整' : '调整桌面布局和组件顺序'} aria-pressed={layoutEditing} title={layoutEditing ? '完成布局调整' : '调整桌面布局和组件顺序'}><AppWindow aria-hidden="true" /><span>{layoutEditing ? '完成布局' : '调整布局'}</span></button>
          <button className="icon-button" type="button" onClick={() => lockDesktop(true)} aria-label="全屏锁定桌面" title="全屏锁定桌面"><Lock aria-hidden="true" /></button>
          <button className="icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="桌面设置"><Settings aria-hidden="true" /></button>
        </div>
      </header>

      <main className="desk-main">
        <section className="welcome" aria-labelledby="welcomeTitle">
          <p>{dateLabel}</p>
          <h1 id="welcomeTitle"><time>{timeLabel}</time><span>{greeting(now.getHours())}</span></h1>
          <form className="desk-search" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" />
            <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站或输入关键词" aria-label="搜索网站或网页" />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清空搜索"><X /></button>}
            <button className="command-trigger" type="button" onClick={() => setCommandOpen(true)} aria-label="打开命令中心"><Command /><span>⌘ K</span></button>
          </form>
        </section>

        <div className="desk-layout" data-rail-width={workspace.layout.railWidth}>
          <div className="desk-primary">
          {state.preferences.showRecent && recentShortcuts.length > 0 && (
            <section className="recent-strip glass-panel" aria-label="最近使用">
              <div className="recent-label"><History aria-hidden="true" /><span><strong>最近使用</strong><small>继续刚才的工作</small></span></div>
              <div className="recent-list">
                {recentShortcuts.slice(0, 5).map((shortcut) => (
                  <button key={shortcut.id} type="button" onClick={() => openShortcut(shortcut)} title={shortcut.title}>
                    <span style={{ '--shortcut-color': shortcut.accent } as React.CSSProperties}>{shortcut.icon}</span><small>{shortcut.title}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
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
                <button className="quiet-button category-manage-button" type="button" onClick={() => setCategoryModalOpen(true)}><Grid3X3 aria-hidden="true" />分类</button>
                <button className="quiet-button" type="button" onClick={openShortcutManager}>管理</button>
                <button className="primary-small-button" type="button" onClick={openShortcutModal}><Plus aria-hidden="true" />添加</button>
              </div>
            </div>

            {!query && (
              <div className="category-tabs" role="tablist" aria-label="网站分类">
                {categories.map((category) => (
                  <button key={category} className={category === activeCategory ? 'active' : ''} type="button" role="tab" aria-selected={category === activeCategory} onClick={() => setActiveCategory(category)}>
                    {category}<span>{workspace.shortcuts.filter((item) => item.category === category).length}</span>
                  </button>
                ))}
              </div>
            )}

            {visibleShortcuts.length ? (
              <>
                <div className={`shortcut-grid${state.preferences.compactShortcuts ? ' compact-grid' : ''}`}>
                  {displayedShortcuts.map((shortcut) => (
                    <ShortcutCard key={shortcut.id} shortcut={shortcut} compact={state.preferences.compactShortcuts} onOpen={recordShortcut} />
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
            {workspace.layout.widgetOrder.map(renderRailWidget)}
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
        <span className="desk-save-status">{saveStatus === 'error' ? '保存失败，请导出备份' : saveStatus === 'saving' ? '正在保存…' : '已保存到当前浏览器'}</span>
      </footer>

      {settingsOpen && (
        <div className="drawer-layer">
          <button className="drawer-backdrop" type="button" onClick={() => setSettingsOpen(false)} aria-label="关闭设置" />
          <aside className="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
            <div className="drawer-heading"><div><span>微言桌面</span><h2 id="settingsTitle">桌面设置</h2></div><button className="icon-button" type="button" onClick={() => setSettingsOpen(false)} aria-label="关闭"><X /></button></div>

            <section className="settings-section">
              <div className="settings-title"><Palette /><div><strong>环境风格</strong><small>场景只位于内容底层</small></div></div>
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

            <section className="settings-section">
              <div className="settings-title"><AppWindow /><div><strong>桌面组件</strong><small>两列排列，隐藏不会删除数据</small></div></div>
              <button className="layout-edit-trigger" type="button" onClick={enterLayoutEditing}><AppWindow aria-hidden="true" /><span><strong>调整卡片布局</strong><small>宽度、高度与主区域比例</small></span><ChevronRight aria-hidden="true" /></button>
              <SettingToggle label="紧凑网站卡片" description="同一屏显示更多网站" checked={state.preferences.compactShortcuts} onChange={(checked) => updatePreferences({ compactShortcuts: checked })} />
              <div className="component-settings-heading"><strong>右侧工作区</strong><small>用箭头调整卡片先后顺序</small></div>
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
                          : undefined}
                    />
                  );
                })}
              </div>
              <div className="component-settings-heading secondary"><strong>顶部内容</strong><small>固定在网站卡片上方</small></div>
              <div className="component-settings-grid auxiliary">
                <ComponentSettingCard label="最近使用" description="快速返回常用网站" checked={state.preferences.showRecent} onChange={(checked) => updatePreferences({ showRecent: checked })} />
                <ComponentSettingCard label="时间事件" description={state.timeEvents.length ? `${state.timeEvents.length} 个累计或倒计时` : '添加后才显示'} checked={state.preferences.showTimeEvents} onChange={(checked) => updatePreferences({ showTimeEvents: checked })} />
              </div>
            </section>

            <section className="settings-section compact-section">
              <div className="settings-title"><Search /><div><strong>默认搜索</strong></div></div>
              <div className="segmented-control">
                <button className={state.preferences.searchEngine === 'baidu' ? 'active' : ''} type="button" onClick={() => updatePreferences({ searchEngine: 'baidu' })}>百度</button>
                <button className={state.preferences.searchEngine === 'bing' ? 'active' : ''} type="button" onClick={() => updatePreferences({ searchEngine: 'bing' })}>必应</button>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-title"><Cloud /><div><strong>账号与同步</strong><small>本地优先，离线时继续使用</small></div></div>
              {deskSync.user ? (
                <>
                  <div className={`sync-account-row${deskSync.status === 'local' ? ' muted' : ''}`}><span>{deskSync.status === 'local' ? <CloudOff /> : <Cloud />}</span><span><strong>{deskSync.user.userName}</strong><small>{deskSync.status === 'saving' ? '正在处理云端数据…' : deskSync.status === 'local' ? '云端桌面已删除，本机内容仍保留' : deskSync.status === 'conflict' ? '需要选择数据版本' : deskSync.status === 'error' ? '同步暂时中断' : '本机与云端已连接'}</small></span></div>
                  <div className="sync-actions">
                    <button type="button" onClick={() => void deskSync.syncNow()} disabled={deskSync.status === 'saving'}><RefreshCw />{deskSync.status === 'local' ? '重新开启同步' : '立即同步'}</button>
                    {deskSync.status !== 'local' && <button type="button" onClick={() => setCloudHistoryOpen(true)}><History />历史版本</button>}
                  </div>
                  {deskSync.status !== 'local' && <button className="cloud-delete-trigger" type="button" onClick={() => { setSettingsOpen(false); setDeleteCloudOpen(true); }} disabled={deskSync.status === 'saving'}><Trash2 />删除云端桌面数据</button>}
                </>
              ) : (
                <>
                  <div className="sync-account-row muted"><span><CloudOff /></span><span><strong>{deskSync.status === 'extension' ? '扩展使用本地数据' : '尚未登录'}</strong><small>{deskSync.status === 'extension' ? '登录同步请打开网页版微言桌面' : '登录后可在不同设备同步桌面'}</small></span></div>
                  <button className="install-app-button" type="button" onClick={deskSync.login}><Cloud />{deskSync.status === 'extension' ? '打开网页版同步' : '登录并开启同步'}</button>
                </>
              )}
              {deskSync.error && <p className="settings-error">{deskSync.error}</p>}
              <p className="settings-hint">同步服务使用 WyanHub 统一登录；删除云端数据不会删除当前浏览器里的桌面。</p>
            </section>

            <section className="settings-section">
              <div className="settings-title"><LockKeyhole /><div><strong>桌面锁屏</strong><small>临时遮挡当前网页中的私人内容</small></div></div>
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
                <span><strong>锁屏提示</strong><small>留空则不显示，最多 48 个字</small></span>
                <input value={state.preferences.lockMessage} onChange={(event) => updatePreferences({ lockMessage: event.target.value.slice(0, 48) })} maxLength={48} placeholder="例如：专注一下，慢慢来" />
              </label>
              <div className="lock-security-row">
                <span><strong>本地解锁密码</strong><small>{lockPinEnabled ? '已启用，仅保存在当前浏览器' : '默认关闭'}</small></span>
                {lockPinEnabled ? (
                  <span className="lock-security-actions"><button type="button" onClick={() => setLockPinMode('change')}>修改</button><button type="button" onClick={() => setLockPinMode('disable')}>关闭</button></span>
                ) : <button type="button" onClick={() => setLockPinMode('create')}>启用</button>}
              </div>
              <SettingToggle label="锁屏活动记录" description="记录页面内操作与切屏，不保存输入内容" checked={state.preferences.lockActivityEnabled} onChange={(checked) => updatePreferences({ lockActivityEnabled: checked })} />
              <div className="lock-activity-setting-row">
                <span><strong>{lockActivityCount ? `${lockActivityCount} 次本地活动` : '还没有活动记录'}</strong><small>{latestLockActivity ? `最近 ${new Date(latestLockActivity.lastAt).toLocaleString('zh-CN', { hour12: false })}` : '只保存在当前浏览器'}</small></span>
                <button type="button" disabled={!lockActivityLog.length} onClick={() => { setSettingsOpen(false); setLockActivityPanelOpen(true); }}>查看记录</button>
              </div>
              <button className="lock-now-button" type="button" onClick={() => lockDesktop(true)}><Lock />全屏锁定桌面</button>
              <p className="settings-hint">活动记录不包含具体按键、鼠标位置或其他应用；网页锁屏仍不能替代系统锁屏。</p>
            </section>

            <section className="settings-section settings-tools-section">
              <div className="settings-title"><Wrench /><div><strong>更多工具</strong><small>低频功能集中放置，按需使用</small></div></div>
              <div className="settings-tool-grid">
                {installPrompt && (
                  <article className="settings-tool-card">
                    <div className="settings-tool-heading"><span><AppWindow /></span><div><strong>安装桌面</strong><small>像应用一样打开</small></div></div>
                    <div className="settings-tool-actions single"><button type="button" onClick={installDeskApp}><Download />安装</button></div>
                  </article>
                )}
                <article className="settings-tool-card">
                  <div className="settings-tool-heading"><span><Keyboard /></span><div><strong>键盘操作</strong><small>搜索、命令与弹层</small></div></div>
                  <div className="settings-tool-actions single"><button type="button" onClick={() => setKeyboardHelpOpen(true)}>查看快捷键</button></div>
                </article>
                <article className="settings-tool-card">
                  <div className="settings-tool-heading"><span><CalendarDays /></span><div><strong>日历交换</strong><small>当前“{workspace.name}”桌面</small></div></div>
                  <div className="settings-tool-actions">
                    <button type="button" onClick={exportCalendar}><Download />导出</button>
                    <label><input type="file" accept="text/calendar,.ics" onChange={importCalendar} /><FileUp />导入</label>
                  </div>
                </article>
                <article className="settings-tool-card">
                  <div className="settings-tool-heading"><span><FileJson /></span><div><strong>桌面模板</strong><small>仅分享网站与分类</small></div></div>
                  <div className="settings-tool-actions">
                    <button type="button" onClick={exportWorkspaceTemplate}><Download />导出</button>
                    <label><input type="file" accept="application/json,.json" onChange={importWorkspaceTemplate} /><FileUp />导入</label>
                  </div>
                </article>
              </div>
              <p className="settings-hint">日历导入会自动跳过重复日程；桌面模板不会包含任务、便签、日程或最近使用。</p>
            </section>

            <section className="settings-section">
              <div className="settings-title"><Database /><div><strong>数据备份</strong><small>迁移到其他浏览器或设备</small></div></div>
              <div className="backup-actions">
                <button type="button" onClick={exportDeskBackup}><Download />导出数据</button>
                <label><input type="file" accept="application/json,.json" onChange={importDeskBackup} /><FileUp />导入备份</label>
              </div>
              {recoveryAvailable && <button className="recovery-download" type="button" onClick={exportRecoveryData}><Download />下载异常数据副本</button>}
              <label className="bookmark-import"><input type="file" accept="text/html,.html,.htm" onChange={importBrowserBookmarks} /><BookMarked /><span><strong>导入书签 HTML（兼容方式）</strong><small>安装扩展后，可在扩展按钮里一键双向迁移书签</small></span><FileUp /></label>
              <p className="settings-hint">备份包含网站、分类、任务、便签和桌面设置。HTML 适合跨浏览器迁移；扩展直连导入只追加并自动去重。</p>
            </section>

            <section className="settings-section about-section">
              <div className="settings-title"><Info /><div><strong>关于与支持</strong><small>微言桌面 WyanDesk · v{appVersion}</small></div></div>
              <div className="about-summary"><span>W</span><span><strong>本地优先，安静好用</strong><small>隐私边界、使用约定与问题反馈</small></span></div>
              <div className="about-actions">
                <button type="button" onClick={() => { setSettingsOpen(false); setTrustPanel('privacy'); }}><ShieldCheck />隐私说明</button>
                <button type="button" onClick={() => { setSettingsOpen(false); setTrustPanel('terms'); }}><FileText />用户协议</button>
                <button type="button" onClick={() => { setSettingsOpen(false); setTrustPanel('feedback'); }}><MessageSquareText />反馈问题</button>
              </div>
            </section>

            <button className="reset-button" type="button" onClick={resetDesktop}><RotateCcw />恢复默认桌面</button>
          </aside>
        </div>
      )}

      {shortcutModalOpen && (
        <div className="modal-layer" role="presentation">
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
        </div>
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
        <div className="modal-layer" role="presentation">
          <button className="modal-backdrop" type="button" onClick={() => setEventModalOpen(false)} aria-label="关闭" />
          <form className="shortcut-modal" onSubmit={addEvent} role="dialog" aria-modal="true" aria-labelledby="eventModalTitle">
            <div className="modal-heading"><div><span className="modal-icon"><CalendarPlus /></span><div><h2 id="eventModalTitle">添加日程</h2><p>本地保存，不连接第三方账号</p></div></div><button className="icon-button" type="button" onClick={() => setEventModalOpen(false)} aria-label="关闭"><X /></button></div>
            <div className="form-grid">
              <label><span>日程名称</span><input autoFocus value={eventDraft.title} onChange={(event) => setEventDraft((current) => ({ ...current, title: event.target.value }))} placeholder="例如：项目周会" required /></label>
              <div className="split-fields"><label><span>日期</span><input type="date" min={todayKey} value={eventDraft.date} onChange={(event) => setEventDraft((current) => ({ ...current, date: event.target.value }))} required /></label><label><span>时间</span><input type="time" value={eventDraft.time} onChange={(event) => setEventDraft((current) => ({ ...current, time: event.target.value }))} required /></label></div>
            </div>
            <div className="modal-actions"><button className="quiet-button" type="button" onClick={() => setEventModalOpen(false)}>取消</button><button className="primary-button" type="submit"><Plus />保存日程</button></div>
          </form>
        </div>
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

      {inboxOpen && <InboxModal items={state.inbox} workspaces={state.workspaces} activeWorkspaceId={workspace.id} onAdd={addInboxItem} onClose={() => setInboxOpen(false)} onDelete={removeInboxItem} onOrganize={organizeInboxItem} />}

      {onboardingOpen && <OnboardingModal extensionInstalled={isExtensionRuntime()} onComplete={completeOnboarding} onImportBookmarks={importBrowserBookmarks} onTemplate={applyOnboardingTemplate} />}

      <CommandPalette open={commandOpen} commands={deskCommands} shortcuts={commandShortcuts} currentWorkspaceId={workspace.id} getDynamicCommands={dynamicCommandsForQuery} onClose={() => setCommandOpen(false)} onOpenShortcut={openCommandShortcut} />

      {keyboardHelpOpen && <KeyboardHelpModal onClose={() => setKeyboardHelpOpen(false)} />}
      {lockPinMode && <LockPinModal mode={lockPinMode} onClose={() => setLockPinMode(null)} onChanged={(enabled) => { setLockPinEnabled(enabled); setLockPinMode(null); notify(enabled ? '解锁密码已启用' : '解锁密码已关闭'); }} />}
      {lockActivityPanelOpen && <LockActivityModal entries={lockActivityLog} onClose={() => setLockActivityPanelOpen(false)} onClear={clearLockActivityHistory} />}

      {trustPanel && <TrustCenterModal initialPanel={trustPanel} version={appVersion} signedIn={Boolean(deskSync.user)} onClose={() => { setTrustPanel(null); setSettingsOpen(true); }} onLogin={deskSync.login} onSubmitFeedback={(message) => deskSync.submitFeedback(message, appVersion)} />}

      {deleteCloudOpen && deskSync.user && <DeleteCloudDataModal userName={deskSync.user.userName} onClose={() => { setDeleteCloudOpen(false); setSettingsOpen(true); }} onDelete={deskSync.deleteCloudData} onDeleted={() => { setDeleteCloudOpen(false); setCloudHistoryOpen(false); setSettingsOpen(true); notify('云端数据已删除，本地桌面仍保留'); }} />}

      {cloudHistoryOpen && <CloudHistoryModal onClose={() => setCloudHistoryOpen(false)} onLoad={deskSync.listRevisions} onRestore={deskSync.restoreRevision} />}

      {syncConflictOpen && deskSync.conflict && <SyncConflictModal onClose={() => setSyncConflictOpen(false)} onKeepLocal={deskSync.keepLocal} onUseCloud={deskSync.useCloud} />}

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
            <h1 id="lockScreenTitle"><FlipClock value={now} /></h1>
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
