import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'extension-dist');
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'background.js',
  'capture-core.js',
  'session-core.js',
  'app/index.html',
  'app/extension-bootstrap.js',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

for (const file of requiredFiles) await stat(join(output, file));

async function assertCleanPackage(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await assertCleanPackage(path);
      continue;
    }
    if (entry.name === '.DS_Store' || entry.name === 'Thumbs.db' || entry.name.endsWith('.map')) {
      throw new Error(`Extension package includes development-only file: ${path.slice(output.length + 1)}`);
    }
  }
}

await assertCleanPackage(output);

const manifest = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
const packageMetadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const exactSet = (actual, expected) => Array.isArray(actual)
  && actual.length === expected.length
  && expected.every((value) => actual.includes(value));

if (manifest.manifest_version !== 3) throw new Error('Extension must use Manifest V3.');
if (manifest.version !== packageMetadata.version) throw new Error('Extension version must match package.json.');
if (!exactSet(manifest.permissions, ['activeTab', 'storage', 'identity', 'contextMenus'])) throw new Error('Required permissions exceed the reviewed allowlist.');
if (manifest.background?.service_worker !== 'background.js' || manifest.background?.type !== 'module') throw new Error('Expected the packaged module service worker.');
if (!exactSet(manifest.optional_permissions, ['tabs', 'bookmarks'])) throw new Error('Optional permissions exceed the reviewed allowlist.');
if (!exactSet(manifest.host_permissions, ['https://wyanhub.com/*', 'https://desk.wyanhub.com/*'])) throw new Error('Host permissions exceed the reviewed allowlist.');
if (manifest.content_scripts?.length) throw new Error('Content scripts are not allowed.');

for (const file of ['popup.html', 'app/index.html']) {
  const html = await readFile(join(output, file), 'utf8');
  if (/<script\b[^>]*\bsrc=["']https?:\/\//i.test(html)) throw new Error(`${file} loads a remote script.`);
  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(html)) throw new Error(`${file} includes an inline script blocked by Manifest V3 CSP.`);
}

process.stdout.write(`Validated WyanDesk extension ${manifest.version}: Manifest V3, least-privilege permissions, no remote scripts.\n`);
