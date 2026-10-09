import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'extension-dist');

await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'icons'), { recursive: true });
await cp(join(root, 'dist'), join(output, 'app'), { recursive: true });
await rm(join(output, 'app', 'downloads'), { recursive: true, force: true });
for (const file of ['manifest.json', 'popup.html', 'popup.css', 'popup.js']) {
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
await writeFile(appIndexPath, appIndex.replace('<link rel="manifest" href="./manifest.webmanifest" />', ''), 'utf8');
