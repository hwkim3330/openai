#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="${LOG_FILE:-$(pwd)/logs/agi.log}"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"
tail -n 200 -f "$LOG_FILE"
