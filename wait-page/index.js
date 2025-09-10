const https = require("https");

module.exports = async function (context, req) {
  const OKTA_API_TOKEN = process.env.OKTA_API_TOKEN;
  const OKTA_DOMAIN = process.env.OKTA_DOMAIN; // 
  const APP_ID = process.env.OKTA_APP_ID; // 

  const seconds = toNum(req.query.s, process.env.AUTO_RETRY_SECONDS, 5);
  const maxAttempts = toNum(req.query.max, process.env.MAX_ATTEMPTS, 9);
  const returnUrl = (req.query.return || process.env.DEFAULT_RETURN_URL || "").trim();
  const userId = req.query.user; // <- You must provide this in the query for now

  const title = "Please wait while we set up your access…";
  const subtitle = "Your access will be ready in a moment.";

  let assigned = null;

  if (OKTA_API_TOKEN && OKTA_DOMAIN && APP_ID && userId) {
    try {
      assigned = await isUserAssignedToApp(OKTA_DOMAIN, OKTA_API_TOKEN, APP_ID, userId);
    } catch (err) {
      context.log("Assignment check failed:", err);
    }
  }

  const shouldRedirect = assigned === true && returnUrl;
  const metaRefresh = shouldRedirect
    ? `<meta http-equiv="refresh" content="${seconds};url=${escapeHtml(returnUrl)}">`
    : "";

    const html = `<!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${title}</title>
      ${metaRefresh}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
      <style>
        :root {
          --bg: #003d5c;
          --card: #ffffff;
          --fg: #0f172a;
          --muted: #5b6b7a;
          --brand: #003d5c;
          --shadow: 0 8px 20px rgba(0,0,0,0.15);
          --radius: 8px;
          --warn: #b45309;
        }
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          height: 100%;
          background: var(--bg);
          color: var(--fg);
          font-family: "Inter", "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
          display: grid;
          place-items: center;
        }
        .card {
          background: var(--card);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 32px;
          width: min(600px, 92vw);
          max-width: 600px;
          text-align: center;
        }
        .logo {
          height: 50px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 22px;
          font-weight: 600;
          margin: 0 0 12px;
        }
        p {
          margin: 8px 0;
          color: var(--muted);
          font-size: 16px;
        }
        .error {
          margin-top: 16px;
          padding: 12px;
          background: #fff7ed;
          color: var(--warn);
          border: 1px solid #fbbf24;
          border-radius: 6px;
          font-size: 14px;
        }
        .spinner {
          margin: 24px auto;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 4px solid #d6e4ff;
          border-top-color: var(--brand);
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .foot {
          margin-top: 24px;
          font-size: 13px;
          color: var(--muted);
        }
      </style>
    </head>
    <body>
      <main class="card">
        <img class="logo"
             src="https://register.nts.eu/_next/image?url=https%3A%2F%2Fok9static.oktacdn.com%2Ffs%2Fbco%2F1%2Ffs052l0any7gT4Pth417&w=640&q=75"
             alt="NTS Logo" />
        <h1>${title}</h1>
        <div class="spinner"></div>
        <p>${subtitle}</p>
        ${assigned === false ? `<div class="error">You are not assigned to this application.</div>` : ""}
        <div class="foot">
          If your applications are not available after this, please contact your support team.
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
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function isUserAssignedToApp(oktaDomain, token, appId, userId) {
  const url = `${oktaDomain}/api/v1/apps/${appId}/users/${userId}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "GET",
      headers: {
        "Authorization": `SSWS ${token}`,
        "Accept": "application/json"
      }
    }, res => {
      if (res.statusCode === 200) resolve(true);
      else if (res.statusCode === 404) resolve(false);
      else reject(new Error(`Unexpected status: ${res.statusCode}`));
    });

    req.on("error", reject);
    req.end();
  });
}
