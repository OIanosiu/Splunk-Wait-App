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
      --bg:#003d5c;       /* NTS dark background */
      --card:#ffffff;     /* white card */
      --fg:#0f172a;       /* dark text */
      --muted:#5b6b7a;    /* secondary text */
      --brand:#003d5c;    /* NTS blue */
      --shadow: 0 8px 20px rgba(0,0,0,.15);
      --radius:6px;
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
    .logo{
      margin:0 auto 20px;
      display:block;
      height:50px;
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
    .kbd{font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#f0f3f9;border:1px solid #e3e8f4;border-radius:4px;padding:4px 8px;display:inline-block}
    .actions{margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .btn{
      appearance:none;
      border:none;
      background:var(--brand);
      color:#fff;
      font-weight:600;
      border-radius:4px;
      padding:10px 18px;
      cursor:pointer;
      transition:background .2s ease;
    }
    .btn:hover{background:#005080;}
    .btn.secondary{
      background:#e0e0e0;
      color:#000;
    }
    .btn.secondary:hover{background:#cfcfcf;}
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
    <img class="logo" src="https://register.nts.eu/_next/image?url=https%3A%2F%2Fok9static.oktacdn.com%2Ffs%2Fbco%2F1%2Ffs052l0any7gT4Pth417&w=640&q=75" alt="NTS Logo" />
    
    <h1>${title}</h1>
    <div class="spinner" aria-hidden="true"></div>
    <p>${subtitle}</p>
    <p class="muted">This page will ${returnUrl ? "redirect" : "refresh"} in <span id="count" class="kbd">${seconds}</span> seconds.</p>

    <div class="actions">
      <button class="btn secondary" onclick="location.reload()">Refresh now</button>
      ${returnUrl ? `<button class="btn" onclick="location.href=${JSON.stringify(returnUrl)}">Continue</button>` : ""}
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
