import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

if (!fs.existsSync(examplePath)) {
  console.error('.env.example not found');
  process.exit(1);
}

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('Created .env from .env.example');
} else {
  console.log('.env already exists (kept as-is)');
}

console.log('Quick setup ready. You can run now with: npm start');
console.log('Optional advanced config: edit .env (Telegram token, allowlist, prefix, etc).');
