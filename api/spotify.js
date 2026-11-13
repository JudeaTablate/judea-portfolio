// Vercel serverless function: what Ja is playing right now (or last played).
// Needs three environment variables in Vercel: SPOTIFY_CLIENT_ID,
// SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN (see scripts/spotify-token.mjs).
// Without them it returns { configured: false } and the page shows the profile link.
export default async function handler(req, res) {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
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
    const api = (path) => fetch(`https://api.spotify.com/v1/${path}`, { headers: auth });
    const [nowR, recentR, tracksR, artistsR] = await Promise.all([
      api('me/player/currently-playing'),
      api('me/player/recently-played?limit=1'),
      api('me/top/tracks?limit=5&time_range=short_term'),
      api('me/top/artists?limit=8&time_range=short_term'),
    ]);
    let current = null;
    if (nowR.status === 200) {
      const j = await nowR.json();
      if (j && j.item && j.currently_playing_type === 'track') current = shape(j.item, !!j.is_playing);
    }
    if (!current && recentR.ok) current = shape((await recentR.json()).items?.[0]?.track, false);
    const topTracks = tracksR.ok ? ((await tracksR.json()).items || []).map((t) => ({
      title: t.name, artist: t.artists.map((a) => a.name).join(', '), art: t.album?.images?.at(-1)?.url, url: t.external_urls?.spotify,
    })) : [];
    const artistItems = artistsR.ok ? ((await artistsR.json()).items || []) : [];
    const topArtists = artistItems.slice(0, 5).map((a) => ({ name: a.name, art: a.images?.at(-1)?.url || a.images?.[0]?.url, url: a.external_urls?.spotify }));
    const count = {};
    artistItems.forEach((a, i) => (a.genres || []).forEach((g) => { count[g] = (count[g] || 0) + (8 - i); }));
    const genres = Object.entries(count).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([g]) => g);
    return res.status(200).json({ configured: true, ...(current || {}), topTracks, topArtists, genres });
  } catch {
    return res.status(200).json({ configured: true, error: true });
  }
}
