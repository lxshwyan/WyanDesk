import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(projectRoot, 'dist');
const [index, robots, sitemap] = await Promise.all([
  readFile(join(distDir, 'index.html'), 'utf8'),
  readFile(join(distDir, 'robots.txt'), 'utf8'),
  readFile(join(distDir, 'sitemap.xml'), 'utf8'),
]);

const expectedTitle = 'WyanDesk｜本地优先的浏览器桌面与效率工作台';
const requiredIndexFragments = [
  `<title>${expectedTitle}</title>`,
  '<link rel="canonical" href="https://desk.wyanhub.com/"',
  '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"',
  '<script type="application/ld+json">',
  'class="seo-fallback"',
  '本地优先的浏览器桌面',
];
for (const fragment of requiredIndexFragments) {
  if (!index.includes(fragment)) throw new Error(`Built index is missing SEO content: ${fragment}`);
}

const javascriptBootstrap = index.match(/classList\.add\((["'])js\1\)/);
const fallbackMarkupIndex = index.indexOf('class="seo-fallback"');
if (!javascriptBootstrap || javascriptBootstrap.index === undefined || javascriptBootstrap.index > fallbackMarkupIndex) {
  throw new Error('The JavaScript first-paint guard must run before the static SEO fallback is parsed.');
}
if (!index.includes('seo-fallback-timeout')) {
  throw new Error('The static SEO fallback must recover when the application bundle does not take over.');
}
if (!/html\.js:not\(\.seo-fallback-timeout\)\s*\.seo-fallback\s*\{[^}]*display:\s*none/.test(index)) {
  throw new Error('JavaScript clients must hide the static SEO fallback before first paint.');
}

const structuredDataMatch = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!structuredDataMatch) throw new Error('Built index is missing structured data.');
const structuredData = JSON.parse(structuredDataMatch[1]);
if (structuredData['@type'] !== 'WebApplication' || structuredData.name !== 'WyanDesk') {
  throw new Error('Structured data must describe the WyanDesk web application.');
}

if (!robots.includes('User-agent: *') || !robots.includes('Allow: /')) {
  throw new Error('robots.txt must allow crawling of the public site.');
}
if (!robots.includes('Disallow: /api/')) throw new Error('robots.txt must exclude API routes.');
if (!robots.includes('Sitemap: https://desk.wyanhub.com/sitemap.xml')) {
  throw new Error('robots.txt must reference the canonical sitemap.');
}
if (robots.includes('<!doctype html>')) throw new Error('robots.txt must not contain the SPA document.');

if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  throw new Error('sitemap.xml must be an XML document.');
}
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locations.length !== 1 || locations[0] !== 'https://desk.wyanhub.com/') {
  throw new Error('sitemap.xml must contain only the canonical public homepage.');
}
if (sitemap.includes('<!doctype html>')) throw new Error('sitemap.xml must not contain the SPA document.');

process.stdout.write('Validated WyanDesk metadata, crawl files and no-flash static product fallback.\n');
