import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'extension-dist');
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'app/index.html',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

for (const file of requiredFiles) await stat(join(output, file));

const manifest = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
const packageMetadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const exactSet = (actual, expected) => Array.isArray(actual)
  && actual.length === expected.length
  && expected.every((value) => actual.includes(value));

if (manifest.manifest_version !== 3) throw new Error('Extension must use Manifest V3.');
if (manifest.version !== packageMetadata.version) throw new Error('Extension version must match package.json.');
if (!exactSet(manifest.permissions, ['activeTab', 'storage'])) throw new Error('Required permissions exceed the reviewed allowlist.');
if (!exactSet(manifest.optional_permissions, ['tabs', 'bookmarks'])) throw new Error('Optional permissions exceed the reviewed allowlist.');
if (manifest.host_permissions?.length) throw new Error('Host permissions are not allowed.');
if (manifest.content_scripts?.length) throw new Error('Content scripts are not allowed.');

for (const file of ['popup.html', 'app/index.html']) {
  const html = await readFile(join(output, file), 'utf8');
  if (/<script\b[^>]*\bsrc=["']https?:\/\//i.test(html)) throw new Error(`${file} loads a remote script.`);
}

process.stdout.write(`Validated WyanDesk extension ${manifest.version}: Manifest V3, least-privilege permissions, no remote scripts.\n`);
