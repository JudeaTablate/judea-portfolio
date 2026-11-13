import AVATAR_SVG from './assets/avatar-judea.svg?raw';

// Mini Ja: a small mascot that lives in one spot (never floats over content).
// Eyes follow the cursor, hover = wave, click/tap = hop + a new line.
// All motion is CSS transforms and pauses whenever she is off screen.
export function mountBuddy(host, { lines = [], size } = {}) {
  if (!host) return null;
  host.classList.add('buddy');
  if (size) host.style.setProperty('--bsize', size);
  host.innerHTML = `
    <div class="buddy-bubble" role="status" aria-live="polite"></div>
    <button class="buddy-btn" type="button" aria-label="Mini Judea. Tap her to say hi.">
      <span class="buddy-hop">${AVATAR_SVG.replace(/role="img"[^>]*?aria-label="[^"]*"/, 'aria-hidden="true" focusable="false"')}</span>
    </button>`;
  const bubble = host.querySelector('.buddy-bubble');
  const btn = host.querySelector('.buddy-btn');
  const look = host.querySelector('.av-look');
  let li = 0, hideT, hopT;

  const say = (text, ms = 2600) => {
    bubble.textContent = text;
    host.classList.add('talking');
    clearTimeout(hideT);
    hideT = setTimeout(() => host.classList.remove('talking'), ms);
  };
  const hop = () => {
    host.classList.remove('hopping');
    void host.offsetWidth; // restart animation
    host.classList.add('hopping');
    clearTimeout(hopT);
    hopT = setTimeout(() => host.classList.remove('hopping'), 650);
  };
  btn.addEventListener('click', () => { hop(); if (lines.length) { say(lines[li % lines.length]); li++; } });
  btn.addEventListener('mouseenter', () => host.classList.add('waving'));
  btn.addEventListener('mouseleave', () => host.classList.remove('waving'));

  // eyes follow pointer, throttled to one update per frame, only while visible
  let visible = false, raf = 0, px = 0, py = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; host.classList.toggle('paused', !visible); }).observe(host);
  window.addEventListener('pointermove', (e) => {
    if (!visible || raf) return;
    px = e.clientX; py = e.clientY;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = btn.getBoundingClientRect();
      const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height * 0.3);
      const d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 300) * 3.2;
      look.setAttribute('transform', `translate(${(dx / d) * m} ${(dy / d) * m})`);
    });
  }, { passive: true });

  return { say, hop };
}
