import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, Layers3, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { DeskWorkspace } from '../types';

interface WorkspaceManagerProps {
  workspaces: DeskWorkspace[];
  activeId: string;
  onAdd: (name: string) => boolean;
  onClose: () => void;
  onDelete: (workspace: DeskWorkspace) => void;
  onDuplicate: (workspace: DeskWorkspace) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRename: (id: string, name: string) => boolean;
  onSwitch: (id: string) => void;
}

export function WorkspaceManager({ workspaces, activeId, onAdd, onClose, onDelete, onDuplicate, onMove, onRename, onSwitch }: WorkspaceManagerProps) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');

  function submitNew(event: FormEvent) {
    event.preventDefault();
    if (onAdd(name)) setName('');
  }

  function startRename(workspace: DeskWorkspace) {
    setEditingId(workspace.id);
    setEditingName(workspace.name);
  }

  function saveRename(event: FormEvent) {
    event.preventDefault();
    if (onRename(editingId, editingName)) setEditingId('');
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭桌面管理" />
      <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspaceManagerTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Layers3 /></span><div><h2 id="workspaceManagerTitle">管理桌面</h2><p>网站、任务、日程和便签各自独立</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <form className="workspace-create" onSubmit={submitNew}>
          <input value={name} maxLength={12} onChange={(event) => setName(event.target.value)} placeholder="新桌面名称" aria-label="新桌面名称" />
          <button className="primary-button" type="submit"><Plus />新建空白</button>
        </form>

        <div className="workspace-list">
          {workspaces.map((workspace, index) => (
            <div className={`workspace-row${workspace.id === activeId ? ' active' : ''}`} key={workspace.id}>
              {editingId === workspace.id ? (
                <form className="workspace-rename" onSubmit={saveRename}>
                  <input autoFocus value={editingName} maxLength={12} onChange={(event) => setEditingName(event.target.value)} aria-label="桌面名称" />
                  <button type="submit" aria-label="保存名称"><Check /></button>
                  <button type="button" onClick={() => setEditingId('')} aria-label="取消重命名"><X /></button>
                </form>
              ) : (
                <button className="workspace-copy" type="button" onClick={() => onSwitch(workspace.id)}>
                  <span><strong>{workspace.name}</strong><small>{workspace.shortcuts.length} 个网站 · {workspace.tasks.filter((task) => !task.done).length} 个待办</small></span>
                  {workspace.id === activeId && <em><Check />当前</em>}
                </button>
              )}
              {editingId !== workspace.id && (
                <div className="workspace-actions">
                  <button type="button" onClick={() => onMove(workspace.id, -1)} disabled={index === 0} aria-label="上移桌面"><ArrowUp /></button>
                  <button type="button" onClick={() => onMove(workspace.id, 1)} disabled={index === workspaces.length - 1} aria-label="下移桌面"><ArrowDown /></button>
                  <button type="button" onClick={() => startRename(workspace)} aria-label="重命名桌面"><Pencil /></button>
                  <button type="button" onClick={() => onDuplicate(workspace)} aria-label="复制桌面"><Copy /></button>
                  <button className="danger" type="button" onClick={() => onDelete(workspace)} disabled={workspaces.length === 1} aria-label="删除桌面"><Trash2 /></button>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="workspace-hint">最多 8 个桌面。复制会保留当前桌面的内容，空白桌面从“常用”分类开始。</p>
      </section>
    </div>
  );
}
