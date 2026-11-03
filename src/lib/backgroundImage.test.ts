import { describe, expect, it } from 'vitest';
import { backgroundImageValue } from './backgroundImage';

describe('wallpaper URLs consumed by built external CSS', () => {
  it.each([
    ['https://desk.wyanhub.com/', 'https://desk.wyanhub.com/wallpapers/alpine-lake.jpg'],
    ['https://example.test/desktop/index.html', 'https://example.test/desktop/wallpapers/alpine-lake.jpg'],
    ['chrome-extension://example-extension/index.html', 'chrome-extension://example-extension/wallpapers/alpine-lake.jpg'],
  ])('resolves against document %s before /assets CSS consumes it', (base, expected) => {
    expect(backgroundImageValue('wallpapers/alpine-lake.jpg', base)).toBe(`url(${JSON.stringify(expected)})`);
    expect(new URL(expected).pathname).not.toContain('/assets/');
  });
  it('preserves uploaded data images and safely quotes URL punctuation', () => {
    const data = 'data:image/png;base64,c2FtcGxl';
    expect(backgroundImageValue(data, 'https://desk.wyanhub.com/')).toBe(`url(${JSON.stringify(data)})`);
    expect(backgroundImageValue('https://images.test/a(1).jpg', 'https://desk.wyanhub.com/')).toBe('url("https://images.test/a(1).jpg")');
    expect(backgroundImageValue('', 'https://desk.wyanhub.com/')).toBe('none');
    expect(backgroundImageValue('http://[invalid', 'https://desk.wyanhub.com/')).toBe('none');
  });
});
