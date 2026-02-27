import { chromium } from "playwright";
import { recoverReadableTextWithRpa } from "./rpaFallback.js";

const normalizeUrl = (raw) => {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

export class ChromeAdapter {
  constructor(cfg) {
    this.cfg = cfg;
  }

  async browse(rawUrl) {
    const url = normalizeUrl(rawUrl);
    let browser;
    try {
      browser = await chromium.launch({ headless: this.cfg.headless });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: this.cfg.timeoutMs });
      const title = (await page.title()) || "";
      let body = (await page.locator("body").innerText()).trim();
      if (body.length < 60) {
        body = await recoverReadableTextWithRpa(page);
      }
      const shortBody = body.length > this.cfg.maxChars ? `${body.slice(0, this.cfg.maxChars)} ...` : body;
      return `[BROWSE]\nURL: ${url}\nTITLE: ${title}\n\n${shortBody || "(empty body text)"}`;
    } catch (err) {
      return `[BROWSE] failed: ${url}\nerror: ${err.message}`;
    } finally {
      if (browser) await browser.close();
    }
  }
}
