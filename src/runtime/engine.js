import { getStockQuote } from '../freeapis/stocks.js';
import { getWeather } from '../freeapis/weather.js';
import { getTraffic } from '../freeapis/traffic.js';

const HELP_TEXT = [
  '[HELP]',
  'Commands:',
  '- help',
  '- browse: <url>',
  '- weather: <city|lat,lon>',
  '- traffic: <from> -> <to>',
  '- stock: <sym1,sym2,...>',
  '',
  'Examples:',
  '- weather: Seoul',
  '- traffic: Seoul Station -> Incheon Airport',
  '- stock: aapl.us,msft.us',
  '- browse: https://pollinations.ai'
].join('\n');

export class RuntimeEngine {
  constructor({ ai, chrome }) {
    this.ai = ai;
    this.chrome = chrome;
  }

  async handle(input) {
    const text = input.trim();
    const lower = text.toLowerCase();

    if (lower === 'help' || lower === '/help') {
      return HELP_TEXT;
    }

    if (lower.startsWith('browse:')) {
      const target = text.slice('browse:'.length).trim();
      if (!target) return 'usage: browse: <url>';
      return this.chrome.browse(target);
    }

    if (lower.startsWith('stock:') || lower.startsWith('stocks:')) {
      const payload = text.slice(text.indexOf(':') + 1).trim();
      return getStockQuote(payload);
    }

    if (lower.startsWith('weather:')) {
      const payload = text.slice('weather:'.length).trim();
      return getWeather(payload);
    }

    if (lower.startsWith('traffic:')) {
      const payload = text.slice('traffic:'.length).trim();
      return getTraffic(payload);
    }

    return this.ai.generate(text);
  }
}
