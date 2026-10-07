import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CornerDownLeft, Search, X } from 'lucide-react';
import type { Shortcut } from '../types';

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
  getDynamicCommands?: (query: string) => DeskCommand[];
  onClose: () => void;
  onOpenShortcut: (item: CommandShortcut) => void;
}

type PaletteResult =
  | { key: string; type: 'command'; command: DeskCommand }
  | { key: string; type: 'shortcut'; item: CommandShortcut };

export function CommandPalette({ open, commands, shortcuts, currentWorkspaceId, getDynamicCommands, onClose, onOpenShortcut }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<PaletteResult[]>(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    const dynamicCommands = normalized && getDynamicCommands ? getDynamicCommands(query) : [];
    const matchingCommands = commands
      .filter((command) => !normalized || `${command.label} ${command.description} ${command.keywords}`.toLocaleLowerCase('zh-CN').includes(normalized))
      .map((command) => ({ key: `command-${command.id}`, type: 'command' as const, command }));
    const matchingShortcuts = shortcuts
      .filter((item) => normalized
        ? `${item.shortcut.title} ${item.shortcut.description || ''} ${item.shortcut.category} ${item.shortcut.url} ${item.workspaceName}`.toLocaleLowerCase('zh-CN').includes(normalized)
        : item.workspaceId === currentWorkspaceId)
      .slice(0, normalized ? 6 : 4)
      .map((item) => ({ key: `shortcut-${item.workspaceId}-${item.shortcut.id}`, type: 'shortcut' as const, item }));
    return [
      ...dynamicCommands.map((command) => ({ key: `dynamic-${command.id}`, type: 'command' as const, command })),
      ...matchingCommands,
      ...matchingShortcuts,
    ].slice(0, 10);
  }, [commands, currentWorkspaceId, getDynamicCommands, query, shortcuts]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  function runResult(result: PaletteResult) {
    onClose();
    if (result.type === 'command') result.command.run();
    else onOpenShortcut(result.item);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      runResult(results[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className="command-layer" role="presentation">
      <button className="command-backdrop" type="button" onClick={onClose} aria-label="关闭命令中心" />
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="命令中心">
        <div className="command-search">
          <Search aria-hidden="true" />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleKeyDown} placeholder="搜索，或输入“任务 …”" aria-label="搜索命令与网站" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="清空"><X /></button> : <kbd>ESC</kbd>}
        </div>
        <div className="command-results" role="listbox" aria-label="可用命令">
          {results.map((result, index) => {
            const isCommand = result.type === 'command';
            return (
              <button
                key={result.key}
                className={index === activeIndex ? 'active' : ''}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runResult(result)}
              >
                <span className={`command-result-icon${isCommand ? '' : ' website'}`} style={isCommand ? undefined : { color: result.item.shortcut.accent }}>
                  {isCommand ? result.command.icon : result.item.shortcut.icon}
                </span>
                <span className="command-result-copy">
                  <strong>{isCommand ? result.command.label : result.item.shortcut.title}</strong>
                  <small>{isCommand ? result.command.description : `${result.item.workspaceName} · ${result.item.shortcut.category} · ${result.item.shortcut.description || '快捷网站'}`}</small>
                </span>
                <span className="command-result-kind">{isCommand ? '操作' : '打开'}<CornerDownLeft /></span>
              </button>
            );
          })}
          {!results.length && <div className="command-empty">没有匹配的命令或网站</div>}
        </div>
        <footer className="command-footer"><span><kbd>↑↓</kbd> 选择</span><span><kbd>↵</kbd> 执行</span><span>快捷：任务 · 收集 · g · bd · bing · fy</span></footer>
      </section>
    </div>
  );
}
