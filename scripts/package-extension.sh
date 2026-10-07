#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(dirname "$script_dir")
mkdir -p "$project_dir/public/downloads"
cd "$project_dir/extension-dist"
zip -FS -qr "$project_dir/public/downloads/wyandesk-extension.zip" .
mkdir -p "$project_dir/dist/downloads"
cp "$project_dir/public/downloads/wyandesk-extension.zip" "$project_dir/dist/downloads/wyandesk-extension.zip"
