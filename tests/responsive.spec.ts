import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test.describe(`responsive @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      // Cap device scale factor: iPhone emulation defaults to 3x, and this page's
      // full height * 3 exceeds WebKit's 32767px screenshot dimension limit.
      deviceScaleFactor: 1,
    });

    test('page loads without horizontal overflow', async ({ page }) => {
      await page.goto('/');
      const hasHorizontalScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalScroll).toBe(false);
    });

    test('full-page screenshot', async ({ page }, testInfo) => {
      test.setTimeout(60000);
      await page.goto('/');
      await page.screenshot({
        path: `screenshots/${testInfo.project.name}-${viewport.name}.png`,
        fullPage: true,
        timeout: 60000,
        animations: 'disabled',
      });
    });
  });
}
