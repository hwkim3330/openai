import dotenv from "dotenv";

dotenv.config();

const asBool = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export const config = {
  pollinations: {
    model: process.env.POLLINATIONS_MODEL || "openai-large",
    systemPrompt: process.env.POLLINATIONS_SYSTEM_PROMPT || "You are a concise assistant.",
    timeoutMs: Number(process.env.POLLINATIONS_TIMEOUT_MS || 45000),
    minIntervalMs: Number(process.env.POLLINATIONS_MIN_INTERVAL_MS || 15000)
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || "",
    pollTimeoutSec: 30,
    allowedUserIds: (process.env.TELEGRAM_ALLOWED_USER_IDS || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    commandPrefix: process.env.TELEGRAM_COMMAND_PREFIX || "",
    lockPath: process.env.TELEGRAM_LOCK_PATH || "/tmp/openai-agent-telegram.lock"
  },
  browser: {
    headless: asBool(process.env.BROWSER_HEADLESS, true),
    timeoutMs: Number(process.env.BROWSER_TIMEOUT_MS || 30000),
    maxChars: Number(process.env.BROWSER_MAX_CHARS || 3000)
  },
  logLevel: process.env.LOG_LEVEL || "info"
};
