const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
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

// Jobs run in the background so no single HTTP request has to stay open for
// the whole test run — platform proxies (Render/Cloudflare) kill long-lived
// requests around ~100s, which a full 6-check run with full-page screenshots
// can exceed on heavy real-world pages. The client polls for progress instead.
const jobs = new Map();
const JOB_TTL_MS = 10 * 60 * 1000;

function cleanupOldJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}

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

  cleanupOldJobs();

  const jobId = crypto.randomUUID();
  const job = { id: jobId, url: safeUrl, results: [], done: false, error: null, createdAt: Date.now() };
  jobs.set(jobId, job);

  busy = true;
  res.json({ jobId, url: safeUrl });

  // Run in the background — the response above has already been sent.
  runCheck(safeUrl, (result) => {
    job.results.push(result);
  })
    .catch((err) => {
      job.error = 'Test run failed: ' + err.message;
    })
    .finally(() => {
      job.done = true;
      busy = false;
    });
});

app.get('/api/test/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found (it may have expired)' });
  }
  res.json({
    url: job.url,
    done: job.done,
    error: job.error,
    results: job.results,
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`browser-testing webapp listening on port ${PORT}`);
});
