// Azure Function that checks if a user is assigned to an Okta app via API
// NOTE: You must store the Okta API token and domain securely (e.g., in environment variables)

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
  <style>
    body { margin:0; font-family:sans-serif; display:grid; place-items:center; height:100vh; background:#003d5c; color:#fff }
    .card { background:white; color:black; padding:2rem; border-radius:8px; max-width:500px; text-align:center; }
    .spinner { width:40px; height:40px; border:4px solid #ccc; border-top-color:#003d5c; border-radius:50%; animation:spin 1s linear infinite; margin:20px auto; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .foot { font-size:12px; color:#888; margin-top:1rem; }
  </style>
</head>
<body>
  <main class="card">
    <h1>${title}</h1>
    <div class="spinner"></div>
    <p>${subtitle}</p>
    ${assigned === false ? `<p style="color: darkred; margin-top: 1rem">You are not assigned to this application.</p>` : ""}
    <div class="foot">If your applications are not available after this, please contact your support team.</div>
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
