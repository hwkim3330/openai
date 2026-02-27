export class OllamaClient {
  constructor(cfg) {
    this.cfg = cfg;
  }

  getSystemPrompt() {
    return this.cfg.systemPrompt || '';
  }

  setSystemPrompt(nextPrompt) {
    this.cfg.systemPrompt = String(nextPrompt || '');
  }

  async isAvailable() {
    try {
      const res = await fetch(`${this.cfg.host}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(userPrompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

    const body = {
      model: this.cfg.model,
      system: this.cfg.systemPrompt,
      prompt: String(userPrompt || ''),
      stream: false
    };

    try {
      const res = await fetch(`${this.cfg.host}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!res.ok) {
        const txt = await res.text();
        return `Ollama error: HTTP ${res.status} ${txt.slice(0, 200)}`;
      }
      const data = await res.json();
      const text = String(data.response || '').trim();
      return text || 'No response from model.';
    } catch (err) {
      return `Ollama request failed: ${err.message}`;
    } finally {
      clearTimeout(timeout);
    }
  }
}
