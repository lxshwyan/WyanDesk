import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(projectRoot, 'dist');
const assetsDir = join(distDir, 'assets');
const workerPath = join(distDir, 'sw.js');
const marker = '/* __WYANDESK_BUILD_ASSETS__ */ []';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return files.flat();
}

const assets = (await walk(assetsDir))
  .filter((path) => !path.endsWith('.map'))
  .map((path) => `/${relative(distDir, path).replaceAll('\\', '/')}`)
  .sort();
const source = await readFile(workerPath, 'utf8');

if (!source.includes(marker)) throw new Error('PWA asset marker is missing from dist/sw.js.');
await writeFile(workerPath, source.replace(marker, JSON.stringify(assets)), 'utf8');
process.stdout.write(`Injected ${assets.length} built assets into the PWA precache.\n`);
