module.exports = async function (context, req) {
  const title = "Please wait while we set up your access…";
  const subtitle =
    "If this is your first time logging in to Splunk, we are busy setting up your access. Please try to log in again in a few minutes. Otherwise, please get in touch with support@nts.eu.";

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#003d5c;
      --card:#ffffff;
      --fg:#0f172a;
      --muted:#5b6b7a;
      --brand:#003d5c;
      --shadow: 0 8px 20px rgba(0,0,0,.15);
      --radius:8px;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{height:100%; overflow:hidden;}
    body{
      background:var(--bg);
      color:var(--fg);
      font-family:"Inter","Segoe UI",system-ui,-apple-system,Arial,sans-serif;
      font-size:16px;
      line-height:1.5;
      display:grid;
      place-items:center;
      padding:24px;
    }
    .card{
      width:min(600px, 92vw);
      background:var(--card);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:40px 32px;
      text-align:center;
    }
    .logo{
      margin:0 auto 24px;
      display:block;
      height:60px;
    }
    h1{
      font-size:20px;
      font-weight:600;
      margin-bottom:16px;
    }
    p{
      color:var(--muted);
      margin-top:20px;
    }
    .spinner{
      margin:24px auto;
      width:40px;
      height:40px;
      border-radius:50%;
      border:4px solid #d6e4ff;
      border-top-color:var(--brand);
      animation:spin 1s linear infinite;
    }
    @keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <main class="card" role="status" aria-live="polite" aria-atomic="true">
    <img class="logo"
         src="https://register.nts.eu/_next/image?url=https%3A%2F%2Fok9static.oktacdn.com%2Ffs%2Fbco%2F1%2Ffs052l0any7gT4Pth417&w=640&q=75"
         alt="NTS Logo" />

    <h1>${title}</h1>
    <div class="spinner" aria-hidden="true"></div>
    <p>${subtitle}</p>
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
