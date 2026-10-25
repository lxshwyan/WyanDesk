import { Bell, Gamepad2, Dice5, Users, RefreshCw, X, ArrowUpRight, ArrowRight, Link2, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ManagedLayer } from "./ManagedLayer";
import {
  fetchSlowNotices,
  readSlowNotice,
  slowNoticeURL,
  toolboxOrigin,
  type SlowNotice,
} from "../lib/slowMessages";
import "./slowMessages.css";

export function SlowMessages({ userKey }: { userKey: string | null }) {
  return (
    <>
      <RelaxLauncher />
      {userKey && <AccountMessages key={userKey} />}
    </>
  );
}
const quickGames = [
  ["2048", "2048"], ["mines", "扫雷"], ["sudoku", "数独"], ["gomoku", "五子棋"],
  ["math24", "算24点"], ["connect-four", "四子连线"], ["aim3d", "3D目标训练"], ["cube-rotation", "空间旋转"],
] as const;
function RelaxLauncher() {
  const id = useId(), menu = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false), [random, setRandom] = useState<string>("2048");
  useEffect(() => {
    if (!open) return;
    const position = () => {
      const rect = trigger.current?.getBoundingClientRect(), panel = menu.current;
      if (!rect || !panel) return;
      const right = Math.max(12, Math.min(window.innerWidth - Math.min(340, window.innerWidth - 24) - 12, window.innerWidth - rect.right));
      panel.style.setProperty('--launcher-top', `${rect.bottom + 8}px`);
      panel.style.setProperty('--launcher-right', `${right}px`);
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className="icon-button desk-relax-entry" aria-label="打开小游戏入口" aria-haspopup="dialog" aria-controls={id} aria-expanded={open} popoverTarget={id} onClick={() => setRandom(quickGames[crypto.getRandomValues(new Uint32Array(1))[0] % quickGames.length][0])}>
      <Gamepad2 size={18} aria-hidden="true" /><span>小游戏</span>
    </button>
    <div id={id} ref={menu} popover="auto" role="dialog" aria-labelledby={`${id}-title`} className="desk-relax-launcher" onToggle={e => setOpen((e.nativeEvent as ToggleEvent).newState === 'open')}>
      <header><h2 id={`${id}-title`}>歇一会儿</h2><button type="button" className="icon-button" aria-label="关闭小游戏入口" onClick={() => menu.current?.hidePopover()}><X size={17} /></button></header>
      <a className="desk-random-relax" href={`${toolboxOrigin}/relax/${random}`} target="_blank" rel="noreferrer"><Dice5 size={19} /><span>随便玩一个</span><ArrowUpRight size={16} /></a>
      <nav className="desk-relax-quick" aria-label="常用小游戏">{quickGames.slice(0, 6).map(([slug, name]) => <a key={slug} href={`${toolboxOrigin}/relax/${slug}`} target="_blank" rel="noreferrer">{name}<ArrowUpRight size={12} /></a>)}</nav>
      <nav className="desk-relax-social" aria-label="和朋友一起">
        <a href={`${toolboxOrigin}/relax/slow`} target="_blank" rel="noreferrer"><Users size={18} /><span>好友慢互动<small>轮流继续，账号可接收提醒</small></span><ArrowUpRight size={14} /></a>
        <a href={`${toolboxOrigin}/relax/live`} target="_blank" rel="noreferrer"><Link2 size={18} /><span>实时五子棋<small>双方同时在线</small></span><ArrowUpRight size={14} /></a>
      </nav>
      <footer><a href={`${toolboxOrigin}/relax`} target="_blank" rel="noreferrer">全部小游戏<ArrowRight size={15} /></a></footer>
    </div>
  </>;
}

function AccountMessages() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SlowNotice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState("");
  const generation = useRef(0);
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  async function refresh() {
    const g = ++generation.current;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setLoading(true);
    try {
      const next = await fetchSlowNotices(controller.signal);
      if (mounted.current && g === generation.current) {
        setItems(next);
        setError("");
      }
    } catch (cause) {
      if (mounted.current && g === generation.current)
        setError(
          cause instanceof Error && cause.name !== "AbortError"
            ? cause.message
            : "连接超时，请重试",
        );
    } finally {
      clearTimeout(timeout);
      if (mounted.current && g === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const visible = () => {
      if (!document.hidden) void refresh();
    };
    const timer = window.setInterval(visible, 60000);
    document.addEventListener("visibilitychange", visible);
    return () => {
      mounted.current = false;
      ++generation.current;
      active.current?.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  async function markRead(notice: SlowNotice) {
    if (notice.kind === "friend") return;
    setReading(notice.id);
    try {
      await readSlowNotice(notice, AbortSignal.timeout(15000));
      if (mounted.current) {
        setItems((current) =>
          current.filter(
            (n) => n.id !== notice.id || n.version > notice.version,
          ),
        );
        setError("");
      }
    } catch (cause) {
      if (mounted.current)
        setError(cause instanceof Error ? cause.message : "标记失败，请重试");
    } finally {
      if (mounted.current) setReading("");
    }
  }
  return (
    <>
      <button
        className="icon-button desk-slow-bell"
        type="button"
        aria-label={`慢互动消息${items.length ? `，${items.length} 条未读` : ""}`}
        title="慢互动消息"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          void refresh();
        }}
      >
        <Bell aria-hidden="true" />
        {items.length > 0 && (
          <span>{items.length > 9 ? "9+" : items.length}</span>
        )}
      </button>
      {open && (
        <ManagedLayer className="modal-layer" onEscape={() => setOpen(false)}>
          <button
            className="modal-backdrop"
            type="button"
            aria-label="关闭慢互动消息"
            onClick={() => setOpen(false)}
          />
          <section
            className="shortcut-modal desk-slow-messages"
            role="dialog"
            aria-modal="true"
            aria-labelledby="slowMessagesTitle"
          >
            <div className="modal-heading">
              <div>
                <span className="modal-icon">
                  <Bell aria-hidden="true" />
                </span>
                <div>
                  <h2 id="slowMessagesTitle">慢互动消息</h2>
                  <p>有空再来，不必秒回</p>
                </div>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                <X />
              </button>
            </div>
            <div className="desk-slow-toolbar">
              <a
                href={`${toolboxOrigin}/relax/slow?view=rooms`}
                target="_blank"
                rel="noreferrer"
              >
                我的慢互动 <ArrowUpRight size={15} />
              </a>
              <button
                className="text-button"
                type="button"
                disabled={loading}
                onClick={() => void refresh()}
              >
                <RefreshCw size={16} />
                {loading ? "读取中" : "刷新"}
              </button>
            </div>
            {error && (
              <p className="desk-slow-error" role="status">
                {error}
              </p>
            )}
            <div className="desk-slow-list">
              {items.map((n) => (
                <div className="desk-slow-row" key={n.id}>
                  <a
                    href={slowNoticeURL(n)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => void markRead(n)}
                  >
                    <span>
                      {n.kind === "friend"
                        ? "好友申请"
                        : n.kind === "invite"
                          ? "邀请你加入"
                          : n.kind === "turn"
                            ? "轮到你了"
                            : "内容有更新"}
                    </span>
                    <strong>{n.title}</strong>
                    <small>
                      {new Date(n.updatedAt).toLocaleString("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </a>
                  {n.kind !== "friend" && (
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`标记已读：${n.title}`}
                      disabled={reading === n.id}
                      onClick={() => void markRead(n)}
                    >
                      <Check size={17} />
                    </button>
                  )}
                </div>
              ))}
              {!items.length && !loading && !error && (
                <p className="desk-slow-empty">
                  暂时没有新消息。去和朋友慢慢落子吧。
                </p>
              )}
            </div>
          </section>
        </ManagedLayer>
      )}
    </>
  );
}
