import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./popup.css', import.meta.url), 'utf8');
function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]+)\\}`));
  expect(block, `Missing popup rule: ${selector}`).not.toBeNull();
  return block[1];
}

describe('action popup intrinsic sizing', () => {
  it('sets document and body width independently of the initial viewport', () => {
    for (const selector of ['html', 'body']) {
      expect(rule(selector)).toMatch(/(?:^|;)\s*width:\s*420px\s*;/);
      expect(rule(selector)).toMatch(/min-width:\s*420px\s*;/);
      expect(rule(selector)).not.toMatch(/\b(?:vw|dvw|svw)\b/);
    }
    expect(rule('body')).not.toMatch(/max-width/);
  });
  it('limits the scrolling surface to the Chrome popup height without horizontal scrolling', () => {
    expect(rule('body')).toMatch(/max-height:\s*600px\s*;/);
    expect(rule('body')).toMatch(/overflow-y:\s*auto\s*;/);
    expect(rule('body')).toMatch(/overflow-x:\s*hidden\s*;/);
    expect(rule('body')).toMatch(/scrollbar-gutter:\s*stable\s*;/);
  });
  it('keeps the brand mark, title, and desktop link from collapsing into multiple lines', () => {
    expect(rule('header .mark')).toMatch(/flex:\s*0 0 36px\s*;/);
    expect(rule('header a')).toMatch(/flex:\s*0 0 auto\s*;/);
    for (const selector of ['header strong', 'header a']) expect(rule(selector)).toMatch(/white-space:\s*nowrap\s*;/);
  });
});
