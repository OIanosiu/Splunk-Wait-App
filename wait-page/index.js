module.exports = async function (context, req) {
  const seconds = Number(req.query.s || process.env.AUTO_RETRY_SECONDS || 10);
  const returnUrl = (req.query.return || process.env.DEFAULT_RETURN_URL || "").trim();

  const title = "Please wait while we complete setup…";
  const subtitle = "Your access will be ready in a moment.";

  const refreshTarget = returnUrl ? returnUrl : "";
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
      --bg:#003d5c;       /* NTS background */
      --card:#ffffff;     /* white card */
      --fg:#0f172a;       /* dark text */
      --muted:#5b6b7a;    /* secondary */
      --brand:#003d5c;    /* NTS dark blue */
      --shadow: 0 10px 25px rgba(0,0,0,.1);
      --radius:12px;
    }
    html,body{height:100%}
    body{
      margin:0;
      background:var(--bg);
      color:var(--fg);
      font:16px/1.4 "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      display:grid;
      place-items:center;
      padding:24px;
    }
    .card{
      width:min(600px, 92vw);
      background:var(--card);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:32px 28px;
      text-align:center;
    }
    h1{font-size:20px;font-weight:600;margin:0 0 10px}
    p{margin:6px 0;color:var(--muted)}
    .spinner{
      margin:20px auto;
      width:40px;height:40px;border-radius:50%;
      border:4px solid #d6e4ff;border-top-color:var(--brand);
      animation:spin 1s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
    .kbd{font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#f0f3f9;border:1px solid #e3e8f4;border-radius:6px;padding:6px 10px;display:inline-block}
    .actions{margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
    .btn{
      appearance:none;border:1px solid #dbe3f1;background:#fff;border-radius:8px;padding:10px 14px;cursor:pointer;
    }
    .btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
    .foot{margin-top:22px;font-size:12px;color:var(--muted)}
  </style>
  <script>
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
    <h1>${title}</h1>
    <div class="spinner" aria-hidden="true"></div>
    <p>${subtitle}</p>
    <p class="muted">This page will ${returnUrl ? "redirect" : "refresh"} in <span id="count" class="kbd">${seconds}</span> seconds.</p>

    <div class="actions">
      <button class="btn" onclick="location.reload()">Refresh now</button>
      ${returnUrl ? `<button class="btn primary" onclick="location.href=${JSON.stringify(returnUrl)}">Continue</button>` : ""}
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
