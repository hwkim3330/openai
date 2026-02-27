#!/usr/bin/env bash
set -euo pipefail

PID_FILE="${PID_FILE:-/tmp/openai-agent-telegram.pid}"
LOG_FILE="${LOG_FILE:-$(pwd)/logs/telegram.log}"

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" || true)
  if [ -n "${OLD_PID:-}" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "telegram already running (pid=$OLD_PID)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

mkdir -p "$(dirname "$LOG_FILE")"
nohup node src/main.js --mode telegram >> "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

echo "telegram started (pid=$NEW_PID)"
echo "log: $LOG_FILE"
