import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AppWindow, CornerDownLeft, Search, X } from 'lucide-react';
import type { Shortcut } from '../types';
import { ManagedLayer } from './ManagedLayer';
import { interleaveSearchResults, searchMatches } from '../lib/deskSearch';

export interface CommandResource extends Omit<DeskCommand, 'run'> {
  kind: string;
  run: () => void | Promise<void>;
}

export interface DeskCommand {
  id: string;
  label: string;
  description: string;
  keywords: string;
  icon: ReactNode;
  run: () => void;
}

export interface CommandShortcut {
  shortcut: Shortcut;
  workspaceId: string;
  workspaceName: string;
}

interface CommandPaletteProps {
  open: boolean;
  commands: DeskCommand[];
  shortcuts: CommandShortcut[];
  currentWorkspaceId: string;
  initialQuery?: string;
  resources?: CommandResource[];
  onLoadTabs?: () => Promise<CommandResource[]>;
  getDynamicCommands?: (query: string) => DeskCommand[];
  onClose: () => void;
  onOpenShortcut: (item: CommandShortcut) => void;
}

type PaletteResult =
  | { key: string; type: 'command'; command: DeskCommand }
  | { key: string; type: 'resource'; resource: CommandResource }
  | { key: string; type: 'shortcut'; item: CommandShortcut };

export function CommandPalette({ open, commands, shortcuts, currentWorkspaceId, initialQuery = '', resources = [], onLoadTabs, getDynamicCommands, onClose, onOpenShortcut }: CommandPaletteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [tabs, setTabs] = useState<CommandResource[]>([]);
  const [tabStatus, setTabStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(false);
  const requestRef = useRef(0);

  const results = useMemo<PaletteResult[]>(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    const dynamicCommands = normalized && getDynamicCommands ? getDynamicCommands(query) : [];
    const matchingCommands = commands
      .filter((command) => !normalized || searchMatches(query, command.label, command.description, command.keywords))
      .map((command) => ({ key: `command-${command.id}`, type: 'command' as const, command }));
    const matchingShortcuts = shortcuts
      .filter((item) => normalized
        ? searchMatches(query, item.shortcut.title, item.shortcut.description, item.shortcut.category, item.shortcut.url, item.workspaceName)
        : item.workspaceId === currentWorkspaceId)
      .slice(0, normalized ? 6 : 4)
      .map((item) => ({ key: `shortcut-${item.workspaceId}-${item.shortcut.id}`, type: 'shortcut' as const, item }));
    const matchingResources = normalized ? [...tabs, ...resources]
      .filter((item) => searchMatches(query, item.label, item.description, item.keywords))
      .map((resource) => ({ key: `resource-${resource.kind}-${resource.id}`, type: 'resource' as const, resource })) : tabs.map((resource) => ({ key: `resource-tab-${resource.id}`, type: 'resource' as const, resource }));
    return [
      ...dynamicCommands.map((command) => ({ key: `dynamic-${command.id}`, type: 'command' as const, command })),
      ...interleaveSearchResults<PaletteResult>([matchingResources, matchingShortcuts, matchingCommands], 14),
    ].slice(0, 14);
  }, [commands, currentWorkspaceId, getDynamicCommands, query, shortcuts, resources, tabs]);

  useEffect(() => {
    aliveRef.current = open;
    requestRef.current++;
    setTabs([]);
    setTabStatus('');
    setBusy(false);
    if (!open) return;
    setQuery(initialQuery);
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => { aliveRef.current = false; window.cancelAnimationFrame(frame); };
  }, [open, initialQuery]);

  useEffect(() => setActiveIndex(0), [query]);
  const activeKey = results[activeIndex]?.key;
  useEffect(() => {
    if (open && activeKey) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, activeKey]);

  if (!open) return null;

  async function runResult(result: PaletteResult) {
    if (busy) return;
    if (result.type === 'resource') {
      const request = ++requestRef.current;
      setBusy(true);
      try { await result.resource.run(); if (aliveRef.current && request === requestRef.current) onClose(); }
      catch (error) { if (aliveRef.current && request === requestRef.current) setTabStatus(error instanceof Error ? error.message : '暂时无法打开，请重试'); }
      finally { if (aliveRef.current && request === requestRef.current) setBusy(false); }
      return;
    }
    onClose();
    if (result.type === 'command') result.command.run();
    else onOpenShortcut(result.item);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, Math.min(index + 1, results.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      void runResult(results[activeIndex]);
    }
  }

  return (
    <ManagedLayer className="command-layer" onEscape={onClose}>
      <button className="command-backdrop" type="button" onClick={onClose} aria-label="关闭命令中心" />
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="命令中心">
        <div className="command-search">
          <Search aria-hidden="true" />
          <input ref={inputRef} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={activeKey ? `${listId}-${activeIndex}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeyDown} placeholder="搜索网站、任务、便签与阅读资料" aria-label="搜索桌面内容与操作" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空"><X /></button> : <kbd>ESC</kbd>}
        </div>
        {onLoadTabs && <div className="command-tabs-access"><button className="quiet-button" type="button" disabled={busy} onClick={() => {
          const request = ++requestRef.current;
          setBusy(true);
          void onLoadTabs().then((items) => {
            if (!aliveRef.current || request !== requestRef.current) return;
            setTabs(items); setActiveIndex(0); setTabStatus(`已读取当前窗口 ${items.length} 个普通网页，仅本次搜索使用`);
          }).catch((error) => { if (aliveRef.current && request === requestRef.current) setTabStatus(error instanceof Error ? error.message : '读取失败，请重试'); }).finally(() => { if (aliveRef.current && request === requestRef.current) setBusy(false); });
        }}><AppWindow aria-hidden="true" />{busy ? '正在处理…' : tabs.length ? '刷新窗口标签' : '搜索已打开标签'}</button><small>点击后按需授权，不读取浏览历史</small></div>}
        {tabStatus && <p className="command-status" role="status">{tabStatus}</p>}
        <div className="command-results" id={listId} role="listbox" aria-label="可用命令">
          {results.map((result, index) => {
            const isCommand = result.type === 'command';
            const resource = result.type === 'resource' ? result.resource : null;
            const shortcut = result.type === 'shortcut' ? result.item : null;
            return (
              <button
                key={result.key}
                id={`${listId}-${index}`}
                ref={(node) => { optionRefs.current[index] = node; }}
                className={index === activeIndex ? 'active' : ''}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                disabled={busy}
                onClick={() => void runResult(result)}
              >
                <span className={`command-result-icon${shortcut ? ' website' : ''}`} style={shortcut ? { color: shortcut.shortcut.accent } : undefined}>
                  {isCommand ? result.command.icon : resource ? resource.icon : shortcut?.shortcut.icon}
                </span>
                <span className="command-result-copy">
                  <strong>{isCommand ? result.command.label : resource ? resource.label : shortcut?.shortcut.title}</strong>
                  <small>{isCommand ? result.command.description : resource ? resource.description : `${shortcut?.workspaceName} · ${shortcut?.shortcut.category} · ${shortcut?.shortcut.description || '快捷网站'}`}</small>
                </span>
                <span className="command-result-kind">{isCommand ? '操作' : resource?.kind || '网站'}<CornerDownLeft /></span>
              </button>
            );
          })}
          {!results.length && <div className="command-empty">没有匹配内容，试试标题、网址或正文关键词</div>}
        </div>
        <footer className="command-footer"><span><kbd>↑↓</kbd> 选择</span><span><kbd>↵</kbd> 执行</span><span>快捷：任务 · 收集 · g · bd · bing · fy</span></footer>
      </section>
    </ManagedLayer>
  );
}
