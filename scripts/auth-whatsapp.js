const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

async function run() {
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  const PORT = 54321;
  const redirectUri = `http://localhost:${PORT}/callback`;

  console.log('[1/4] Registering OAuth client...');
  const regRes = await fetch('https://whatsapp.finereli.com/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      redirect_uris: [redirectUri],
      client_name: 'Antigravity MCP'
    })
  });

  const regData = await regRes.json();
  if (!regData.client_id) {
    console.error('Registration failed:', regData);
    process.exit(1);
  }

  const { client_id, client_secret } = regData;
  console.log(`[1/4] Registered client_id: ${client_id}`);

  const authUrl = `https://whatsapp.finereli.com/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=whatsapp&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h2>Authorization Error: ${error}</h2>`);
        console.error('OAuth error:', error);
        server.close();
        process.exit(1);
      }

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <div style="font-family:sans-serif; text-align:center; padding: 50px;">
            <h1 style="color: #10b981;">✓ WhatsApp Connected Successfully!</h1>
            <p>You can close this tab and return to Antigravity.</p>
          </div>
        `);

        console.log('[3/4] Received authorization code. Exchanging for token...');

        try {
          const authHeader = 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64');
          const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
            client_id
          });

          const tokenRes = await fetch('https://whatsapp.finereli.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': authHeader
            },
            body: tokenParams.toString()
          });

          const tokenData = await tokenRes.json();
          if (!tokenData.access_token) {
            console.error('Token exchange failed:', tokenData);
            server.close();
            process.exit(1);
          }

          console.log('[4/4] Successfully obtained access token!');
          
          // Save token to credentials file
          const tokenFile = path.join(__dirname, 'whatsapp-token.json');
          fs.writeFileSync(tokenFile, JSON.stringify({
            client_id,
            client_secret,
            ...tokenData,
            savedAt: new Date().toISOString()
          }, null, 2));
          console.log(`Token saved to ${tokenFile}`);

          // Also update Claude credentials if present
          const claudeCredsPath = path.join(process.env.USERPROFILE || '', '.claude', '.credentials.json');
          if (fs.existsSync(claudeCredsPath)) {
            try {
              const claudeCreds = JSON.parse(fs.readFileSync(claudeCredsPath, 'utf8'));
              claudeCreds.mcpOAuth = claudeCreds.mcpOAuth || {};
              for (const k of Object.keys(claudeCreds.mcpOAuth)) {
                if (k.startsWith('whatsapp')) {
                  claudeCreds.mcpOAuth[k].accessToken = tokenData.access_token;
                  claudeCreds.mcpOAuth[k].expiresAt = Date.now() + ((tokenData.expires_in || 3600) * 1000);
                  if (tokenData.refresh_token) {
                    claudeCreds.mcpOAuth[k].refreshToken = tokenData.refresh_token;
                  }
                }
              }
              fs.writeFileSync(claudeCredsPath, JSON.stringify(claudeCreds, null, 2));
              console.log('Updated Claude Code credentials.');
            } catch (err) {
              console.error('Could not update Claude creds:', err.message);
            }
          }

          server.close();
          process.exit(0);
        } catch (exchangeErr) {
          console.error('Exchange error:', exchangeErr);
          server.close();
          process.exit(1);
        }
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`[2/4] OAuth local server listening on port ${PORT}`);
    console.log('Opening authorization URL in browser...');
    console.log(authUrl);
    // Open URL in default browser
    exec(`start "" "${authUrl}"`);
  });
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
