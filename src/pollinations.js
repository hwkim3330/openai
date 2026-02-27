const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class PollinationsClient {
  constructor(cfg) {
    this.cfg = cfg;
    this.lastRequestTs = 0;
  }

  getSystemPrompt() {
    return this.cfg.systemPrompt || '';
  }

  setSystemPrompt(nextPrompt) {
    this.cfg.systemPrompt = String(nextPrompt || '');
  }

  async rateLimit() {
    const now = Date.now();
    const wait = this.cfg.minIntervalMs - (now - this.lastRequestTs);
    if (wait > 0) await sleep(wait);
    this.lastRequestTs = Date.now();
  }

  async generate(userPrompt) {
    await this.rateLimit();

    const payload = `${this.cfg.systemPrompt}\n\nUser: ${userPrompt}\nAssistant:`;
    const encoded = encodeURIComponent(payload);
    const model = encodeURIComponent(this.cfg.model);
    const urlWithModel = `https://text.pollinations.ai/prompt/${encoded}?model=${model}`;
    const urlNoModel = `https://text.pollinations.ai/prompt/${encoded}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

    try {
      let res = await fetch(urlWithModel, { signal: controller.signal });
      if (res.status === 404) {
        // Some deployments do not support model query names; retry with default server model.
        res = await fetch(urlNoModel, { signal: controller.signal });
      }
      if (!res.ok) return `Pollinations error: HTTP ${res.status}`;
      const text = (await res.text()).trim();
      return text || "No response from model.";
    } catch (err) {
      return `Pollinations request failed: ${err.message}`;
    } finally {
      clearTimeout(timeout);
    }
  }
}
