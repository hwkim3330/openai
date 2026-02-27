import { execFileSync } from 'node:child_process';

const files = [
  'src/main.js',
  'src/config.js',
  'src/pollinations.js',
  'src/chromeAdapter.js',
  'src/rpaFallback.js',
  'src/agi/loop.js',
  'src/agi/evaluator.js',
  'src/agi/improver.js',
  'src/runtime/engine.js',
  'src/freeapis/http.js',
  'src/freeapis/stocks.js',
  'src/freeapis/weather.js',
  'src/freeapis/traffic.js',
  'src/channels/cli/runner.js',
  'src/channels/telegram/bridge.js'
];

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log('check: ok');
