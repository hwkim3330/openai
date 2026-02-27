import { PollinationsClient } from './pollinations.js';
import { OllamaClient } from './ollama.js';

class AutoAiClient {
  constructor({ primary, fallback, primaryName, fallbackName }) {
    this.primary = primary;
    this.fallback = fallback;
    this.primaryName = primaryName;
    this.fallbackName = fallbackName;
    this.lastProvider = fallbackName;
  }

  getSystemPrompt() {
    if (typeof this.primary.getSystemPrompt === 'function') return this.primary.getSystemPrompt();
    return '';
  }

  setSystemPrompt(nextPrompt) {
    if (typeof this.primary.setSystemPrompt === 'function') this.primary.setSystemPrompt(nextPrompt);
    if (typeof this.fallback.setSystemPrompt === 'function') this.fallback.setSystemPrompt(nextPrompt);
  }

  async generate(userPrompt) {
    if (typeof this.primary.isAvailable === 'function') {
      const ok = await this.primary.isAvailable();
      if (ok) {
        this.lastProvider = this.primaryName;
        return this.primary.generate(userPrompt);
      }
    }
    this.lastProvider = this.fallbackName;
    return this.fallback.generate(userPrompt);
  }
}

export const createAiClient = (config) => {
  const provider = String(config.ai.provider || 'auto').toLowerCase();
  if (provider === 'ollama') {
    return new OllamaClient(config.ollama);
  }
  if (provider === 'pollinations') {
    return new PollinationsClient(config.pollinations);
  }
  return new AutoAiClient({
    primary: new OllamaClient(config.ollama),
    fallback: new PollinationsClient(config.pollinations),
    primaryName: 'ollama',
    fallbackName: 'pollinations'
  });
};
