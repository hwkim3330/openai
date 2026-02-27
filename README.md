# OpenAI (Node.js Pollinations + Chrome Agent)

OpenClaw 스타일의 경량 구조(`channels/providers/runtime/adapters`)를 따르는 Node.js 에이전트.
기본은 무료/무키 API로 바로 동작한다.

## Core stack
- Node.js 18+
- Pollinations text API (no login, no API key)
- Playwright (Chromium)
- Telegram Bot API (optional)

## Free built-in tools
- `stock:` Yahoo Finance public quote endpoint (no-key)
- `weather:` Open-Meteo geocoding/forecast (no-key)
- `traffic:` OSM Nominatim + OSRM route ETA (no-key)
- `browse:` Playwright browser text extraction

## One-click start (recommended)

### Linux/macOS
```bash
git clone https://github.com/hwkim3330/openai.git
cd openai
bash scripts/oneclick.sh
```

### Windows (PowerShell)
```powershell
git clone https://github.com/hwkim3330/openai.git
cd openai
powershell -ExecutionPolicy Bypass -File .\scripts\oneclick.ps1
```

Telegram one-click:
- Linux/macOS: `bash scripts/oneclick.sh telegram`
- Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\oneclick.ps1 telegram`

## Manual quick start

### Linux/macOS
```bash
git clone https://github.com/hwkim3330/openai.git
cd openai
bash scripts/install.sh
cp .env.example .env
npm start
```

### Windows (PowerShell)
```powershell
git clone https://github.com/hwkim3330/openai.git
cd openai
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
copy .env.example .env
npm start
```

## CLI command examples
```text
stock: AAPL,MSFT,005930.KS
weather: Seoul
weather: 37.56,126.97
traffic: Seoul Station -> Incheon Airport
browse: https://pollinations.ai
```

## Telegram mode
1. Put bot token in `.env` (`TELEGRAM_BOT_TOKEN=...`)
2. Run:
```bash
npm run telegram
```

### Telegram hardening
- `TELEGRAM_ALLOWED_USER_IDS=123456789,987654321`
- `TELEGRAM_COMMAND_PREFIX=!`
- `TELEGRAM_LOCK_PATH=/tmp/openai-agent-telegram.lock`

Behavior:
- If allowlist is set, only listed users can execute commands.
- If prefix is set, only prefixed messages are handled.
- Lock file prevents duplicate long-polling workers on one token.

## Advanced config later
Initial run works with default free providers.  
For production/harder access control, edit `.env`:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_USER_IDS`
- `TELEGRAM_COMMAND_PREFIX`
- `TELEGRAM_LOCK_PATH`
- `BROWSER_HEADLESS`, `BROWSER_TIMEOUT_MS`
- `POLLINATIONS_*`

## API notes
- Stock endpoint uses Stooq daily quotes (free/no-key).
- Traffic output is route ETA estimate from OSRM, not full incident feed.
- All built-ins are zero-key defaults for easy first-run onboarding.
