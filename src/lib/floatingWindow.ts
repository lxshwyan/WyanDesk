export interface FloatingRect { left: number; top: number; width: number; height: number; }
export interface FloatingViewport { width: number; height: number; }
export function clampFloatingRect(rect: FloatingRect, viewport: FloatingViewport, widget = ''): FloatingRect {
  const width = Math.max(Math.min(280, viewport.width - 16), Math.min(rect.width, viewport.width - 16));
  const minimumHeight = widget === 'focus' ? viewport.width <= 620 ? 440 : 300 : widget === 'converter' ? 280 : 180;
  const height = Math.max(Math.min(minimumHeight, viewport.height - 16), Math.min(rect.height, viewport.height - 16));
  return { width, height, left: Math.max(8, Math.min(rect.left, viewport.width - width - 8)), top: Math.max(8, Math.min(rect.top, viewport.height - height - 8)) };
}
export function initialFloatingRect(viewport: FloatingViewport, widget: string): FloatingRect {
  const phone = viewport.width <= 620;
  return clampFloatingRect({ left: phone ? 16 : 40, top: phone ? 80 : 96, width: phone ? viewport.width - 32 : Math.min(520, viewport.width - 80), height: widget === 'notes' ? 380 : widget === 'calendar' ? 420 : 300 }, viewport, widget);
}
export function resizeFloatingRect(rect: FloatingRect, dx: number, dy: number, viewport: FloatingViewport, widget = ''): FloatingRect {
  return clampFloatingRect({ ...rect, width: Math.min(rect.width + dx, viewport.width - rect.left - 8), height: Math.min(rect.height + dy, viewport.height - rect.top - 8) }, viewport, widget);
}
