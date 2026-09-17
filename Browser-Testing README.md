# Browser-Testing

Cross-browser end-to-end testing powered by [Playwright](https://playwright.dev). Runs the same test suite against Chromium, Firefox, and WebKit (Safari's engine) — plus mobile emulation profiles — without needing separate machines for each OS/browser combo.

## Features

- Cross-browser coverage: Chromium (Chrome/Edge), Firefox, WebKit (Safari engine)
- Mobile emulation: Pixel 7 (Chrome) and iPhone 14 (Safari)
- Auto-captured traces, screenshots, and video on failure
- HTML test report

## Requirements

- Node.js 18+
- Linux, macOS, or Windows

## Setup

```bash
npm install
npm run install:browsers   # downloads Chromium, Firefox, WebKit binaries + OS deps
```

## Running tests

```bash
npm test                  # run all tests, all browsers
npm run test:chromium     # Chromium only
npm run test:firefox      # Firefox only
npm run test:webkit       # WebKit only
npm run test:headed       # run with a visible browser window
npm run test:ui           # interactive Playwright UI mode
```

Target a different site by setting `BASE_URL`:

```bash
BASE_URL=https://your-site.example.com npm test
```

## Viewing results

```bash
npm run report
```

Opens the HTML report with pass/fail results, traces, and screenshots/videos for any failures.

## Project structure

```
playwright.config.ts   # browser/device projects, reporters, retry/trace settings
tests/                 # test specs
playwright-report/     # generated HTML report (git-ignored)
test-results/          # generated artifacts: traces, screenshots, videos (git-ignored)
```

## License

MIT
