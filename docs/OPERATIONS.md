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
