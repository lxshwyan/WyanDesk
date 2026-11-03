import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export function IconWidgetRail({ children, onConfigure, count, dragging }: { children: ReactNode; onConfigure: () => void; count: number; dragging: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => setEdges({ left: element.scrollLeft > 2, right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
    function wheel(event: WheelEvent) {
      if (!element || event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > 0 || !event.deltaY) return;
      let target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, select, textarea')) return;
      while (target && target !== element) {
        const style = getComputedStyle(target);
        if (/(auto|scroll)/.test(style.overflowY) && target.scrollHeight > target.clientHeight + 1
          && (event.deltaY < 0 ? target.scrollTop > 0 : target.scrollTop + target.clientHeight < target.scrollHeight - 1)) return;
        target = target.parentElement;
      }
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      const next = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, element.scrollLeft + delta));
      if (Math.abs(next - element.scrollLeft) < 1) return;
      event.preventDefault();
      element.scrollLeft = next;
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    element.addEventListener('wheel', wheel, { passive: false });
    update();
    return () => { observer.disconnect(); element.removeEventListener('scroll', update); element.removeEventListener('wheel', wheel); };
  }, [count]);
  function scroll(direction: number) {
    const element = rail.current;
    if (!element) return;
    const width = element.firstElementChild?.getBoundingClientRect().width || element.clientWidth;
    element.scrollBy({ left: direction * (width + 14), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  return <aside className="icon-widget-region" aria-label="桌面组件">
    <div className="icon-widget-heading"><strong>桌面组件</strong><div>{(edges.left || edges.right) && <><button type="button" onClick={() => scroll(-1)} disabled={!edges.left} aria-label="向左滚动组件"><ChevronLeft aria-hidden="true" /></button><button type="button" onClick={() => scroll(1)} disabled={!edges.right} aria-label="向右滚动组件"><ChevronRight aria-hidden="true" /></button></>}<button type="button" onClick={onConfigure}><Plus aria-hidden="true" />选择组件</button></div></div>
    <div ref={rail} className={`today-rail${dragging ? ' is-widget-dragging' : ''}`} tabIndex={0} aria-label="桌面组件，可用滚轮或左右键浏览">{children}</div>
  </aside>;
}
