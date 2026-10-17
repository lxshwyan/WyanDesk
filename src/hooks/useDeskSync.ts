import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { DeskState } from '../types';
import { isExtensionRuntime } from '../lib/extensionBridge';
import { migrateDeskState } from '../lib/storage';
import {
  decryptDeskState,
  encryptDeskState,
  isEncryptedDeskState,
  readSessionPassphrase,
  rememberSessionPassphrase,
  validateSyncPassphrase,
} from '../lib/cloudCrypto';
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
  logoutCloudSession,
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

export type DeskSyncStatus = 'local' | 'checking' | 'synced' | 'saving' | 'conflict' | 'locked' | 'error' | 'extension';

class CloudEncryptionLockedError extends Error {}

interface UseDeskSyncResult {
  status: DeskSyncStatus;
  user: CloudUser | null;
  error: string;
  conflict: CloudEnvelope | null;
  encryptionEnabled: boolean;
  login: () => void;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  keepLocal: () => Promise<void>;
  useCloud: () => void;
  listRevisions: () => Promise<CloudRevision[]>;
  restoreRevision: (version: number) => Promise<void>;
  deleteCloudData: () => Promise<void>;
  submitFeedback: (message: string, appVersion: string) => Promise<void>;
  enableEncryption: (passphrase: string) => Promise<void>;
  unlockEncryption: (passphrase: string) => Promise<void>;
  disableEncryption: () => Promise<void>;
}

export function useDeskSync(state: DeskState, setState: Dispatch<SetStateAction<DeskState>>, isNewBrowser: boolean): UseDeskSyncResult {
  const [status, setStatus] = useState<DeskSyncStatus>(() => isExtensionRuntime() ? 'extension' : 'checking');
  const [user, setUser] = useState<CloudUser | null>(null);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState<CloudEnvelope | null>(null);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const stateRef = useRef(state);
  const userRef = useRef<CloudUser | null>(null);
  const metaRef = useRef<SyncMetadata | null>(readSyncMetadata());
  const pendingUploadRef = useRef<Promise<CloudEnvelope> | null>(null);
  const startedRef = useRef(false);
  const encryptedRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const remember = useCallback((currentUser: CloudUser, version: number, nextState: DeskState) => {
    const metadata = { userId: currentUser.userId, version, fingerprint: stateFingerprint(nextState) };
    metaRef.current = metadata;
    writeSyncMetadata(metadata);
  }, []);

  const decodeCloudValue = useCallback(async (value: unknown, adoptFormat = true): Promise<DeskState> => {
    if (!isEncryptedDeskState(value)) {
      if (adoptFormat) {
        encryptedRef.current = false;
        setEncryptionEnabled(false);
      }
      return migrateDeskState(value);
    }
    if (adoptFormat) {
      encryptedRef.current = true;
      setEncryptionEnabled(true);
    }
    const passphrase = readSessionPassphrase();
    if (!passphrase) throw new CloudEncryptionLockedError('请输入端到端同步密码');
    return migrateDeskState(await decryptDeskState(value, passphrase));
  }, []);

  const upload = useCallback(async (currentUser: CloudUser, nextState: DeskState, baseVersion: number) => {
    setStatus('saving');
    let cloudState: unknown = nextState;
    if (encryptedRef.current) {
      const passphrase = readSessionPassphrase();
      if (!passphrase) {
        setStatus('locked');
        throw new CloudEncryptionLockedError('请输入端到端同步密码');
      }
      cloudState = await encryptDeskState(nextState, passphrase);
    }
    const request = putCloudState(cloudState, baseVersion);
    pendingUploadRef.current = request;
    try {
      const saved = await request;
      remember(currentUser, saved.version, nextState);
      setConflict(null);
      setError('');
      setStatus('synced');
    } catch (cause) {
      if (cause instanceof CloudConflictError) {
        try {
          const current = cause.current.state ? await decodeCloudValue(cause.current.state) : null;
          setConflict({ ...cause.current, state: current });
          setStatus('conflict');
        } catch (decodeError) {
          setError(decodeError instanceof Error ? decodeError.message : '云端加密数据无法解锁');
          setStatus('locked');
        }
      } else {
        setError(cause instanceof Error ? cause.message : '云端同步失败');
        setStatus('error');
      }
      throw cause;
    } finally {
      if (pendingUploadRef.current === request) pendingUploadRef.current = null;
    }
  }, [decodeCloudValue, remember]);

  const reconcile = useCallback(async (currentUser: CloudUser) => {
    const localState = stateRef.current;
    const localFingerprint = stateFingerprint(localState);
    const remote = await fetchCloudState();
    if (!remote.state) {
      await upload(currentUser, localState, 0);
      return;
    }
    const cloudState = await decodeCloudValue(remote.state);
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
    setConflict({ ...remote, state: cloudState });
    setStatus('conflict');
  }, [decodeCloudValue, isNewBrowser, remember, setState, upload]);

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
      setStatus(cause instanceof CloudEncryptionLockedError || (cause instanceof Error && cause.message.includes('同步密码')) ? 'locked' : 'error');
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
    const next = await decodeCloudValue(revision.state, false);
    backupSyncConflict(stateRef.current, 'local');
    await upload(currentUser, next, current.version);
    setState(next);
    stateRef.current = next;
  }, [decodeCloudValue, setState, upload]);

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
      rememberSessionPassphrase('');
      encryptedRef.current = false;
      setEncryptionEnabled(false);
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

  const enableEncryption = useCallback(async (rawPassphrase: string) => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error('请先登录同步');
    const passphrase = validateSyncPassphrase(rawPassphrase);
    rememberSessionPassphrase(passphrase);
    const previous = encryptedRef.current;
    encryptedRef.current = true;
    setEncryptionEnabled(true);
    try {
      const remote = await fetchCloudState();
      await upload(currentUser, stateRef.current, remote.version);
    } catch (cause) {
      if (!previous) {
        encryptedRef.current = false;
        setEncryptionEnabled(false);
        rememberSessionPassphrase('');
      }
      throw cause;
    }
  }, [upload]);

  const unlockEncryption = useCallback(async (rawPassphrase: string) => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error('请先登录同步');
    const passphrase = validateSyncPassphrase(rawPassphrase);
    rememberSessionPassphrase(passphrase);
    setError('');
    try {
      await reconcile(currentUser);
    } catch (cause) {
      rememberSessionPassphrase('');
      setError(cause instanceof Error ? cause.message : '同步密码错误');
      setStatus('locked');
      throw cause;
    }
  }, [reconcile]);

  const disableEncryption = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) throw new Error('请先登录同步');
    const remote = await fetchCloudState();
    const previous = encryptedRef.current;
    encryptedRef.current = false;
    setEncryptionEnabled(false);
    try {
      await upload(currentUser, stateRef.current, remote.version);
      rememberSessionPassphrase('');
    } catch (cause) {
      encryptedRef.current = previous;
      setEncryptionEnabled(previous);
      throw cause;
    }
  }, [upload]);

  const login = useCallback(() => {
    if (isExtensionRuntime()) {
      window.open('https://desk.wyanhub.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.assign(cloudLoginURL());
  }, []);

  const logout = useCallback(async () => {
    if (!userRef.current) return;
    setError('');
    try {
      await logoutCloudSession();
      rememberSessionPassphrase('');
      window.location.assign('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '退出失败，请稍后重试');
      throw cause;
    }
  }, []);

  return { status, user, error, conflict, encryptionEnabled, login, logout, syncNow, keepLocal, useCloud, listRevisions, restoreRevision, deleteCloudData, submitFeedback, enableEncryption, unlockEncryption, disableEncryption };
}
