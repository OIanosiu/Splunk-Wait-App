module.exports = async function (context, req) {
  context.res = {
    headers: { "Content-Type": "text/html" },
    body: `
      <html>
        <head>
          <title>Please wait...</title>
          <script>
            setTimeout(() => { location.reload(); }, 5000);
          </script>
        </head>
        <body style="font-family:sans-serif; text-align:center; padding-top:20%;">
          <h2>Please wait while we complete setup...</h2>
          <p>Your access will be ready in a moment.</p>
        </body>
      </html>
    `
  };
};
