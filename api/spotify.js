// Vercel serverless function: what Ja is playing right now (or last played).
// Needs three environment variables in Vercel: SPOTIFY_CLIENT_ID,
// SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN (see scripts/spotify-token.mjs).
// Without them it returns { configured: false } and the page shows the profile link.
export default async function handler(req, res) {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  if (!id || !secret || !refresh) return res.status(200).json({ configured: false });
  try {
    const tok = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
    }).then((r) => r.json());
    const auth = { Authorization: `Bearer ${tok.access_token}` };
    const shape = (t, playing) => t && ({
      configured: true, playing, title: t.name, artist: (t.artists || []).map((a) => a.name).join(', '),
      album: t.album?.name, art: t.album?.images?.[0]?.url, url: t.external_urls?.spotify,
    });
    const now = await fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: auth });
    if (now.status === 200) {
      const j = await now.json();
      if (j && j.item && j.currently_playing_type === 'track') return res.status(200).json(shape(j.item, !!j.is_playing));
    }
    const recent = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', { headers: auth }).then((r) => r.json());
    return res.status(200).json(shape(recent.items?.[0]?.track, false) || { configured: true });
  } catch {
    return res.status(200).json({ configured: true, error: true });
  }
}
