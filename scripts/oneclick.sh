#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "node is required (>=18)" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required" >&2
  exit 1
fi

npm install
npm run setup:env

echo
if [ "${1:-}" = "telegram" ]; then
  echo "Starting Telegram mode..."
  npm run telegram
else
  echo "Starting CLI mode..."
  npm start
fi
