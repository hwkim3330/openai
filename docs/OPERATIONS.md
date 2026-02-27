# Operations

## Health checks
- CLI syntax check:
```bash
npm run check
```

- Smoke test:
```bash
npm run smoke
```

## Run now (daemon style)
```bash
npm run run:telegram:bg
npm run logs:telegram
npm run stop:telegram:bg
```

PID file:
- `/tmp/openai-agent-telegram.pid`

Log file:
- `logs/telegram.log`

## AGI loop mode
Run foreground:
```bash
npm run agi
```

Run background:
```bash
npm run run:agi:bg
npm run logs:agi
npm run stop:agi:bg
```

AGI files:
- state: `logs/agi-state.json`
- log: `logs/agi.log`

Tune in `.env`:
- `AGI_GOALS`
- `AGI_INTERVAL_SEC`
- `AGI_MAX_MEMORY`
- `AGI_DRY_RUN`
- `AGI_ENABLE_SELF_IMPROVE`
- `AGI_IMPROVE_EVERY_CYCLES`
- `AGI_MIN_ACCEPT_SCORE`
- `AGI_ROLLBACK_DROP`
- `AGI_TRIAL_COMMAND`

Self-improve behavior:
- every `AGI_IMPROVE_EVERY_CYCLES`, the loop generates a compact proposal
- candidate changes are trial-run with `AGI_TRIAL_COMMAND`
- if trial score is below threshold, automatic rollback is applied

## Common failures
- Telegram no response:
  - check token
  - check allowlist user id
  - check prefix rule
  - ensure only one process is polling (lock file)
  - ensure daemon process exists (`cat /tmp/openai-agent-telegram.pid`)
- Browser errors:
  - rerun `npx playwright install chromium`
- Free API temporary failure:
  - retry after 1-2 minutes

## Upgrade
```bash
git pull
npm install
npm run check
```
