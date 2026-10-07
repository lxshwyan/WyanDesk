import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { DeskState } from '../types';
import { isExtensionRuntime } from '../lib/extensionBridge';
import { migrateDeskState } from '../lib/storage';
import {
  backupSyncConflict,
  clearSyncMetadata,
  cloudLoginURL,
  CloudConflictError,
  deleteCloudState,
  fetchCloudRevision,
  fetchCloudRevisions,
  fetchCloudState,
  fetchCloudUser,
  putCloudState,
  readSyncPausedUserId,
  readSyncMetadata,
  stateFingerprint,
  submitCloudFeedback,
  writeSyncPausedUserId,
  writeSyncMetadata,
  type CloudEnvelope,
  type CloudRevision,
  type CloudUser,
  type SyncMetadata,
} from '../lib/cloudSync';

export type DeskSyncStatus = 'local' | 'checking' | 'synced' | 'saving' | 'conflict' | 'error' | 'extension';

interface UseDeskSyncResult {
  status: DeskSyncStatus;
  user: CloudUser | null;
  error: string;
  conflict: CloudEnvelope | null;
  login: () => void;
  syncNow: () => Promise<void>;
  keepLocal: () => Promise<void>;
  useCloud: () => void;
  listRevisions: () => Promise<CloudRevision[]>;
  restoreRevision: (version: number) => Promise<void>;
  deleteCloudData: () => Promise<void>;
  submitFeedback: (message: string, appVersion: string) => Promise<void>;
}

