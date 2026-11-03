import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ArrowUpRight, ChevronDown, History, Keyboard, LayoutGrid, Search, X } from 'lucide-react';
import type { Shortcut } from '../types';
import type { WidgetSearchItem } from '../lib/widgetSearch';
import { desktopSearchActions, type SearchAction } from '../lib/searchActions';
import { primaryModifierKey } from '../lib/keyboardPlatform';
import { WebsiteIcon } from './WebsiteIcon';

interface Props {
  query: string;
  engine: 'baidu' | 'bing';
  shortcuts: Shortcut[];
  recent: Shortcut[];
  widgets: WidgetSearchItem[];
  inputRef: RefObject<HTMLInputElement | null>;
  onQuery: (value: string) => void;
  onEngine: (engine: 'baidu' | 'bing') => void;
  onOpen: (action: SearchAction) => void;
  onAllContent: () => void;
}

export function DesktopSearch({ query, engine, shortcuts, recent, widgets, inputRef, onQuery, onEngine, onOpen, onAllContent }: Props) {
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState(0);
  const composing = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const actions = useMemo(() => desktopSearchActions(query, engine, shortcuts, widgets), [query, engine, shortcuts, widgets]);
  const activeIndex = Math.min(selected, Math.max(0, actions.length - 1));
  const showActions = focused && !dismissed && actions.length > 0;
  const showRecent = focused && !dismissed && !query.trim() && recent.length > 0;

  useEffect(() => {
    const list = resultsRef.current;
    const option = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
  }, [activeIndex, showActions]);

  function open(action: SearchAction) {
    setDismissed(true);
    onOpen(action);
  }

  return <form className="desk-search" role="search"
    onFocus={() => setFocused(true)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    onSubmit={(event) => { event.preventDefault(); const action = actions[showActions ? activeIndex : 0]; if (!composing.current && action) open(action); }}>
    <label className="search-engine-select"><span className="sr-only">网页搜索引擎</span><select aria-label="网页搜索引擎" value={engine} onChange={(event) => { setSelected(0); onEngine(event.target.value === 'bing' ? 'bing' : 'baidu'); }}><option value="baidu">百度</option><option value="bing">必应</option></select><ChevronDown aria-hidden="true" /></label>
    <input ref={inputRef} value={query} role="combobox" aria-autocomplete="list" aria-controls={showActions ? 'desktopSearchResults' : undefined} aria-expanded={showActions} aria-activedescendant={showActions ? `desktop-search-${actions[activeIndex].id}` : undefined}
      aria-label="搜索网站、组件或网页" placeholder="搜索网站、组件或输入关键词" autoComplete="off"
      onFocus={() => { setDismissed(false); setSelected(0); }}
      onChange={(event) => { onQuery(event.target.value); setSelected(0); setDismissed(false); }}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || composing.current || event.keyCode === 229) { if (event.key === 'Enter') event.preventDefault(); return; }
        if (event.key === 'Escape') { setDismissed(true); setSelected(0); return; }
        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && actions.length) {
          event.preventDefault(); setDismissed(false);
          setSelected((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + actions.length) % actions.length);
        }
      }} />
    {query && <button type="button" onClick={() => { onQuery(''); setSelected(0); setDismissed(false); inputRef.current?.focus(); }} aria-label="清空搜索"><X /></button>}
    <button className="command-trigger" type="button" onClick={() => { setDismissed(true); onAllContent(); }} aria-label="搜索全部桌面内容" title={`搜索全部桌面内容（${primaryModifierKey()} K）`}><Keyboard aria-hidden="true" /><span>全部内容</span><kbd aria-hidden="true">{primaryModifierKey()} K</kbd></button>
    {showActions && <div ref={resultsRef} className="desktop-search-results" id="desktopSearchResults" role="listbox" aria-label="选择组件、网站或网页搜索">
      {actions.map((action, index) => <div key={action.id} id={`desktop-search-${action.id}`} role="option" aria-selected={index === activeIndex} className={`desktop-search-option${index === activeIndex ? ' active' : ''}`} onPointerMove={() => setSelected(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => open(action)}>
        <span className="desktop-search-symbol" aria-hidden="true">{action.shortcut ? <WebsiteIcon shortcut={action.shortcut} /> : action.kind === 'widget' ? <LayoutGrid /> : action.kind === 'web' ? <Search /> : <ArrowUpRight />}</span>
        <span className="desktop-search-copy"><strong>{action.title}</strong><small>{action.detail}</small></span>
        {index === activeIndex ? <kbd>Enter</kbd> : <ArrowUpRight aria-hidden="true" />}
      </div>)}
    </div>}
    {showRecent && <section className="search-recent-suggestions" aria-label="最近使用的网站">
      <div className="search-recent-label"><History aria-hidden="true" /><span>最近打开</span></div>
      <div className="search-recent-list">{recent.map((shortcut) => <button key={shortcut.id} type="button" onClick={() => open({ id: shortcut.id, kind: 'shortcut', title: shortcut.title, detail: '', url: shortcut.url, shortcut })} title={shortcut.title}><span><WebsiteIcon shortcut={shortcut} /></span><small>{shortcut.title}</small></button>)}</div>
    </section>}
  </form>;
}
