export class Runtime {
  constructor({ ai, chrome }) {
    this.ai = ai;
    this.chrome = chrome;
  }

  async handle(input) {
    const text = input.trim();
    if (text.toLowerCase().startsWith("browse:")) {
      const target = text.slice("browse:".length).trim();
      if (!target) return "usage: browse: <url>";
      return this.chrome.browse(target);
    }
    return this.ai.generate(text);
  }
}