export function useDeskSync(state: DeskState, setState: Dispatch<SetStateAction<DeskState>>, isNewBrowser: boolean): UseDeskSyncResult {
  const [status, setStatus] = useState<DeskSyncStatus>(() => isExtensionRuntime() ? 'extension' : 'checking');
  const [user, setUser] = useState<CloudUser | null>(null);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<CloudEnvelope | null>(null);
  const stateRef = useRef(state);
  const userRef = useRef<CloudUser | null>(null);
  const metaRef = useRef<SyncMetadata | null>(readSyncMetadata());
  const pendingUploadRef = useRef<Promise<CloudEnvelope> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const remember = useCallback((currentUser: CloudUser, version: number, nextState: DeskState) => {
    const metadata = { userId: currentUser.userId, version, fingerprint: stateFingerprint(nextState) };
    metaRef.current = metadata;
    writeSyncMetadata(metadata);
  }, []);

  const upload = useCallback(async (currentUser: CloudUser, nextState: DeskState, baseVersion: number) => {
    setStatus('saving');
    const request = putCloudState(nextState, baseVersion);
    pendingUploadRef.current = request;
    try {
      const saved = await request;
      remember(currentUser, saved.version, nextState);
      setConflict(null);
      setError('');
      setStatus('synced');
    } catch (cause) {
      if (cause instanceof CloudConflictError) {
        setConflict(cause.current);
        setStatus('conflict');
      } else {
        setError(cause instanceof Error ? cause.message : '云端同步失败');
        setStatus('error');
      }
      throw cause;
    } finally {
      if (pendingUploadRef.current === request) pendingUploadRef.current = null;
    }
  }, [remember]);

  const reconcile = useCallback(async (currentUser: CloudUser) => {
    const localState = stateRef.current;
    const localFingerprint = stateFingerprint(localState);
    const remote = await fetchCloudState();
    if (!remote.state) {
      await upload(currentUser, localState, 0);
      return;
    }
    const cloudState = migrateDeskState(remote.state);
    const cloudFingerprint = stateFingerprint(cloudState);
    const metadata = metaRef.current?.userId === currentUser.userId ? metaRef.current : null;
    if (cloudFingerprint === localFingerprint) {
      remember(currentUser, remote.version, localState);
      setStatus('synced');
      return;
    }
    if (isNewBrowser || metadata?.fingerprint === localFingerprint) {
      setState(cloudState);
      stateRef.current = cloudState;
      remember(currentUser, remote.version, cloudState);
      setStatus('synced');
      return;
    }
    if (metadata && metadata.version === remote.version) {
      await upload(currentUser, localState, remote.version);
      return;
    }
    setConflict(remote);
    setStatus('conflict');
  }, [isNewBrowser, remember, setState, upload]);

  const syncNow = useCallback(async (resumePaused = true) => {
    if (isExtensionRuntime()) {
      window.open('https://desk.wyanhub.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    setStatus('checking');
    try {
      const currentUser = await fetchCloudUser();
      if (!currentUser) {
        userRef.current = null;
        setUser(null);
        setStatus('local');
        return;
      }
      userRef.current = currentUser;
      setUser(currentUser);
      if (readSyncPausedUserId() === currentUser.userId && !resumePaused) {
        setError('');
        setStatus('local');
        return;
      }
      if (resumePaused) writeSyncPausedUserId(null);
      await reconcile(currentUser);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '暂时无法连接同步服务');
      setStatus('error');
    }
  }, [reconcile]);

  useEffect(() => {
    if (startedRef.current || isExtensionRuntime()) return;
    startedRef.current = true;
    void syncNow(false);
  }, [syncNow]);

  useEffect(() => {
    const currentUser = userRef.current;
    const metadata = metaRef.current;
    if (status !== 'synced' || !currentUser || !metadata || metadata.userId !== currentUser.userId) return;
    if (stateFingerprint(state) === metadata.fingerprint) return;
    const timer = window.setTimeout(() => {
      void upload(currentUser, stateRef.current, metadata.version).catch(() => undefined);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [state, status, upload]);

  const keepLocal = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !conflict) return;
    if (conflict.state) backupSyncConflict(migrateDeskState(conflict.state), 'cloud');
    await upload(currentUser, stateRef.current, conflict.version);
  }, [conflict, upload]);

  const useCloud = useCallback(() => {
    const currentUser = userRef.current;
    if (!currentUser || !conflict?.state) return;
    backupSyncConflict(stateRef.current, 'local');
    const next = migrateDeskState(conflict.state);
    setState(next);
    stateRef.current = next;
    remember(currentUser, conflict.version, next);
    setConflict(null);
    setError('');
    setStatus('synced');
  }, [conflict, remember, setState]);

  const listRevisions = useCallback(async () => fetchCloudRevisions(), []);

  const restoreRevision = useCallback(async (version: number) => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error('请先登录同步');
    const [revision, current] = await Promise.all([fetchCloudRevision(version), fetchCloudState()]);
    if (!revision.state) throw new Error('历史版本内容为空');
    const next = migrateDeskState(revision.state);
    backupSyncConflict(stateRef.current, 'local');
    await upload(currentUser, next, current.version);
    setState(next);
    stateRef.current = next;
  }, [setState, upload]);

  const deleteCloudData = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error('请先登录同步');
    setStatus('saving');
    setError('');
    try {
      if (pendingUploadRef.current) await pendingUploadRef.current.catch(() => undefined);
      await deleteCloudState();
      metaRef.current = null;
      clearSyncMetadata();
      writeSyncPausedUserId(currentUser.userId);
      setConflict(null);
      setStatus('local');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '云端数据删除失败');
      setStatus('error');
      throw cause;
    }
  }, []);

  const submitFeedback = useCallback(async (message: string, appVersion: string) => {
    if (!userRef.current) throw new Error('请先登录后提交反馈');
    await submitCloudFeedback(message, appVersion);
  }, []);

  const login = useCallback(() => {
    if (isExtensionRuntime()) {
      window.open('https://desk.wyanhub.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.assign(cloudLoginURL());
  }, []);

  return { status, user, error, conflict, login, syncNow, keepLocal, useCloud, listRevisions, restoreRevision, deleteCloudData, submitFeedback };
}
