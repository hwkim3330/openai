import { RuntimeEngine } from '../src/runtime/engine.js';
import { PollinationsClient } from '../src/pollinations.js';
import { ChromeAdapter } from '../src/chromeAdapter.js';
import { config } from '../src/config.js';

const rt = new RuntimeEngine({
  ai: new PollinationsClient(config.pollinations),
  chrome: new ChromeAdapter(config.browser)
});

const tests = [
  'help',
  'weather: Seoul',
  'traffic: Seoul Station -> Incheon Airport',
  'stock: aapl.us,msft.us'
];

for (const t of tests) {
  const out = await rt.handle(t);
  console.log(`--- ${t}`);
  console.log(String(out).slice(0, 300));
}

console.log('smoke: ok');
