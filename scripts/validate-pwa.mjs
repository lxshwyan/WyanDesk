import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(projectRoot, 'dist');
const manifest = JSON.parse(await readFile(join(distDir, 'manifest.webmanifest'), 'utf8'));
const worker = await readFile(join(distDir, 'sw.js'), 'utf8');
const index = await readFile(join(distDir, 'index.html'), 'utf8');

for (const field of ['name', 'short_name', 'start_url', 'scope', 'display', 'icons']) {
  if (!manifest[field]) throw new Error(`PWA manifest field is missing: ${field}`);
}
if (!['standalone', 'minimal-ui', 'fullscreen'].includes(manifest.display)) throw new Error('PWA display mode is not installable.');
if (manifest.prefer_related_applications === true) throw new Error('PWA manifest must prefer the web app.');
for (const size of ['192x192', '512x512']) {
  const icon = manifest.icons.find((candidate) => candidate.sizes === size && candidate.type === 'image/png');
  if (!icon) throw new Error(`PWA ${size} PNG icon is missing.`);
  await access(join(distDir, icon.src.replace(/^\//, '')));
}
if (!index.includes('rel="manifest"')) throw new Error('Built index does not link the web app manifest.');
if (worker.includes('__WYANDESK_BUILD_ASSETS__')) throw new Error('Built asset list was not injected into the service worker.');
if (/\/assets\/[^"']+\.map["']/.test(worker)) throw new Error('Source maps must not be included in the offline precache.');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return files.flat();
}

const builtAssets = (await walk(join(distDir, 'assets')))
  .filter((path) => !path.endsWith('.map'))
  .map((path) => `/${relative(distDir, path).replaceAll('\\', '/')}`);
for (const asset of builtAssets) {
  if (!worker.includes(JSON.stringify(asset))) throw new Error(`Built asset is missing from PWA precache: ${asset}`);
}

process.stdout.write(`Validated installable PWA shell with ${builtAssets.length} precached build assets.\n`);
