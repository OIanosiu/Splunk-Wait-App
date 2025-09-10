const https = require("https");

module.exports = async function (context, req) {
  const OKTA_API_TOKEN = process.env.OKTA_API_TOKEN;
  const OKTA_DOMAIN = process.env.OKTA_DOMAIN;
  const APP_ID = process.env.OKTA_APP_ID;

  const seconds = toNum(req.query.s, process.env.AUTO_RETRY_SECONDS, 5);
  const maxAttempts = toNum(req.query.max, process.env.MAX_ATTEMPTS, 9);
  const returnUrl = (req.query.return || process.env.DEFAULT_RETURN_URL || "").trim();
  const userParam = (req.query.user || "").trim(); // 

  const title = "Please wait while we set up your access…";
  const subtitle = "Your access will be ready in a moment.";

  let assigned = null;
  let userId = null;
  let errorMessage = "";

  if (OKTA_API_TOKEN && OKTA_DOMAIN && APP_ID && userParam) {
    try {
      // NEW: detect if `userParam` is already an Okta userId (starts with 00u)
      if (userParam.startsWith("00u")) {
        userId = userParam;
      } else {
        // otherwise treat as email and look up userId
        userId = await getUserIdByEmail(OKTA_DOMAIN, OKTA_API_TOKEN, userParam);
      }

      if (userId) {
        assigned = await isUserAssignedToApp(OKTA_DOMAIN, OKTA_API_TOKEN, APP_ID, userId);
      } else {
        errorMessage = "User not found in Okta.";
      }
    } catch (err) {
      context.log("Error during assignment check:", err);
      errorMessage = "Error while checking user assignment.";
    }
  } else {
    errorMessage = "Missing required parameters or environment variables.";
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  ${assigned === true && returnUrl ? `<meta http-equiv="refresh" content="${seconds};url=${escapeHtml(returnUrl)}">` : ""}
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
    .error{color:#b45309; margin-top:16px; font-size:14px}
  </style>
  <script>
    (function(){
      var seconds = ${seconds};
      var max = ${maxAttempts};
      var assigned = ${assigned === true};
      var returnUrl = ${JSON.stringify(returnUrl)};
      var key = 'nts-wait-attempts:' + location.pathname + location.search;
      var attempts = Number(sessionStorage.getItem(key) || '0');

      if (assigned && returnUrl) {
        sessionStorage.setItem(key, '0');
        setTimeout(() => location.href = returnUrl, seconds * 1000);
      } else {
        attempts++;
        sessionStorage.setItem(key, String(attempts));
        if (attempts < max) {
          setTimeout(() => location.reload(), seconds * 1000);
        } else {
          var errElem = document.getElementById("final-error");
          if (errElem) errElem.classList.remove("hide");
        }
      }
    })();
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

    <p id="final-error" class="error hide">You are not assigned to this application.</p>

    <div class="foot">
      If your applications are not available after the page refreshes, please contact your support team.
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

// -------------------- HELPERS --------------------

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

function getUserIdByEmail(domain, token, email) {
  const url = `${domain}/api/v1/users?q=${encodeURIComponent(email)}&limit=1`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "Authorization": `SSWS ${token}`,
        "Accept": "application/json"
      }
    }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (Array.isArray(data) && data.length > 0) {
            resolve(data[0].id);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

function isUserAssignedToApp(domain, token, appId, userId) {
  const url = `${domain}/api/v1/apps/${appId}/users/${userId}`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "Authorization": `SSWS ${token}`,
        "Accept": "application/json"
      }
    }, res => {
      if (res.statusCode === 200) resolve(true);
      else if (res.statusCode === 404) resolve(false);
      else reject(new Error(`Unexpected status: ${res.statusCode}`));
    }).on("error", reject);
  });
}
