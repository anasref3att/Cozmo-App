#!/bin/bash
# Builds separate x64 and arm64 apps instead of one universal binary — a
# universal build doubles Electron's own runtime inside the zip (~227MB vs
# ~115MB per arch), which is pure waste since any one download only ever
# runs on one architecture anyway.
set -e
cd "$(dirname "$0")/.."

rm -rf dist
npx electron-builder --mac --dir --x64 --arm64

for arch_dir in dist/mac dist/mac-arm64; do
  cp -R ../cozbra-dashboard/node_modules "$arch_dir/Cozmo.app/Contents/Resources/dashboard/node_modules"
  codesign --force --deep --sign - "$arch_dir/Cozmo.app"
done

echo "Built dist/mac (x64) and dist/mac-arm64 (arm64)."
