#!/usr/bin/env bash
set -euo pipefail

PID_FILE="${PID_FILE:-/tmp/openai-agent-telegram.pid}"

if [ ! -f "$PID_FILE" ]; then
  echo "no pid file"
  exit 0
fi

PID=$(cat "$PID_FILE" || true)
if [ -z "${PID:-}" ]; then
  rm -f "$PID_FILE"
  echo "empty pid file removed"
  exit 0
fi

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  sleep 1
  if kill -0 "$PID" 2>/dev/null; then
    kill -9 "$PID" || true
  fi
  echo "telegram stopped (pid=$PID)"
else
  echo "process not running (pid=$PID)"
fi

rm -f "$PID_FILE"
