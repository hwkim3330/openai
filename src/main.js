import { config } from './config.js';
import { PollinationsClient } from './pollinations.js';
import { ChromeAdapter } from './chromeAdapter.js';
import { RuntimeEngine } from './runtime/engine.js';
import { TelegramBridge } from './channels/telegram/bridge.js';
import { runCli } from './channels/cli/runner.js';
import { runAgiLoop } from './agi/loop.js';

const args = process.argv.slice(2);
const modeIdx = args.findIndex((a) => a === '--mode');
const mode = modeIdx >= 0 ? args[modeIdx + 1] : 'cli';

const ai = new PollinationsClient(config.pollinations);
const chrome = new ChromeAdapter(config.browser);
const runtime = new RuntimeEngine({ ai, chrome });

const run = async () => {
  if (mode === 'agi') {
    await runAgiLoop();
    return;
  }

  if (mode === 'telegram') {
    if (!config.telegram.token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required for --mode telegram');
    }

    const bridge = new TelegramBridge({
      token: config.telegram.token,
      pollTimeoutSec: config.telegram.pollTimeoutSec,
      allowedUserIds: config.telegram.allowedUserIds,
      commandPrefix: config.telegram.commandPrefix,
      lockPath: config.telegram.lockPath,
      runtime
    });
    await bridge.runForever();
    return;
  }

  await runCli(runtime);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
