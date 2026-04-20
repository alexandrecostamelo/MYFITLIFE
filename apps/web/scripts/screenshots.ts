import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const SCREENS = [
  { name: '01-dashboard', path: '/app/dashboard', wait: 2000 },
  { name: '02-workout', path: '/app/workouts/explore', wait: 1500 },
  { name: '03-nutrition', path: '/app/nutrition/recipes', wait: 1500 },
  { name: '04-coach', path: '/app/coach', wait: 1500 },
  { name: '05-readiness', path: '/app/health/readiness', wait: 1500 },
];

const DEVICES = [
  { name: 'pixel7', width: 412, height: 915, scale: 2.625 },
  { name: 'iphone14pro', width: 393, height: 852, scale: 3 },
];

async function main() {
  const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
  const outDir = path.join(process.cwd(), 'store-metadata', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const device of DEVICES) {
    for (const screen of SCREENS) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
        colorScheme: 'dark',
        storageState: process.env.E2E_STORAGE_STATE || undefined,
      });

      const page = await context.newPage();

      try {
        await page.goto(`${baseUrl}${screen.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        await page.waitForTimeout(screen.wait);

        const filename = `${device.name}-${screen.name}.png`;
        await page.screenshot({
          path: path.join(outDir, filename),
          fullPage: false,
        });
        console.log(`\u2713 ${filename}`);
      } catch (err) {
        console.error(`\u2717 ${device.name}-${screen.name}: ${err}`);
      }

      await context.close();
    }
  }

  await browser.close();
  console.log(`\nScreenshots em: ${outDir}`);
}

main();
