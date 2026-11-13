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
  if (reduceMotion) { gsap.set('.hero .word', { y: '0%' }); gsap.set('.hero-sub, .hero-ctas, .hero-visual, .door', { opacity: 1 }); return; }
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.hero .word', { y: '0%', duration: 1, stagger: 0.06 })
    .to('.hero-sub', { opacity: 1, duration: 0.6 }, '-=0.5')
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
  const letters = [...loader.querySelectorAll('.ld-l')];
  const hiEl = document.getElementById('ldHi');
  const stEl = document.getElementById('ldStatus');
  const HI = ['Hi', 'Kumusta', 'Hola', 'Bonjour', 'こんにちは', '안녕', '你好', 'Ciao'];
  const STATUS = ['booting systems', 'warming up neurons', 'compiling vibes', 'almost there', 'ready'];
  let p = 0, hi = 0;
  const hiT = setInterval(() => { hi = (hi + 1) % HI.length; hiEl.textContent = HI[hi]; }, 420);
  const t = setInterval(() => {
    p = Math.min(100, p + 4 + Math.random() * 12);
    fill.style.width = p + '%';
    pctEl.textContent = String(Math.floor(p)).padStart(3, '0');
    letters.forEach((el, i) => el.style.setProperty('--p', Math.max(0, Math.min(100, p * 1.5 - i * 22))));
    stEl.textContent = STATUS[Math.min(STATUS.length - 1, Math.floor(p / 25))];
    if (p >= 100) {
      clearInterval(t);
      setTimeout(() => { clearInterval(hiT); loader.classList.add('hide'); setTimeout(playHeroIntro, 450); setTimeout(() => loader.remove(), 1500); }, 400);
    }
  }, 130);
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
setTimeout(() => buddy && buddy.say('hiii, tap me', 2400), seen ? 1600 : 4200);

paintHover();
