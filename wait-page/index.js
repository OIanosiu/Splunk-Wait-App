module.exports = async function (context, req) {
  // Default: refresh once after 5 seconds
  const seconds = Number(req.query.s || process.env.AUTO_RETRY_SECONDS || 5);
  const returnUrl = (req.query.return || process.env.DEFAULT_RETURN_URL || "").trim();

  const title = "Please wait while we complete setup…";
  const subtitle = "Your access will be ready in a moment.";

  // meta refresh fallback
  const metaRefresh = returnUrl
    ? `<meta http-equiv="refresh" content="${seconds};url=${escapeHtml(returnUrl)}">`
    : `<meta http-equiv="refresh" content="${seconds}">`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  ${metaRefresh}
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
  <style>
    :root{
      --bg:#003d5c;
      --card:#ffffff;
      --fg:#0f172a;
      --muted:#5b6b7a;
      --brand:#003d5c;
      --shadow: 0 8px 20px rgba(0,0,0,.15);
      --radius:6px;
    }
    html,body{height:100%}
    body{
      margin:0;
      background:var(--bg);
      color:var(--fg);
      font:16px/1.5 "Inter","Segoe UI",system-ui,-apple-system,Arial,sans-serif;
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
    .logo{margin:0 auto 20px;display:block;height:50px}
    h1{font-size:20px;font-weight:600;margin:0 0 10px}
    p{margin:6px 0;color:var(--muted)}
    .spinner{
      margin:20px auto;
      width:40px;height:40px;border-radius:50%;
      border:4px solid #d6e4ff;border-top-color:var(--brand);
      animation:spin 1s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
    .foot{margin-top:22px;font-size:12px;color:var(--muted)}
  </style>
  <script>
    // JS fallback: trigger once after N seconds
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        ${returnUrl ? `location.href=${JSON.stringify(returnUrl)};` : `location.reload();`}
      }, ${seconds * 1000});
    });
  </script>
</head>
<body>
  <main class="card" role="status" aria-live="polite" aria-atomic="true">
    <img class="logo" 
         src="https://register.nts.eu/_next/image?url=https%3A%2F%2Fok9static.oktacdn.com%2Ffs%2Fbco%2F1%2Ffs052l0any7gT4Pth417&w=640&q=75" 
         alt="NTS Logo" />
    
    <h1>${title}</h1>
    <div class="spinner" aria-hidden="true"></div>
    <p>${subtitle}</p>

    <div class="foot">
      If this is your first time logging in to Splunk, please try again. 
      Otherwise, contact your support team.
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

// escape helper to sanitize returnUrl
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}
