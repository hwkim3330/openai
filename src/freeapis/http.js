import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const fetchJsonNative = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 160)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJsonCurl = async (url, options = {}, timeoutMs = 20000) => {
  const args = ["-sS", "--max-time", String(Math.ceil(timeoutMs / 1000))];
  const headers = options.headers || {};
  for (const [k, v] of Object.entries(headers)) {
    args.push("-H", `${k}: ${v}`);
  }
  args.push(url);
  const { stdout } = await execFileAsync("curl", args);
  return JSON.parse(stdout);
};

export const fetchJson = async (url, options = {}, timeoutMs = 20000) => {
  try {
    return await fetchJsonNative(url, options, timeoutMs);
  } catch {
    return await fetchJsonCurl(url, options, timeoutMs);
  }
};
