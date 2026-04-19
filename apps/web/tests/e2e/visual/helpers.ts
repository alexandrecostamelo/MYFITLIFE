import type { Page } from '@playwright/test';

export async function stabilizeForScreenshot(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      .animate-spin, .animate-pulse, .animate-bounce, .animate-ping {
        animation: none !important;
      }
    `,
  });
  await page.evaluate(() => {
    document.fonts?.ready?.then(() => {});
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(300);
}

export async function mockDateToFixed(page: Page, isoDate = '2026-04-15T12:00:00Z') {
  await page.addInitScript((fixed: string) => {
    const RealDate = Date;
    const fixedTime = new RealDate(fixed).getTime();
    class MockDate extends RealDate {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(fixedTime);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          super(...(args as [any]));
        }
      }
      static now() {
        return fixedTime;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Date = MockDate;
  }, isoDate);
}
