const { chromium, webkit } = require('playwright');

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const ENGINES = [
  { name: 'chromium', launcher: chromium },
  { name: 'webkit', launcher: webkit },
];

const PER_PAGE_TIMEOUT_MS = 15000;

async function checkOneEngineViewport(launcher, url, viewport) {
  const browser = await launcher.launch();
  try {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200));
    });

    await page.goto(url, { waitUntil: 'load', timeout: PER_PAGE_TIMEOUT_MS });

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );

    const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 60, timeout: PER_PAGE_TIMEOUT_MS });

    return {
      ok: true,
      hasHorizontalScroll,
      consoleErrorCount: consoleErrors.length,
      consoleErrorsSample: consoleErrors.slice(0, 5),
      screenshotBase64: screenshotBuffer.toString('base64'),
    };
  } catch (err) {
    return { ok: false, error: err.message.split('\n')[0].slice(0, 200) };
  } finally {
    await browser.close();
  }
}

async function runCheck(url) {
  const results = [];
  for (const engine of ENGINES) {
    for (const viewport of VIEWPORTS) {
      const result = await checkOneEngineViewport(engine.launcher, url, viewport);
      results.push({ engine: engine.name, viewport: viewport.name, ...result });
    }
  }
  return results;
}

module.exports = { runCheck, VIEWPORTS, ENGINES };
