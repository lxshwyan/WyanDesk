import { describe, expect, it } from 'vitest';
import { clampFloatingRect, initialFloatingRect, resizeFloatingRect } from './floatingWindow';
describe('floating widget geometry', () => {
  it('opens a usable phone window with visible edges and controls', () => {
    expect(initialFloatingRect({ width: 390, height: 844 }, 'notes')).toEqual({ left: 16, top: 80, width: 358, height: 380 });
  });
  it('keeps an oversized window within the viewport after a resize', () => {
    expect(clampFloatingRect({ left: 900, top: 500, width: 800, height: 700 }, { width: 390, height: 600 })).toEqual({ left: 8, top: 8, width: 374, height: 584 });
  });
  it('resizes from its current origin without pushing its edges offscreen', () => {
    expect(resizeFloatingRect({ left: 140, top: 180, width: 400, height: 300 }, 900, 900, { width: 1000, height: 800 })).toEqual({ left: 140, top: 180, width: 852, height: 612 });
  });
  it('protects tool controls when shrinking and still fits short viewports', () => {
    const rect = { left: 16, top: 80, width: 358, height: 300 };
    expect(resizeFloatingRect(rect, 0, -500, { width: 390, height: 844 }, 'focus').height).toBe(440);
    expect(resizeFloatingRect(rect, 0, -500, { width: 390, height: 200 }, 'converter').height).toBe(184);
  });
  it('retains usable minimum size and clamps negative positions', () => {
    expect(clampFloatingRect({ left: -100, top: -90, width: 10, height: 10 }, { width: 1440, height: 900 })).toEqual({ left: 8, top: 8, width: 280, height: 180 });
  });
});
