// One-time helper to get a Spotify refresh token for /api/spotify.
// 1) Create an app at https://developer.spotify.com/dashboard
//    Redirect URI: http://127.0.0.1:8888/callback
// 2) Run:  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-token.mjs
//    (PowerShell: $env:SPOTIFY_CLIENT_ID="xxx"; $env:SPOTIFY_CLIENT_SECRET="yyy"; node scripts/spotify-token.mjs)
// 3) Open the printed link, log in, and copy the refresh token it shows into Vercel.
import http from 'node:http';
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) { console.error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first.'); process.exit(1); }
const redirect = 'http://127.0.0.1:8888/callback';
const scope = 'user-read-currently-playing user-read-recently-played user-top-read';
console.log('\nOpen this link in your browser:\n');
console.log(`https://accounts.spotify.com/authorize?response_type=code&client_id=${id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect)}\n`);
http.createServer(async (req, res) => {
  const code = new URL(req.url, redirect).searchParams.get('code');
  if (!code) { res.end('No code.'); return; }
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }),
  }).then((x) => x.json());
  console.log('\nSPOTIFY_REFRESH_TOKEN =', r.refresh_token, '\n');
  res.end('Done. Copy the refresh token from your terminal, then close this tab.');
  process.exit(0);
}).listen(8888, '127.0.0.1');
