import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface LayerEntry {
  element: HTMLDivElement;
  token: symbol;
}

const layerStack: LayerEntry[] = [];
let rootReturnFocus: HTMLElement | null = null;
let scrollLockCount = 0;
let previousBodyOverflow = '';
let previousRootOverflow = '';

function visibleFocusableElements(layer: HTMLElement): HTMLElement[] {
  const dialog = layer.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]') || layer;
  return [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => {
    if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  });
}

function focusLayerStart(layer: HTMLElement): void {
  const dialog = layer.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]') || layer;
  const preferred = dialog.querySelector<HTMLElement>('[autofocus]');
  const target = preferred && visibleFocusableElements(dialog).includes(preferred)
    ? preferred
    : visibleFocusableElements(dialog)[0];
  if (target) {
    target.focus({ preventScroll: true });
    return;
  }
  if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  dialog.focus({ preventScroll: true });
}

function lockPageScroll(): void {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockPageScroll(): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount > 0) return;
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousRootOverflow;
}

interface ManagedLayerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
  onEscape: () => void;
}

export function ManagedLayer({ children, onEscape, role = 'presentation', ...props }: ManagedLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const onEscapeRef = useRef(onEscape);
  const tokenRef = useRef(Symbol('managed-layer'));
  const returnFocusRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  onEscapeRef.current = onEscape;

  useEffect(() => {
    const element = layerRef.current;
    if (!element) return undefined;

    const entry = { element, token: tokenRef.current };
    if (layerStack.length === 0 && (!rootReturnFocus || !rootReturnFocus.isConnected)) {
      rootReturnFocus = returnFocusRef.current;
    }
    layerStack.push(entry);
    lockPageScroll();

    const focusFrame = window.requestAnimationFrame(() => {
      if (!element.contains(document.activeElement)) focusLayerStart(element);
    });

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (layerStack.at(-1)?.token !== entry.token) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onEscapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = visibleFocusableElements(element);
      if (!focusable.length) {
        event.preventDefault();
        focusLayerStart(element);
        return;
      }

      const active = document.activeElement;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!element.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown, true);
      const index = layerStack.findIndex((item) => item.token === entry.token);
      if (index >= 0) layerStack.splice(index, 1);
      unlockPageScroll();

      window.requestAnimationFrame(() => {
        const top = layerStack.at(-1);
        if (top) {
          const target = returnFocusRef.current;
          if (target?.isConnected && top.element.contains(target)) target.focus({ preventScroll: true });
          else if (!top.element.contains(document.activeElement)) focusLayerStart(top.element);
          return;
        }

        const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : rootReturnFocus;
        if (target?.isConnected) target.focus({ preventScroll: true });
        rootReturnFocus = null;
      });
    };
  }, []);

  return <div ref={layerRef} role={role} data-managed-layer="true" {...props}>{children}</div>;
}
