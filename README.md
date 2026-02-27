# OpenAI Free Assistant

무료/무키 API 기반 개인 비서 런타임.
Node.js + Playwright + Telegram로 구성되며, GitHub Pages 정적 비서 UI도 포함.

## What you get
- CLI assistant
- Telegram assistant (allowlist/prefix/lock security)
- Browser automation command (`browse:`)
- Free no-key tools:
  - `weather:` (Open-Meteo)
  - `traffic:` (OSM Nominatim + OSRM)
  - `stock:` (Stooq daily quotes)
- GitHub Pages web assistant (`docs/index.html`)

## One-click run

### Linux/macOS
```bash
bash scripts/oneclick.sh
```

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\oneclick.ps1
```

Telegram one-click:
- Linux/macOS: `bash scripts/oneclick.sh telegram`
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\oneclick.ps1 telegram`

## Basic commands
- `help`
- `weather: Seoul`
- `traffic: Seoul Station -> Incheon Airport`
- `stock: aapl.us,msft.us`
- `browse: https://pollinations.ai`

## Checks
```bash
npm run check
npm run smoke
```

## Docs
- [Documentation Index](docs/README.md)
- [Quickstart](docs/QUICKSTART.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Commands](docs/COMMANDS.md)
- [Operations](docs/OPERATIONS.md)
- [GitHub Pages](docs/PAGES.md)

## GitHub Pages
- Site source: `docs/index.html`
- Auto deploy workflow: `.github/workflows/pages.yml`
- Target URL: `https://hwkim3330.github.io/openai/`

## Security note
For production Telegram use, set at least:
```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USER_IDS=8341524797
TELEGRAM_COMMAND_PREFIX=!
```
