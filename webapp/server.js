const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { assertSafePublicUrl } = require('./lib/urlSafety');
const { runCheck } = require('./lib/runCheck');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Only one test runs at a time — headless browsers are heavy, and this keeps
// a free-tier instance from being overwhelmed by concurrent requests.
let busy = false;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a while before trying again.' },
});

app.post('/api/test', limiter, async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing "url" in request body' });
  }

  if (busy) {
    return res.status(429).json({ error: 'Another test is already running. Please try again shortly.' });
  }

  let safeUrl;
  try {
    safeUrl = await assertSafePublicUrl(url);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  busy = true;
  try {
    const results = await runCheck(safeUrl);
    res.json({ url: safeUrl, results });
  } catch (err) {
    res.status(500).json({ error: 'Test run failed: ' + err.message });
  } finally {
    busy = false;
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`browser-testing webapp listening on port ${PORT}`);
});
