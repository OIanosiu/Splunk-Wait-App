module.exports = async function (context, req) {
  try {
    const env = {
      node: process.version,
      platform: process.platform,
      worker: process.env.FUNCTIONS_WORKER_RUNTIME,
    };
    context.log('wait-page invoked', env);

    const html = `<!doctype html>
<html><head><meta charset="utf-8">
<title>Please wait…</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>setTimeout(()=>location.reload(),5000)</script>
<style>
  body{font-family:Segoe UI,system-ui,Arial,sans-serif;text-align:center;padding-top:20vh;background:#f8fafc;color:#0f172a}
  .muted{color:#475569}
</style></head>
<body>
  <h2>Please wait while we complete setup…</h2>
  <p class="muted">Your access will be ready in a moment.</p>
  <pre class="muted" style="font-size:12px">Node: ${env.node} • Worker: ${env.worker}</pre>
</body></html>`;

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      body: html
    };
  } catch (err) {
    context.log.error('wait-page error:', err && (err.stack || err.message || err));
    context.res = {
      status: 200, // don’t surface 500 to users; still show the page
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'Temporary issue while preparing your access. Please try again shortly.'
    };
  }
};
