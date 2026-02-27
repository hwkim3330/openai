# Quickstart

## 1) One-click run

### Linux/macOS
```bash
bash scripts/oneclick.sh
```

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\oneclick.ps1
```

## 2) Telegram mode

Set in `.env`:
```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USER_IDS=8341524797
TELEGRAM_COMMAND_PREFIX=!
```

Run:
```bash
npm run telegram
```

## 3) First commands
- `weather: Seoul`
- `traffic: Seoul Station -> Incheon Airport`
- `stock: AAPL,MSFT`
- `browse: https://pollinations.ai`
- `help`

## 4) AGI loop (optional)
```bash
npm run agi
```
