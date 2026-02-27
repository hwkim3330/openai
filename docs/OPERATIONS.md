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

## Common failures
- Telegram no response:
  - check token
  - check allowlist user id
  - check prefix rule
  - ensure only one process is polling (lock file)
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
