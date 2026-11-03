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

const expectedTitle = '微言桌面 WyanDesk｜浏览器桌面、书签导航与新标签页';
const requiredIndexFragments = [
  '<html lang="zh-CN">',
  `<title>${expectedTitle}</title>`,
  `<meta property="og:title" content="${expectedTitle}"`,
  `<meta name="twitter:title" content="${expectedTitle}"`,
  '<meta property="og:url" content="https://desk.wyanhub.com/"',
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
if (structuredData['@type'] !== 'WebApplication' || structuredData.name !== '微言桌面 WyanDesk') {
  throw new Error('Structured data must describe the WyanDesk web application.');
}
if (structuredData.url !== 'https://desk.wyanhub.com/') {
  throw new Error('Structured data must use the canonical public homepage URL.');
}
if (!Array.isArray(structuredData.alternateName) || !['微言桌面', 'WyanDesk'].every((name) => structuredData.alternateName.includes(name))) {
  throw new Error('Structured data must retain both the Chinese and English product names.');
}
for (const attribute of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
  if (!index.includes(`<meta ${attribute} content="${structuredData.description}"`)) {
    throw new Error(`The ${attribute} summary must match the structured product description.`);
  }
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
if (locations.length !== 2 || locations[0] !== 'https://desk.wyanhub.com/' || locations[1] !== 'https://desk.wyanhub.com/about.html') {
  throw new Error('sitemap.xml must contain the canonical homepage and product introduction.');
}
const modificationDates = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
const modificationDate = modificationDates[0] ?? '';
const modificationTimestamp = Date.parse(modificationDate);
if (modificationDates.length !== 2 || !/^\d{4}-\d{2}-\d{2}$/.test(modificationDate)
  || !Number.isFinite(modificationTimestamp) || new Date(modificationTimestamp).toISOString().slice(0, 10) !== modificationDate) {
  throw new Error('sitemap.xml must include the homepage actual modification date in YYYY-MM-DD format.');
}
if (sitemap.includes('<!doctype html>')) throw new Error('sitemap.xml must not contain the SPA document.');

const widgetNames = ['月历', '工作便签', '专注计时', '快速计算', '单位换算', '天气', '今日任务', '今日日程', '下一提醒', '今日概览', '倒数日', '世界时钟', '剪贴板', '快捷操作'];
if (!widgetNames.every((name) => structuredData.featureList?.includes(name))) {
  throw new Error('Structured product features must include the shipped desktop widgets.');
}
if (!index.includes('搜索“日历”“便签”“计算器”')) throw new Error('Static product copy must describe component search.');

const about = await readFile(join(distDir, 'about.html'), 'utf8');
for (const fragment of ['<link rel="canonical" href="https://desk.wyanhub.com/about.html">', '<h1 id="about-title">', 'https://tools.wyanhub.com/tools/design/whiteboard', 'src="./about.js"', '搜索，即可打开组件', '专注与休息，有序交替', '换张喜欢的壁纸', '可拖动、缩放的浮窗', ...widgetNames]) {
  if (!about.includes(fragment)) throw new Error(`Product introduction is missing: ${fragment}`);
}
process.stdout.write('Validated WyanDesk metadata, product introduction, crawl files and no-flash static fallback.\n');
