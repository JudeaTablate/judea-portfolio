import './style.css';
import './layout.css';
import './personal.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ICONS, injectIcons } from './icons.js';
import { PALETTES, setPalette, clickSound, isOn } from './audio.js';
import { themeTransition } from './theme-fx.js';
import { SOCIAL_PATHS } from './social-icons.js';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

const store = {
  get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } },
  set(k, v, s = localStorage) { try { s.setItem(k, v); } catch { /* private mode */ } },
  del(k, s = localStorage) { try { s.removeItem(k); } catch { /* ignore */ } },
};
export { store };

export const PAGE = document.documentElement.dataset.page || 'home';
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const PAGES = [
  { id: 'home', href: '/', label: 'Home', num: '00' },
  { id: 'work', href: '/work.html', label: 'The Work', num: '01' },
  { id: 'offline', href: '/offline.html', label: 'Off the Clock', num: '02' },
];

/* ---------- smooth scroll ---------- */
export const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ---------- header + footer ---------- */
const header = document.getElementById('siteHeader');
header.innerHTML = `
<nav class="topnav" aria-label="Site">
  <a class="logo" href="/" data-dest="Home" data-destnum="00">judea</a>
  <div class="pagelinks">
    ${PAGES.map((p) => `<a href="${p.href}" data-dest="${p.label}" data-destnum="${p.num}" ${p.id === PAGE ? 'aria-current="page"' : ''}>${p.label}</a>`).join('')}
  </div>
  <div class="navtools">
    <div id="clock" class="lcd clock" aria-label="Time in Manila">MNL --:--</div>
    ${PAGE !== 'home' ? '<button class="toolbtn icon-only" id="termBtn" aria-label="Open terminal easter egg" title="Terminal"><span class="lcd">&gt;_</span></button>' : ''}
    <div class="sound-menu" id="soundMenu">
      <button class="toolbtn" id="soundBtn" aria-haspopup="listbox" aria-expanded="false" aria-label="Choose background music"><span class="ic" data-icon="music"></span><span class="tb-label" id="soundLabel">Off</span><span class="ic ic-chev" data-icon="chevron"></span></button>
      <ul class="sound-list" id="soundList" role="listbox" aria-label="Music mood"></ul>
    </div>
    <button class="toolbtn icon-only" id="themeBtn" aria-label="Switch theme"><span class="ic" id="themeIc" data-icon="sun"></span></button>
    <button class="hamburger" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>
  </div>
</nav>`;

const footer = document.getElementById('siteFooter');
const fIcon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const SOCIALS = [
  ['Email', 'mailto:judeaannctablate@gmail.com', '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>'],
  ['GitHub', 'https://github.com/JudeaTablate', fIcon(SOCIAL_PATHS.github)],
  ['LinkedIn', 'https://www.linkedin.com/in/judea-ann-tablate-65a8901b7/', '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M5 2.5h14A2.5 2.5 0 0 1 21.5 5v14a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 19V5A2.5 2.5 0 0 1 5 2.5zm1.6 7.3v8h2.5v-8zm1.25-4.1a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9zM10.7 9.8v8h2.5v-4.2c0-1.1.2-2.2 1.6-2.2 1.4 0 1.4 1.3 1.4 2.3v4.1h2.5v-4.6c0-2.3-.5-3.6-3-3.6-1.2 0-2 .6-2.4 1.3h-.04V9.8z"/></svg>'],
  ['Instagram', 'https://www.instagram.com/ja_tubs', fIcon(SOCIAL_PATHS.instagram)],
  ['Letterboxd', 'https://letterboxd.com/jajuds/', fIcon(SOCIAL_PATHS.letterboxd)],
  ['Substack', 'https://fromja.substack.com/', fIcon(SOCIAL_PATHS.substack)],
];
if (footer) footer.innerHTML = `
<div class="wrap footbar">
  <div class="foot-brand">judea &copy; ${new Date().getFullYear()}</div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="socGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b983ff"/><stop offset=".5" stop-color="#ff9ecd"/><stop offset="1" stop-color="#6ff0e0"/></linearGradient></defs></svg>
  <nav class="foot-socials" aria-label="Find me elsewhere">
    ${SOCIALS.map(([name, href, svg]) => `<a class="soc" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} aria-label="${name}" data-tip="${name}">${svg}</a>`).join('')}
  </nav>
</div>`;

