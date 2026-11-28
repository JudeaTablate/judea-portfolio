// Vercel serverless function: pulls Letterboxd + Substack server-side (their pages
// can't be read from the browser because of CORS) and returns one small JSON blob.
// Cached at the edge for 30 minutes so the page stays fast.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const LB_USER = 'jajuds';
const SUBSTACK = 'fromja';

const get = async (url, type = 'text') => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: type === 'json' ? 'application/json' : 'text/html,application/xml;q=0.9,*/*;q=0.8' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return type === 'json' ? r.json() : r.text();
  } finally { clearTimeout(t); }
};
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…',
};
// fromCodePoint throws on values past U+10FFFF; keep a malformed entity as-is
// rather than failing the whole feed.
const char = (cp, raw) => (cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : raw);
const decode = (s = '') => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (m, dec, hex, name) =>
    dec ? char(+dec, m) : hex ? char(parseInt(hex, 16), m) : NAMED[name.toLowerCase()] ?? m)
  .trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : null; };

async function letterboxd() {
  const out = { favorites: [], stats: {}, diary: [], debug: {} };
  const [rss, profile] = await Promise.allSettled([get(`https://letterboxd.com/${LB_USER}/rss/`), get(`https://letterboxd.com/${LB_USER}/`)]);

  out.debug.rss = rss.status === 'fulfilled' ? 'ok' : String(rss.reason && rss.reason.message);
  out.debug.profile = profile.status === 'fulfilled' ? 'ok' : String(profile.reason && profile.reason.message);
  if (rss.status === 'fulfilled') {
    for (const item of rss.value.split('<item>').slice(1)) {
      const title = tag(item, 'letterboxd:filmTitle');
      if (!title) continue; // lists also show up in the feed
      const desc = tag(item, 'description') || '';
      const rating = tag(item, 'letterboxd:memberRating');
      out.diary.push({
        title,
        year: tag(item, 'letterboxd:filmYear'),
        rating: rating ? parseFloat(rating) : null,
        liked: tag(item, 'letterboxd:memberLike') === 'Yes',
        watched: tag(item, 'letterboxd:watchedDate') || tag(item, 'pubDate'),
        url: tag(item, 'link'),
        poster: (desc.match(/<img[^>]+src="([^"]+)"/) || [])[1] || null,
      });
      if (out.diary.length >= 8) break;
    }
  }

  if (profile.status === 'fulfilled') {
    const html = profile.value;
    for (const m of html.matchAll(/<span class="value">([\d,.k]+)<\/span>\s*<span class="definition[^"]*">([^<]+)<\/span>/g)) {
      const k = m[2].trim();
      out.stats[/^films?$/i.test(k) ? 'Films' : k.replace(/^\w/, (c) => c.toUpperCase())] = m[1];
    }
    const i = html.search(/id="favourites"|class="[^"]*favourite-films/);
    out.debug.favouritesBlock = i > -1;
    if (i > -1) {
      const block = html.slice(i, html.indexOf('</section>', i));
      const seen = new Set();
      const re = /data-(?:item|film)-slug="([^"]+)"[\s\S]*?(?:data-(?:item|film)-name="([^"]+)"|alt="([^"]+)")|(?:data-(?:item|film)-name="([^"]+)"|alt="([^"]+)")[\s\S]*?data-(?:item|film)-slug="([^"]+)"/g;
      for (const m of block.matchAll(re)) {
        const slug = m[1] || m[6];
        let name = decode(m[2] || m[3] || m[4] || m[5] || '');
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        let year = (name.match(/\((\d{4})\)\s*$/) || [])[1] || null;
        name = name.replace(/\s*\(\d{4}\)\s*$/, '');
        out.favorites.push({ title: name || slug.replace(/-/g, ' '), year, slug, url: `https://letterboxd.com/film/${slug}/` });
        if (out.favorites.length === 4) break;
      }
      // posters for favorites (best effort)
      await Promise.all(out.favorites.map(async (f) => {
        try {
          const p = await get(`https://letterboxd.com/ajax/poster/film/${f.slug}/std/230x345/`);
          f.poster = (p.match(/src="(https:\/\/a\.ltrbxd\.com\/resized\/[^"]+)"/) || [])[1] || null;
          if (!f.year) f.year = (p.match(/data-film-release-year="(\d{4})"/) || [])[1] || null;
        } catch { f.poster = null; }
      }));
    }
  }
  return out;
}

async function substack() {
  try {
    const list = await get(`https://${SUBSTACK}.substack.com/api/v1/archive?sort=new&offset=0&limit=50`, 'json');
    const posts = (Array.isArray(list) ? list : []).filter((p) => p.type !== 'podcast' && p.title);
    return {
      count: posts.length,
      posts: posts.slice(0, 6).map((p) => ({
        // the archive API returns subtitles with HTML entities still encoded (&#8220; etc.)
        title: decode(p.title), subtitle: decode(p.subtitle || p.description || ''), date: p.post_date,
        url: p.canonical_url, cover: p.cover_image || null, minutes: p.wordcount ? Math.max(1, Math.round(p.wordcount / 230)) : null,
      })),
    };
  } catch {
    const xml = await get(`https://${SUBSTACK}.substack.com/feed`);
    const items = xml.split('<item>').slice(1);
    return {
      count: items.length,
      posts: items.slice(0, 6).map((it) => ({ title: tag(it, 'title'), subtitle: tag(it, 'description'), date: tag(it, 'pubDate'), url: tag(it, 'link') })),
    };
  }
}

export default async function handler(req, res) {
  const [lb, ss] = await Promise.allSettled([letterboxd(), substack()]);
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  res.status(200).json({
    letterboxd: lb.status === 'fulfilled' ? lb.value : null,
    substack: ss.status === 'fulfilled' ? ss.value : null,
    at: new Date().toISOString(),
  });
}
