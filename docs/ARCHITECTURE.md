# Architecture

## Runtime layers
- `src/main.js`: entrypoint + mode select
- `src/runtime/engine.js`: command router
- `src/pollinations.js`: LLM provider client
- `src/chromeAdapter.js`: Playwright browser adapter
- `src/freeapis/*`: no-key tool APIs
- `src/channels/cli/runner.js`: local CLI channel
- `src/channels/telegram/bridge.js`: Telegram channel
- `src/agi/loop.js`: autonomous loop (goal/plan/execute/memory)

## Command routing
1. parse prefix command (`browse:`, `weather:`, `traffic:`, `stock:`)
2. call free API/adapter
3. fallback to Pollinations text generation for normal prompts

## Security controls
- Telegram allowlist (`TELEGRAM_ALLOWED_USER_IDS`)
- command prefix gate (`TELEGRAM_COMMAND_PREFIX`)
- single-worker lock file (`TELEGRAM_LOCK_PATH`)
