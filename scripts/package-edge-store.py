#!/usr/bin/env python3
"""Add Edge listing metadata to a verified release ZIP without rebuilding app code."""

import argparse
import copy
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile


ROOT = Path(__file__).resolve().parent.parent


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=ROOT / 'public/downloads/wyandesk-extension.zip')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'edge-store-dist')
    parser.add_argument('--revision', type=int, default=1)
    args = parser.parse_args()
    if not 1 <= args.revision <= 65535:
        parser.error('revision must be between 1 and 65535')

    source = args.input.read_bytes()
    expected_hash = Path(str(args.input) + '.sha256').read_text().split()[0]
    if digest(source) != expected_hash:
        raise SystemExit('Release ZIP does not match its checksum')
    app_version = json.loads((ROOT / 'package.json').read_text())['version']
    if not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', app_version):
        raise SystemExit('Expected a three-part application version')
    version = f'{app_version}.{args.revision}'
    if any(int(part) > 65535 for part in version.split('.')):
        raise SystemExit('Extension version component exceeds 65535')

    with zipfile.ZipFile(io.BytesIO(source)) as archive:
        if archive.testzip():
            raise SystemExit('Release ZIP failed its CRC check')
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise SystemExit('Release ZIP contains duplicate paths')
        original = {name: archive.read(name) for name in names}
        manifest = json.loads(original['manifest.json'])
        if manifest['version'] != app_version or manifest['manifest_version'] != 3:
            raise SystemExit('Release ZIP must match the current MV3 application release')
        if manifest.get('default_locale') or any(name.startswith('_locales/') for name in names):
            raise SystemExit('Release ZIP is already localized; review the store adapter')

        messages = {
            'extensionName': {'message': manifest['name']},
            'extensionDescription': {'message': manifest['description']},
        }
        store_manifest = dict(manifest, version=version, default_locale='zh_CN',
                              name='__MSG_extensionName__', description='__MSG_extensionDescription__')
        locale_path = '_locales/zh_CN/messages.json'
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as output:
            for info in archive.infolist():
                data = original[info.filename]
                if info.filename == 'manifest.json':
                    data = (json.dumps(store_manifest, ensure_ascii=False, indent=2) + '\n').encode()
                output.writestr(copy.copy(info), data)
            info = zipfile.ZipInfo(locale_path, archive.getinfo('manifest.json').date_time)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            output.writestr(info, (json.dumps(messages, ensure_ascii=False, indent=2) + '\n').encode())

    result = buffer.getvalue()
    with zipfile.ZipFile(io.BytesIO(result)) as output:
        if output.testzip() or set(output.namelist()) != set(names) | {locale_path}:
            raise SystemExit('Store ZIP failed validation')
        unchanged = [name for name in names if name != 'manifest.json']
        if any(output.read(name) != original[name] for name in unchanged):
            raise SystemExit('Store adapter changed an application or extension runtime file')
        localized = json.loads(output.read(locale_path))
        if localized['extensionName']['message'] != manifest['name']:
            raise SystemExit('Localized name differs from the release name')
    if args.input.read_bytes() != source:
        raise SystemExit('Source release changed during packaging')

    args.output_dir.mkdir(parents=True, exist_ok=True)
    target = args.output_dir / f'wyandesk-edge-{version}.zip'
    if target.resolve() == args.input.resolve():
        raise SystemExit('Store output must not overwrite the official release ZIP')
    if target.exists() and target.read_bytes() != result:
        raise SystemExit('Immutable store version already exists with different bytes; use a new revision')
    target.write_bytes(result)
    Path(str(target) + '.sha256').write_text(f'{digest(result)}  {target.name}\n')
    report = {'application_version': app_version, 'extension_version': version,
              'source_sha256': digest(source), 'store_sha256': digest(result),
              'store_bytes': len(result),
              'runtime_files_unchanged': sum(not name.endswith('/') for name in unchanged),
              'runtime_entries_unchanged': len(unchanged),
              'changed_files': ['manifest.json'], 'added_files': [locale_path]}
    target.with_suffix('.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
