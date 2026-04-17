import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const svg = readFileSync(resolve(__dirname, '../apps/web/public/icons/icon.svg'));
const outDir = resolve(__dirname, '../apps/web/public/icons');
mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  { name: 'icon-maskable-512.png', size: 512, padding: 64 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0 },
  { name: 'favicon-32.png', size: 32, padding: 0 },
  { name: 'favicon-16.png', size: 16, padding: 0 },
];

for (const { name, size, padding } of sizes) {
  const inner = size - padding * 2;
  const img = sharp(svg).resize(inner, inner);
  if (padding > 0) {
    await img
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 31, g: 78, b: 121, alpha: 1 },
      })
      .png()
      .toFile(resolve(outDir, name));
  } else {
    await img.png().toFile(resolve(outDir, name));
  }
  console.log('Gerado', name);
}
