module.exports = async function (context, req) {
  // Config (URL params override app settings)
  const seconds = Number(req.query.s || process.env.AUTO_RETRY_SECONDS || 10);   // refresh every N seconds
  const returnUrl = (req.query.return || process.env.DEFAULT_RETURN_URL || "").trim();

  const title = "Please wait while we complete setup…";
  const subtitle = "Your access will be ready in a moment.";

  // Build meta refresh (reload current page by default). If returnUrl is present, bounce there instead.
  const refreshTarget = returnUrl ? returnUrl : ""; // empty => current URL
  const metaRefresh = refreshTarget
    ? `<meta http-equiv="refresh" content="${seconds};url=${refreshTarget}">`
    : `<meta http-equiv="refresh" content="${seconds}">`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  ${metaRefresh}
  <style>
    :root{
      --bg:#f5f6f8;       /* light neutral background */
      --card:#ffffff;     /* card surface */
      --fg:#0f172a;       /* primary text (slate-900) */
      --muted:#5b6b7a;    /* secondary text */
      --brand:#2563eb;    /* brand (ms-like blue) */
      --ring:#cfe0ff;     /* subtle focus ring */
      --shadow: 0 10px 25px rgba(16,24,40,.08), 0 4px 8px rgba(16,24,40,.06);
      --radius:16px;
    }
    html,body{height:100%}
    body{
      margin:0;
      background:var(--bg);
      color:var(--fg);
      font:16px/1.4 "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
      display:grid;
      place-items:center;
      padding:24px;
    }
    .card{
      width:min(680px, 92vw);
      background:var(--card);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:32px 28px;
    }
    .header{
      display:flex;align-items:center;gap:14px;margin-bottom:18px;
    }
    .logo{
      width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#4f8df5,#2563eb);
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);
    }
    h1{font-size:20px;font-weight:600;margin:0}
    p{margin:6px 0 0;color:var(--muted)}
    .row{display:flex;align-items:center;gap:18px;margin-top:20px}
    .spinner{
      width:28px;height:28px;border-radius:50%;
      border:3px solid #d6e4ff;border-top-color:var(--brand);
      animation:spin 1s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
    .muted{color:var(--muted)}
    .kbd{font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#f0f3f9;border:1px solid #e3e8f4;border-radius:6px;padding:6px 10px;display:inline-block}
    .actions{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}
    .btn{
      appearance:none;border:1px solid #dbe3f1;background:#fff;border-radius:10px;padding:10px 14px;cursor:pointer;
    }
    .btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
    .btn:focus{outline:3px solid var(--ring);outline-offset:2px}
    .foot{margin-top:22px;font-size:12px;color:var(--muted)}
  </style>
  <script>
    // Accessible live countdown + optional JS reload (works even without meta refresh)
    (function(){
      var seconds = ${seconds};
      var el = null;
      function tick(){
        if(!el){ el = document.getElementById('count'); }
        if(el){ el.textContent = seconds; }
        if(seconds <= 0){
          ${returnUrl
            ? `location.href = ${JSON.stringify(returnUrl)};`
            : `location.reload();`
          }
        } else {
          seconds--; setTimeout(tick, 1000);
        }
      }
      window.addEventListener('DOMContentLoaded', tick);
    })();
  </script>
</head>
<body>
  <main class="card" role="status" aria-live="polite" aria-atomic="true">
    <div class="header">
      <div class="logo" aria-hidden="true"></div>
      <h1>${title}</h1>
    </div>

    <div class="row">
      <div class="spinner" aria-hidden="true"></div>
      <div>
        <p>${subtitle}</p>
        <p class="muted">This page will ${returnUrl ? "redirect" : "refresh"} in <span id="count" class="kbd">${seconds}</span> seconds.</p>
      </div>
    </div>

    <div class="actions">
      <button class="btn" onclick="location.reload()">Refresh now</button>
      ${returnUrl ? `<button class="btn primary" onclick="location.href=${JSON.stringify(returnUrl)}">Try now</button>` : ""}
    </div>

    <div class="foot">If this is your first time logging in to Splunk, please try again. Otherwise, contact your support team.</div>
  </main>
</body>
</html>`;

  context.res = {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache"
    },
    body: html
  };
};
