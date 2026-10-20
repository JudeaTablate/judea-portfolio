import gsap from 'gsap';
import AVATAR_SVG from './assets/avatar-judea.svg?raw';

// Chibi Judea hops between screen edges as you scroll, lands on little clouds, strikes a pose.
const STOPS = [[0.02, 1], [0.98, 1], [0.02, 0.5], [0.98, 0.3], [0.5, 1], [0.02, 0.25], [0.98, 0.6], [0.9, 1]];
const CLOUD = `<svg viewBox="0 0 120 40" aria-hidden="true"><path d="M14 36 Q2 36 4 26 Q6 18 16 20 Q18 6 34 8 Q44 -2 58 6 Q74 0 82 12 Q98 8 104 20 Q118 22 116 32 Q114 38 104 36Z" fill="#fff" stroke="#ffc2e0" stroke-width="3"/></svg>`;

export function initAvatar(lenis) {
  const host = document.createElement('div');
  host.id = 'walker';
  host.setAttribute('aria-label', 'Animated avatar of Judea hopping around the page as you scroll');
  host.setAttribute('role', 'img');
  host.innerHTML = `<div class="walker-cloud">${CLOUD}</div><div class="walker-hop"><div class="walker-squash"><div class="walker-flip">${AVATAR_SVG}</div></div></div>`;
  document.body.appendChild(host);
  const $ = (s) => host.querySelector(s);
  const hop = $('.walker-hop'), squash = $('.walker-squash'), flip = $('.walker-flip'), cloud = $('.walker-cloud');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let idx = -1, dir = 1, tl, poseT;
  const spot = (i) => {
    const w = host.offsetWidth, h = host.offsetHeight;
    const fw = window.innerWidth - w - 6;
    const top = window.innerWidth < 700 ? 0.5 : 0.18;       // keep clear of the header on phones
    const fh = window.innerHeight - h - 8;
    const [fx, fy] = STOPS[i];
    return { x: 3 + fx * fw, y: top * fh + (fy - 0) * (1 - top) * fh * 1, high: fy < 0.9 };
  };
  const place = (i) => { const s = spot(i); gsap.set(host, { x: s.x, y: s.y }); gsap.set(cloud, { opacity: s.high ? 1 : 0 }); };

  function goTo(i) {
    if (i === idx) return;
    const first = idx < 0;
    idx = i;
    const s = spot(i);
    if (first || reduce) { place(i); return; }
    tl && tl.kill(); clearTimeout(poseT);
    const fromX = gsap.getProperty(host, 'x'), fromY = gsap.getProperty(host, 'y');
    const dist = Math.hypot(s.x - fromX, s.y - fromY);
    const d = Math.min(1.3, 0.6 + dist / 1400);
    const nd = s.x >= fromX ? 1 : -1;
    if (nd !== dir) { dir = nd; gsap.to(flip, { scaleX: dir, duration: 0.2 }); }
    host.classList.remove('posing');
    tl = gsap.timeline()
      .to(cloud, { opacity: 0, scale: 0.6, duration: 0.15 }, 0)
      .to(squash, { scaleY: 0.86, scaleX: 1.1, duration: 0.14, ease: 'power1.out' }, 0)
      .add(() => host.classList.add('jumping'), 0.14)
      .to(squash, { scaleY: 1.08, scaleX: 0.94, duration: 0.12 }, 0.14)
      .to(host, { x: s.x, duration: d, ease: 'power1.inOut' }, 0.14)
      .to(host, { y: s.y, duration: d, ease: 'power2.inOut' }, 0.14)
      .to(hop, { y: -Math.max(70, dist * 0.22), duration: d / 2, ease: 'power2.out' }, 0.14)
      .to(hop, { y: 0, duration: d / 2, ease: 'power2.in' }, 0.14 + d / 2)
      .add(() => host.classList.remove('jumping'), 0.14 + d)
      .to(squash, { scaleY: 0.84, scaleX: 1.12, duration: 0.1, ease: 'power1.in' }, 0.14 + d)
      .to(squash, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1,0.4)' }, 0.24 + d)
      .add(() => {
        host.classList.add('posing');
        if (s.high) gsap.fromTo(cloud, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' });
        poseT = setTimeout(() => host.classList.remove('posing'), 1900);
      }, 0.2 + d);
  }

  const progress = () => {
    const doc = document.documentElement;
    return Math.min(0.9999, Math.max(0, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)));
  };
  const update = () => goTo(Math.floor(progress() * STOPS.length));
  lenis.on('scroll', update);
  window.addEventListener('resize', () => { if (idx >= 0) place(idx); });
  update();
  if (idx < 0) goTo(0);
}
