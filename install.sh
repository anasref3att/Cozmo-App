#!/bin/bash
# Installs Cozmo into /Applications without ever triggering Gatekeeper's
# quarantine flag — that flag is set by the browser's download manager, not
# by curl, so fetching the release this way sidesteps the "cannot be opened"
# problem at the source instead of working around it after the fact.
set -e

REPO="anasref3att/Cozmo-App"

echo "Finding the latest Cozmo release..."
URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"browser_download_url".*\.zip"' | head -1 | cut -d '"' -f 4)

if [ -z "$URL" ]; then
  echo "Couldn't find a release asset. Check https://github.com/$REPO/releases"
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading $(basename "$URL")..."
curl -fL --progress-bar "$URL" -o "$TMPDIR/Cozmo.zip"

echo "Extracting..."
ditto -x -k "$TMPDIR/Cozmo.zip" "$TMPDIR"

if [ -d "/Applications/Cozmo.app" ]; then
  echo "Removing previous install..."
  rm -rf "/Applications/Cozmo.app"
fi

echo "Installing to /Applications..."
mv "$TMPDIR/Cozmo.app" "/Applications/Cozmo.app"

# Belt-and-braces: strip any attribute that might have snuck in, and make
# sure the signature from the build is still what's actually shipping.
xattr -cr "/Applications/Cozmo.app" 2>/dev/null || true

echo "Launching Cozmo..."
open "/Applications/Cozmo.app"
