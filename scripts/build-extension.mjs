import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'extension-dist');

await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'icons'), { recursive: true });
await cp(join(root, 'dist'), join(output, 'app'), {
  recursive: true,
  filter: (source) => {
    const name = basename(source);
    return name !== '.DS_Store' && name !== 'Thumbs.db' && !name.endsWith('.map');
  },
});
await rm(join(output, 'app', 'downloads'), { recursive: true, force: true });
for (const file of ['manifest.json', 'popup.html', 'popup.css', 'popup.js', 'background.js', 'capture-core.js', 'session-core.js']) {
  await copyFile(join(root, 'extension', file), join(output, file));
}

const packageMetadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const extensionManifestPath = join(output, 'manifest.json');
const extensionManifest = JSON.parse(await readFile(extensionManifestPath, 'utf8'));
extensionManifest.version = packageMetadata.version;
await writeFile(extensionManifestPath, `${JSON.stringify(extensionManifest, null, 2)}\n`, 'utf8');

for (const size of [16, 32, 48, 128]) {
  await copyFile(join(root, 'extension', 'icons', `icon-${size}.png`), join(output, 'icons', `icon-${size}.png`));
}

const appIndexPath = join(output, 'app', 'index.html');
const appIndex = await readFile(appIndexPath, 'utf8');
const bootstrapScript = appIndex.match(/<script>\s*([\s\S]*?documentRoot\.classList\.add\('js'\);[\s\S]*?)<\/script>/);
if (!bootstrapScript) throw new Error('Unable to find the desktop bootstrap script for extension packaging.');
const structuredDataPattern = /\s*<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i;
if (!structuredDataPattern.test(appIndex)) throw new Error('Unable to find website-only structured data for extension packaging.');

const packagedAppIndex = appIndex
  .replace('<link rel="manifest" href="./manifest.webmanifest" />', '')
  .replace(bootstrapScript[0], '<script src="./extension-bootstrap.js"></script>')
  .replace(structuredDataPattern, '')
  .replace(/\s*<script\s+defer\s+src=["']\/wyan-monitor\.js["'][^>]*><\/script>/i, '');
await writeFile(join(output, 'app', 'extension-bootstrap.js'), `${bootstrapScript[1].trim()}\n`, 'utf8');
await writeFile(appIndexPath, packagedAppIndex, 'utf8');