/* ---------- mobile menu (pages + optional section list) ---------- */
const menu = document.getElementById('mobileMenu');
const burger = document.getElementById('hamburgerBtn');
export function setMenuSections(list) {
  const sec = list.length ? `<div class="mm-label lcd">On this page</div>${list.map((s) => `<a href="#${s.id}" class="mm-sec"><span class="lcd">${s.n}</span>${s.name}</a>`).join('')}` : '';
  menu.innerHTML = `<div class="mm-label lcd">Pages</div>${PAGES.map((p) => `<a href="${p.href}" data-dest="${p.label}" data-destnum="${p.num}" ${p.id === PAGE ? 'aria-current="page"' : ''}><span class="lcd">${p.num}</span>${p.label}</a>`).join('')}${sec}`;
  bindLinks(menu);
}
setMenuSections([]);
const closeMenu = () => {
  burger.classList.remove('open'); menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
};
burger.addEventListener('click', () => {
  const o = !menu.classList.contains('open');
  burger.classList.toggle('open', o); menu.classList.toggle('open', o);
  burger.setAttribute('aria-expanded', String(o)); menu.setAttribute('aria-hidden', String(!o));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ---------- page transitions (curtain shows where you're going) ---------- */
const curtain = document.getElementById('curtain');
function showCurtain(num, name) {
  curtain.querySelector('.cl-num').textContent = num || '';
  curtain.querySelector('.cl-name').textContent = name || '';
}
function goPage(href, name, num) {
  store.set('ja-nav', JSON.stringify({ name, num }), sessionStorage);
  if (reduceMotion) { location.href = href; return; }
  showCurtain(num, name);
  document.documentElement.classList.remove('arriving');
  curtain.classList.add('cover');
  setTimeout(() => { location.href = href; }, 620);
}
// arriving from another page of this site
(() => {
  const raw = store.get('ja-nav', sessionStorage);
  if (!raw) return;
  store.del('ja-nav', sessionStorage);
  try { const { name, num } = JSON.parse(raw); showCurtain(num, name); } catch { /* ignore */ }
  requestAnimationFrame(() => setTimeout(() => {
    curtain.classList.add('lift');
    document.documentElement.classList.remove('arriving');
    setTimeout(() => curtain.classList.remove('lift'), 900);
  }, 120));
})();
window.addEventListener('pageshow', (e) => { if (e.persisted) { curtain.classList.remove('cover', 'lift'); document.documentElement.classList.remove('arriving'); } });

function bindLinks(root = document) {
  root.querySelectorAll('a[href]').forEach((a) => {
    if (a.dataset.bound) return;
    a.dataset.bound = '1';
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      if (href.startsWith('#')) {
        const t = document.querySelector(href);
        if (t) { e.preventDefault(); closeMenu(); lenis.scrollTo(t, { offset: -70, duration: 1.1 }); history.replaceState(null, '', href); }
        return;
      }
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      const samePage = url.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') === location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
      if (samePage) {
        if (url.hash) { const t = document.querySelector(url.hash); if (t) { e.preventDefault(); closeMenu(); lenis.scrollTo(t, { offset: -70 }); } }
        else { e.preventDefault(); closeMenu(); lenis.scrollTo(0); }
        return;
      }
      e.preventDefault();
      closeMenu();
      goPage(href, a.dataset.dest || a.textContent.trim(), a.dataset.destnum || '');
    });
  });
}
export { bindLinks };

/* ---------- jump to hash after load (e.g. /work.html#contact) ---------- */
export function scrollToHashSoon() {
  if (!location.hash) return;
  const t = document.querySelector(location.hash);
  if (t) setTimeout(() => lenis.scrollTo(t, { offset: -70, immediate: true }), 400);
}

/* ---------- clock ---------- */
const clock = document.getElementById('clock');
const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' });
const tick = () => { clock.textContent = 'MNL ' + fmt.format(new Date()); };
tick(); setInterval(tick, 15000);

/* ---------- theme (remembered across pages) ---------- */
const themeBtn = document.getElementById('themeBtn');
function applyTheme(next) {
  document.documentElement.setAttribute('data-theme', next);
  document.body.setAttribute('data-theme', next);
  const light = next === 'light';
  document.getElementById('themeIc').innerHTML = ICONS[light ? 'moon' : 'sun'];
  themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  themeBtn.title = light ? 'Dark mode' : 'Light mode';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#F6F3FF' : '#0A0E27');
  store.set('ja-theme', next);
}
applyTheme(store.get('ja-theme') || 'dark');
themeBtn.addEventListener('click', () => {
  const toLight = document.documentElement.getAttribute('data-theme') !== 'light';
  themeTransition(toLight, () => applyTheme(toLight ? 'light' : 'dark'));
});

/* ---------- sound dropdown (remembered; resumes on first tap of the next page) ---------- */
(() => {
  const wrap = document.getElementById('soundMenu');
  const btn = document.getElementById('soundBtn');
  const list = document.getElementById('soundList');
  const label = document.getElementById('soundLabel');
  const nameOf = (id) => (PALETTES.find((p) => p[0] === id) || ['off', 'Off'])[1];
  list.innerHTML = PALETTES.map(([id, name]) => `<li role="option" tabindex="0" data-id="${id}" aria-selected="false">${name}</li>`).join('');
  const mark = (id) => {
    label.textContent = id === 'off' ? 'Off' : nameOf(id);
    list.querySelectorAll('li').forEach((li) => li.setAttribute('aria-selected', String(li.dataset.id === id)));
  };
  const close = () => { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  const saved = store.get('ja-sound') || 'off';
  mark(saved);
  if (saved !== 'off') {
    const resume = () => { setPalette(saved); window.removeEventListener('pointerdown', resume, true); window.removeEventListener('keydown', resume, true); };
    window.addEventListener('pointerdown', resume, true);
    window.addEventListener('keydown', resume, true);
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); const o = wrap.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
  const choose = (li) => { const id = li.dataset.id; setPalette(id); store.set('ja-sound', id); mark(id); close(); };
  list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) { e.stopPropagation(); choose(li); } });
  list.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.id) { e.preventDefault(); choose(e.target); } if (e.key === 'Escape') close(); });
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('click', () => { if (isOn()) clickSound(); }, true);
})();

/* ---------- cursor (desktop only) ---------- */
if (finePointer) {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = innerWidth / 2, my = innerHeight / 2;
  addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  gsap.ticker.add(() => { gsap.set(dot, { x: mx, y: my }); rx(mx); ry(my); });
  document.addEventListener('mouseover', (e) => {
    const hit = e.target.closest('a, button, .chip, input, .fav, .door');
    ring.classList.toggle('big', !!hit);
  });
} else {
  document.getElementById('cursorDot')?.remove();
  document.getElementById('cursorRing')?.remove();
}

/* ---------- small helpers used by pages ---------- */
export function magnetic(root = document) {
  if (!finePointer) return;
  root.querySelectorAll('.magnetic').forEach((b) => {
    b.addEventListener('mousemove', (e) => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3 });
    });
    b.addEventListener('mouseleave', () => gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
  });
}
export function paintHover(root = document) {
  if (!finePointer) return;
  root.querySelectorAll('.paint-hover').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });
}
export function reveals() {
  if (reduceMotion) return;
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

injectIcons();
bindLinks();
magnetic();
