import '@fontsource/pacifico/400.css';
import { gsap, store, reduceMotion, paintHover } from './shared.js';
import { initNeuralScene } from './three-scene.js';
import { initBinaryPhoto } from './binary-photo.js';
import { mountBuddy } from './buddy.js';

/* ---------- hero title: wrap words for the stagger reveal ---------- */
const heroTitle = document.getElementById('heroTitle');
heroTitle.innerHTML = heroTitle.innerHTML.split(/(<br>)/).map((chunk) => {
  if (chunk === '<br>') return chunk;
  return chunk.replace(/(<span class="grad">)(.*?)(<\/span>)|(\S+)/g, (m, open, inner, close, plain) => {
    if (plain) return `<span class="word">${plain}</span> `;
    return `${open}${inner.split(' ').map((w) => `<span class="word">${w}</span>`).join(' ')}${close}`;
  });
}).join('');

function playHeroIntro() {
  if (reduceMotion) { gsap.set('.hero .word', { y: '0%' }); gsap.set('.hero-sub, .hero-ctas, .hero-visual, .door, .award-pill', { opacity: 1 }); return; }
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.hero .word', { y: '0%', duration: 1, stagger: 0.06 })
    .to('.hero-sub', { opacity: 1, duration: 0.6 }, '-=0.5')
    .to('.award-pill', { opacity: 1, duration: 0.5 }, '-=0.45')
    .to('.hero-ctas', { opacity: 1, duration: 0.6 }, '-=0.4')
    .fromTo('.hero-visual', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.7')
    .fromTo('.door', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, '-=0.5');
}

/* ---------- loader: only on the first visit of a session ---------- */
const loader = document.getElementById('loader');
const seen = store.get('ja-loaded', sessionStorage) || document.documentElement.classList.contains('arriving');
if (seen || reduceMotion) {
  loader.remove();
  setTimeout(playHeroIntro, 150);
} else {
  store.set('ja-loaded', '1', sessionStorage);
  const fill = document.getElementById('loadFill');
  const pctEl = document.getElementById('loadPct');
  const liquid = document.getElementById('ldLiquid');
  const hiEl = document.getElementById('ldHi');
  const stEl = document.getElementById('ldStatus');
  const HI = ['Hi', 'Kumusta', 'Hola', 'Bonjour', 'こんにちは', '안녕', '你好', 'Ciao'];
  const STATUS = ['filling up', 'warming up neurons', 'making waves', 'almost full', 'ready'];
  const EMPTY = 262, FULL = 4; // liquid y in the SVG: below the letters -> above them
  let target = 0, shown = 0, hi = 0, done = false;
  const hiT = setInterval(() => { hi = (hi + 1) % HI.length; hiEl.textContent = HI[hi]; }, 420);
  // the "real" progress jumps in chunks; the liquid eases toward it so it always flows smoothly
  const step = setInterval(() => { target = Math.min(100, target + 3 + Math.random() * 7); if (target >= 100) clearInterval(step); }, 160);
  const splash = () => {
    const colors = ['#6ff0e0', '#b983ff', '#ff9ecd'];
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('span');
      const ang = (i / 14) * Math.PI * 2, r = 120 + Math.random() * 160;
      d.className = 'ld-drop';
      d.style.cssText = `--c:${colors[i % 3]};--x:${Math.cos(ang) * r}px;--y:${Math.sin(ang) * r * 0.6}px;width:${6 + Math.random() * 10}px;height:${6 + Math.random() * 10}px`;
      loader.querySelector('.ld-content').appendChild(d);
    }
  };
  const tickLoader = () => {
    shown += (target - shown) * 0.06;
    if (target >= 100 && shown > 99.5) shown = 100;
    liquid.setAttribute('transform', `translate(0 ${EMPTY - (EMPTY - FULL) * (shown / 100)})`);
    fill.style.width = shown + '%';
    pctEl.textContent = String(Math.round(shown)).padStart(3, '0');
    stEl.textContent = STATUS[Math.min(STATUS.length - 1, Math.floor(shown / 25))];
    if (shown >= 100 && !done) {
      done = true;
      loader.classList.add('full');
      splash();
      setTimeout(() => { clearInterval(hiT); loader.classList.add('hide'); setTimeout(playHeroIntro, 450); setTimeout(() => loader.remove(), 1500); }, 800);
      return;
    }
    requestAnimationFrame(tickLoader);
  };
  requestAnimationFrame(tickLoader);
}

/* ---------- greeting cycler ---------- */
(() => {
  const el = document.getElementById('greetingWord');
  const g = ['Hi', 'Kumusta', 'Hola', 'Bonjour', 'Ciao', 'Hallo', 'Olá', 'こんにちは', '안녕', 'Namaste', '你好', 'Selamat'];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % g.length;
    gsap.to(el, { opacity: 0, y: -6, duration: 0.22, onComplete: () => { el.textContent = g[i]; gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.32 }); } });
  }, 2400);
})();

/* ---------- background + photo ---------- */
initNeuralScene(document.getElementById('warpCanvas'), document.querySelector('.hero'));
initBinaryPhoto(document.getElementById('binaryPhoto'), ['/judea-poker.jpg', '/judea-jolly.jpg'], document.querySelector('.hero-photo'));

/* ---------- mini Ja ---------- */
const buddy = mountBuddy(document.getElementById('heroBuddy'), {
  lines: [
    'hiii, welcome in',
    'the projects are behind “Enter the work”',
    'yes, the red boots are real',
    'tap me again, i dare you',
    'okay that tickles',
    'off the clock = films, songs, essays',
    'open to internships, just saying',
    'unpaid mascot. for now.',
  ],
});
// she hides behind the instax and peeks out of its edges, pointing at the way in.
// every spot is checked so she never lands on the copy, the buttons, the doors or the header.
buddy && buddy.roam({
  stage: document.querySelector('.hero-visual .instax'),
  bounds: document.querySelector('.hero'),
  avoid: '.hero-copy > *, #siteHeader, .doors',
  start: seen ? 1.6 : 4.2,
  stops: [
    { edge: 'right', at: 0.3, act: 'wave', say: 'hiii, tap me' },
    { edge: 'left', at: 0.3, act: 'point', target: '.hero-ctas .btn.solid', say: 'the projects are in here' },
    { edge: 'top', at: 0.72, act: 'wave' }, // top-edge spots only run when there is room above the photo
    { edge: 'right', at: 0.55, act: 'look' },
    { edge: 'top', at: 0.28, act: 'peekaboo' },
    { edge: 'left', at: 0.62, act: 'point', target: '.hero-ctas .btn.ghost', say: 'films + songs this way' },
    { edge: 'right', at: 0.22, act: 'peekaboo', say: 'boo' },
    { edge: 'top', at: 0.5, act: 'point', target: '.doors .door', say: 'or pick a door' },
  ],
});

paintHover();
