import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const bootstrap = index.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const scenes = ['dawn', 'ocean', 'night', 'cyber', 'forest', 'sunset', 'iris', 'sand'];

function start(raw, storageThrows = false) {
  const properties = new Map();
  const root = {
    dataset: {},
    classList: { add: vi.fn() },
    style: {
      setProperty: (name, value) => properties.set(name, value),
      removeProperty: (name) => properties.delete(name),
    },
  };
  const storage = {
    getItem: vi.fn(() => { if (storageThrows) throw new Error('Storage unavailable'); return raw; }),
    setItem: vi.fn(),
  };
  const window = {
    localStorage: storage,
    setTimeout: vi.fn(),
    WyanDeskStartup: undefined,
  };
  runInNewContext(bootstrap, { URL, window, document: { baseURI: 'https://desk.wyanhub.com/', documentElement: root } });
  return { root, properties, window, storage };
}

describe('appearance before the React bundle runs', () => {
  it.each(scenes)('starts directly in saved %s appearance', (scene) => {
    const { root, storage } = start(JSON.stringify({ preferences: { scene } }));
    expect(root.dataset.deskScene).toBe(scene);
    expect(index).toContain(`html[data-desk-scene="${scene}"]`);
    expect(index).toContain(`--scene-${scene}-background:`);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('can paint a saved custom background without waiting for React', () => {
    const image = 'data:image/png;base64,c2FtcGxl';
    const { properties, window, root } = start(JSON.stringify({ preferences: { scene: 'night', customBackground: image } }));
    expect(properties.get('--desk-startup-image')).toBe(`url(${JSON.stringify(image)})`);
    window.WyanDeskStartup.applyAppearance({ scene: 'forest', customBackground: '' });
    expect(root.dataset.deskScene).toBe('forest');
    expect(properties.has('--desk-startup-image')).toBe(false);
  });

  it.each([[null, 'night'], ['{broken', 'night'], ['{}', 'ocean'], ['{"version":9,"workspaces":[]}', 'ocean'], ['{"preferences":null}', 'ocean'], ['{"preferences":"legacy"}', 'ocean'], ['{"preferences":{"scene":"unknown"}}', 'ocean']])('keeps the desktop available with missing or invalid preferences: %s', (raw, scene) => {
    const { root, window } = start(raw);
    expect(root.dataset.deskScene).toBe(scene);
    expect(root.classList.add).toHaveBeenCalledWith('js');
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it('does not block the fallback when browser storage is denied', () => {
    const { root, storage } = start(null, true);
    expect(root.dataset.deskScene).toBe('night');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
