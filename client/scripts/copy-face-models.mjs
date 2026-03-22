/**
 * Copy @vladmandic/face-api weights into public/face-models so loadFromUri
 * hits the dev server / static host (avoids CDN hangs and ad blockers).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'node_modules', '@vladmandic', 'face-api', 'model');
const dest = path.join(root, 'public', 'face-models');

if (!fs.existsSync(src)) {
  console.warn(
    '[copy-face-models] skip: node_modules/@vladmandic/face-api/model not found (run npm install in client/)',
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('[copy-face-models] copied to public/face-models');
