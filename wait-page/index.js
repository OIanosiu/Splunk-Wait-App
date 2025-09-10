module.exports = async function (context, req) {
  const seconds     = toNum(req.query.s, process.env.AUTO_RETRY_SECONDS, 5);
  const maxAttempts = toNum(req.query.max, process.env.MAX_ATTEMPTS, 9);
  const returnUrl   = (req.query.return || process.env.DEFAULT_RETURN_URL || "").trim();

  const title = "Please wait while we set up your access…";
  const subtitle = "Your access will be ready in a moment.";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
  <style>
    :root{ --bg:#003d5c; --card:#ffffff; --fg:#0f172a; --muted:#5b6b7a; --brand:#003d5c; --shadow:0 8px 20px rgba(0,0,0,.15); --radius:6px; --warn:#b45309; }
    *{box-sizing:border-box}
    html,body{height:100%; overflow:hidden}
    body{
      margin:0; background:var(--bg); color:var(--fg);
      font:16px/1.5 "Inter","Segoe UI",system-ui,-apple-system,Arial,sans-serif;
      display:grid; place-items:center; padding:24px;
    }
    .card{
      width:min(600px, 92vw); max-height:90vh; overflow:hidden;
      background:var(--card); border-radius:var(--radius); box-shadow:var(--shadow);
      padding:32px 28px; text-align:center;
    }
    .logo{margin:0 auto 20px; display:block; height:50px}
    h1{font-size:20px; font-weight:600; margin:0 0 10px}
    p{margin:6px 0; color:var(--muted)}
    .spinner{
      margin:20px auto; width:40px; height:40px; border-radius:50%;
      border:4px solid #d6e4ff; border-top-color:var(--brand); animation:spin 1s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
    .foot{margin-top:22px; font-size:12px; color:var(--muted)}
    .banner{margin:-6px 0 12px; padding:8px 10px; border-radius:6px; background:#fff7ed; border:1px solid #fed7aa; color:var(--warn); font-size:13px}
    .hide{display:none}
  </style>
  <script>
    (function(){
      var seconds = ${Number(seconds)};
      var maxAttempts = ${Number(maxAttempts)};
      var returnUrl = ${JSON.stringify(returnUrl)};
      var key = 'nts-wait-attempts:' + location.pathname + location.search;
      var attempts = Number(sessionStorage.getItem(key) || '0');

      function refreshOnce() {
        if (returnUrl) {
          location.href = returnUrl;
        } else {
          location.reload();
        }
      }

      function maybeRefresh() {
        if (!returnUrl) {
          var warn = document.getElementById('no-return');
          if (warn) warn.classList.remove('hide');
        }

        attempts++;
        sessionStorage.setItem(key, String(attempts));

        if (attempts < maxAttempts) {
          setTimeout(refreshOnce, seconds * 1000);
        } else if (attempts === maxAttempts && returnUrl) {
          // Final attempt: try redirect
          setTimeout(() => { location.href = returnUrl; }, seconds * 1000);
        } else {
          // No return URL and max reached: show message
          var final = document.getElementById('final-msg');
          if (final) final.classList.remove('hide');
        }
      }

      window.addEventListener('DOMContentLoaded', maybeRefresh);
    })();
  </script>
</head>
<body>
  <main class="card" role="status" aria-live="polite" aria-atomic="true">
    <img class="logo"
         src="https://register.nts.eu/_next/image?url=https%3A%2F%2Fok9static.oktacdn.com%2Ffs%2Fbco%2F1%2Ffs052l0any7gT4Pth417&w=640&q=75"
         alt="NTS Logo" />

    <div id="no-return" class="banner hide">
      No return URL was provided. We’ll retry a few times and then stop.
    </div>

    <h1>${title}</h1>
    <div class="spinner" aria-hidden="true"></div>
    <p>${subtitle}</p>

    <div class="foot">
      If your applications are not available after the page refreshes, please contact your support team.
    </div>

    <div id="final-msg" class="foot hide">
      You are not assigned to this application. Please contact your support team.
    </div>
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

// Helper functions
function toNum(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return 0;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }));
}
