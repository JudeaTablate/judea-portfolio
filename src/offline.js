import { gsap, reduceMotion, reveals, scrollToHashSoon } from './shared.js';
import { MEDIA } from './media-config.js';

const $ = (id) => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lb = `https://letterboxd.com/${MEDIA.letterboxdUser}/`;
const ss = `https://${MEDIA.substack}.substack.com/`;

function stars(r) {
  if (r == null || isNaN(r)) return '';
  const full = Math.floor(r), half = r - full >= 0.5;
  return `<span class="stars" aria-label="${r} out of 5 stars">${'★'.repeat(full)}${half ? '½' : ''}</span>`;
}
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return ''; } };
const hue = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

/* ---------- films ---------- */
function posterCard(f, i) {
  const h = hue(f.title || 'x');
  const art = f.poster
    ? `<img src="${esc(f.poster)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
    : '';
  return `<a class="fav" href="${esc(f.url || lb)}" target="_blank" rel="noopener" style="--h:${h};--r:${[-6, 3, -2, 5][i % 4]}deg">
    <span class="fav-art">${art}<span class="fav-type"><b>${esc(f.title)}</b><i>${esc(f.year || '')}</i></span></span>
    <span class="fav-cap"><b>${esc(f.title)}</b> ${f.year ? `<i>${esc(f.year)}</i>` : ''}</span>
  </a>`;
}
function renderFilms(d) {
  const favs = (d && d.favorites && d.favorites.length ? d.favorites : MEDIA.favoritesFallback) || [];
  $('lbFavs').innerHTML = favs.length
    ? favs.slice(0, 4).map(posterCard).join('')
    : `<a class="fav-empty" href="${lb}" target="_blank" rel="noopener"><em>My four favorites live on Letterboxd</em><span>Open my profile &nearr;</span></a>`;
  const st = (d && d.stats) || {};
  const pick = [['Films', 'films watched'], ['This year', 'this year'], ['Lists', 'lists'], ['Followers', 'followers']];
  $('lbStats').innerHTML = pick.filter(([k]) => st[k] != null).map(([k, l]) => `<div><b>${esc(st[k])}</b><span>${l}</span></div>`).join('');
  const diary = (d && d.diary) || [];
  $('lbDiary').innerHTML = diary.length
    ? diary.slice(0, 6).map((f) => `<a class="dia" href="${esc(f.url)}" target="_blank" rel="noopener">
        <span class="dia-art" style="--h:${hue(f.title)}">${f.poster ? `<img src="${esc(f.poster)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</span>
        <span class="dia-t"><b>${esc(f.title)}</b><i>${esc(f.year || '')}</i></span>
        <span class="dia-m">${stars(f.rating)}${f.liked ? '<span class="heart" aria-label="liked">♥</span>' : ''}<small>${fmtDate(f.watched)}</small></span>
      </a>`).join('')
    : `<p class="otc-quiet">Diary loads from <a href="${lb}films/diary/" target="_blank" rel="noopener">Letterboxd</a>.</p>`;
}

/* ---------- words ---------- */
function renderWords(d) {
  const posts = (d && d.posts) || [];
  const count = d && typeof d.count === 'number' ? d.count : null;
  if (count != null) {
    const el = $('ssCount');
    if (reduceMotion) el.textContent = count;
    else { const o = { v: 0 }; gsap.to(o, { v: count, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }); }
    $('ssCountLabel').textContent = count === 1 ? 'essay so far' : 'essays so far';
  }
  $('ssPosts').innerHTML = posts.length
    ? posts.slice(0, 3).map((p, i) => `<a class="letter" href="${esc(p.url)}" target="_blank" rel="noopener" style="--r:${[-1.5, 1, -0.5][i]}deg">
        <span class="letter-stamp lcd">No. ${String((count || posts.length) - i).padStart(2, '0')}</span>
        <span class="letter-date">${fmtDate(p.date)}</span>
        <b class="letter-title">${esc(p.title)}</b>
        ${p.subtitle ? `<span class="letter-sub">${esc(p.subtitle)}</span>` : ''}
        <span class="letter-foot">${p.minutes ? `${p.minutes} min read` : 'read'} &rarr;</span>
      </a>`).join('')
    : `<a class="letter" href="${ss}" target="_blank" rel="noopener"><span class="letter-date">Substack</span><b class="letter-title">Essays live here</b><span class="letter-foot">read &rarr;</span></a>`;
}

/* ---------- music ---------- */
function renderMusic(s) {
  const embed = MEDIA.spotifyPlaylist && MEDIA.spotifyPlaylist.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([A-Za-z0-9]+)/);
  if (embed) {
    $('spEmbed').innerHTML = `<iframe title="Spotify player" src="https://open.spotify.com/embed/${embed[1]}/${embed[2]}?utm_source=generator&theme=0" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
  }
  if (!s || !s.title) return;
  $('spState').textContent = s.playing ? 'listening right now' : 'last played';
  $('spTitle').textContent = s.title;
  $('spArtist').textContent = s.artist || '';
  if (s.url) $('spLink').href = s.url;
  if (s.art) $('vinylArt').style.backgroundImage = `url("${s.art}")`;
  $('vinyl').classList.toggle('playing', !!s.playing);
}

/* ---------- load ---------- */
async function getJSON(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}
getJSON('/api/media').then((d) => {
  renderFilms(d.letterboxd); renderWords(d.substack);
  if (d.at) $('otcUpdated').textContent = 'updated ' + fmtDate(d.at);
}).catch(() => { renderFilms(null); renderWords(null); });
renderMusic(null);
getJSON('/api/spotify').then(renderMusic).catch(() => {});

/* ---------- motion ---------- */
if (!reduceMotion) {
  gsap.from('.otc-title span, .otc-title em', { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.2 });
  gsap.from('.otc-lede, .otc-toc, .otc-issue', { opacity: 0, y: 16, duration: 0.8, stagger: 0.1, delay: 0.5 });
}
document.querySelectorAll('.otc-sec').forEach((s) => s.classList.add('reveal'));
reveals();
scrollToHashSoon();
