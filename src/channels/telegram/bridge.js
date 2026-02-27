import fs from 'node:fs';

const tgCall = async (base, method, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const url = `${base}/${method}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  return data.result;
};

export class TelegramBridge {
  constructor({ token, pollTimeoutSec, allowedUserIds, commandPrefix, lockPath, runtime }) {
    this.runtime = runtime;
    this.offset = 0;
    this.pollTimeoutSec = pollTimeoutSec;
    this.allowedUserIds = new Set((allowedUserIds || []).map((x) => String(x)));
    this.commandPrefix = commandPrefix || '';
    this.lockPath = lockPath;
    this.lockFd = null;
    this.base = `https://api.telegram.org/bot${token}`;
  }

  async send(chatId, text) {
    await tgCall(this.base, 'sendMessage', {
      chat_id: String(chatId),
      text: String(text).slice(0, 4000)
    });
  }

  acquireLock() {
    if (!this.lockPath) return;
    this.lockFd = fs.openSync(this.lockPath, 'wx');
    fs.writeFileSync(this.lockFd, String(process.pid));
  }

  releaseLock() {
    if (!this.lockPath) return;
    try {
      if (this.lockFd !== null) fs.closeSync(this.lockFd);
      fs.unlinkSync(this.lockPath);
    } catch {
      // noop
    }
  }

  normalizeInboundText(text) {
    if (!this.commandPrefix) return text;
    if (!text.startsWith(this.commandPrefix)) return '';
    return text.slice(this.commandPrefix.length).trim();
  }

  async runForever() {
    console.log('Telegram bridge started');
    this.acquireLock();
    const cleanup = () => this.releaseLock();
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);

    while (true) {
      try {
        const updates = await tgCall(this.base, 'getUpdates', {
          offset: String(this.offset),
          timeout: String(this.pollTimeoutSec),
          allowed_updates: JSON.stringify(['message'])
        });

        for (const up of updates) {
          this.offset = up.update_id + 1;
          const msg = up.message || {};
          const chatId = msg.chat?.id;
          const fromId = msg.from?.id;
          const rawText = (msg.text || '').trim();
          if (!chatId || !rawText) continue;

          if (this.allowedUserIds.size > 0 && !this.allowedUserIds.has(String(fromId))) {
            await this.send(chatId, 'Access denied.');
            continue;
          }

          if (rawText.startsWith('/start')) {
            await this.send(
              chatId,
              'Ready. Commands: browse:, stock:, weather:, traffic: (optionally prefix-protected).'
            );
            continue;
          }
          if (rawText.startsWith('/help')) {
            const answer = await this.runtime.handle('help');
            await this.send(chatId, answer);
            continue;
          }

          const text = this.normalizeInboundText(rawText);
          if (!text) continue;

          const answer = await this.runtime.handle(text);
          await this.send(chatId, answer);
        }
      } catch (err) {
        console.error('Telegram loop error:', err.message);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}
