import gsap from 'gsap';
import AVATAR_SVG from './assets/avatar-judea.svg?raw';

// Mini Ja: a small mascot. Eyes follow the cursor, hover = wave, click/tap = hop + a new line.
// roam(): she hides *behind* a card and peeks out of its edges (top / left / right),
// waving, pointing at things, playing peekaboo. Because she is layered under the card,
// only the bit that pokes out past an edge is ever visible, and every spot is checked
// against the viewport and an "avoid" list so she never sits on top of content.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const R2D = 180 / Math.PI;
const SHOULDER = { x: 128, y: 122 }; // front shoulder in the 200x290 viewBox
const ARM_REST = Math.atan2(62, 12); // the arm hangs slightly outward, not straight down
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function mountBuddy(host, { lines = [], size } = {}) {
  if (!host) return null;
  host.classList.add('buddy');
  if (size) host.style.setProperty('--bsize', size);
  host.innerHTML = `
    <div class="buddy-bubble" role="status" aria-live="polite"></div>
    <button class="buddy-btn" type="button" aria-label="Mini Judea. Tap her to say hi.">
      <span class="buddy-pose"><span class="buddy-face"><span class="buddy-hop">${AVATAR_SVG.replace(/role="img"[^>]*?aria-label="[^"]*"/, 'aria-hidden="true" focusable="false"')}</span></span></span>
    </button>`;
  const bubble = host.querySelector('.buddy-bubble');
  const btn = host.querySelector('.buddy-btn');
  const pose = host.querySelector('.buddy-pose');
  const face = host.querySelector('.buddy-face');
  const look = host.querySelector('.av-look');
  let li = 0, hideT, hopT, facing = 1, spot = null; // spot = where she is peeking right now (roam mode)

  const say = (text, ms = 2600) => {
    bubble.textContent = text;
    if (spot) placeBubble(spot);
    host.classList.add('talking');
    clearTimeout(hideT);
    hideT = setTimeout(() => host.classList.remove('talking'), ms);
  };
  const hush = () => { clearTimeout(hideT); host.classList.remove('talking'); };
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
  let visible = false, raf = 0, px = 0, py = 0, gazeUntil = 0; // gazeUntil: eyes locked on something she's showing you
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; host.classList.toggle('paused', !visible); }).observe(host);
  window.addEventListener('pointermove', (e) => {
    if (!visible || raf || performance.now() < gazeUntil) return;
    px = e.clientX; py = e.clientY;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = btn.getBoundingClientRect();
      const dx = (px - (r.left + r.width / 2)) * facing, dy = py - (r.top + r.height * 0.3);
      const d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 300) * 3.2;
      look.setAttribute('transform', `translate(${(dx / d) * m} ${(dy / d) * m})`);
    });
  }, { passive: true });

  /* ---------- pointing ---------- */
  // arm rotation (deg) that aims the front hand at the centre of `el`
  function armAngle(el, lean = 0) {
    const t = el.getBoundingClientRect(), r = btn.getBoundingClientRect(), s = r.width / 200;
    // her shoulder on screen: the body leans (rotates) around the bottom centre of her box
    const b = lean / R2D, lx = (SHOULDER.x - 100) * facing * s, ly = (SHOULDER.y - 290) * s;
    const sx = r.left + r.width / 2 + lx * Math.cos(b) - ly * Math.sin(b);
    const sy = r.bottom + lx * Math.sin(b) + ly * Math.cos(b);
    let dx = t.left + t.width / 2 - sx, dy = t.top + t.height / 2 - sy;
    const a = -lean / R2D; // undo the body lean, then the mirror flip
    [dx, dy] = [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)];
    let deg = (Math.atan2(dy, dx * facing) - ARM_REST) * R2D;
    deg = ((deg + 540) % 360) - 180;
    return Math.max(-172, Math.min(20, deg));
  }
  // point + little jabs, then relax. Returns a timeline so roam() can sequence it.
  function pointTl(el, { lean = 0, hold = 1.4, glow = true } = {}) {
    const tl = gsap.timeline();
    tl.call(() => {
      const deg = armAngle(el, lean);
      gsap.timeline()
        .to(host, { '--arm': `${deg}deg`, duration: 0.32, ease: 'back.out(3)' })
        .to(host, { '--arm': `${deg + 9}deg`, duration: 0.11, yoyo: true, repeat: 3, ease: 'sine.inOut' })
        .to(host, { '--head': `${facing * 7}deg`, duration: 0.25 }, 0);
      if (glow) { // buttons/cards get a ring, plain text gets a soft text glow
        const cls = el.matches('a, button, .btn, .cert-card, .tech-tile, .win-card') ? 'buddy-pointed' : 'buddy-pointed-text';
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 1400);
      }
    });
    tl.to({}, { duration: 0.32 + 0.11 * 4 + hold });
    tl.to(host, { '--arm': '0deg', '--head': '0deg', duration: 0.35, ease: 'power2.inOut' });
    return tl;
  }
  function pointAt(el, opts) {
    if (reduce || !el || !btn.offsetParent) return;
    pointTl(el, { glow: false, ...opts });
  }

  /* ---------- roaming / peeking ---------- */
  function placeBubble(g) {
    if (g.crown) { // screen-edge peek: just above her tilted head, leaning into the page
      bubble.style.maxWidth = '210px';
      const bw = bubble.offsetWidth, bh = bubble.offsetHeight, left = g.side === 'left';
      bubble.style.left = `${Math.max(8, Math.min(innerWidth - 8 - bw, left ? g.crown.x - 6 : g.crown.x - bw + 6))}px`;
      bubble.style.top = `${Math.max(8, g.crown.y - bh - 8)}px`;
      bubble.dataset.tail = left ? 'l' : 'r';
      return;
    }
    bubble.style.maxWidth = g.free ? `${g.free}px` : ''; // measure at the width it will have
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, w = btn.offsetWidth;
    const hx = g.vis.x + w / 2;
    // tail 'r' = bubble sits to her left, 'l' = to her right (the bubble's tail corner points at her)
    let tail = g.tail || (g.edge === 'left' ? 'r' : 'l');
    let left = g.edge === 'top' ? hx + w * 0.2 : tail === 'r' ? hx + 14 - bw : hx - 14;
    // keep it on screen
    const pr = host.getBoundingClientRect();
    if (pr.left + left + bw > innerWidth - 8) { left = hx - w * 0.2 - bw; tail = 'r'; }
    left = Math.max(8 - pr.left, Math.min(left, innerWidth - 8 - pr.left - bw));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${g.vis.y - bh + (g.edge === 'top' ? 4 : -6)}px`;
    bubble.dataset.tail = tail;
  }

  function roam({ stage, stops, avoid = '', bounds, start = 1.2 }) {
    if (reduce || !stage || !stops.length) return;
    host.classList.add('roam');
    stage.classList.add('buddy-stage');
    const parent = host.parentElement;
    let i = -1, tl, wait, onScreen = true;
    const hit = (a, b, pad = 6) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;

    // where she pops out to / hides at for a stop, or null if that spot would cover something
    function geom(s) {
      const W = stage.offsetWidth, H = stage.offsetHeight, sx = stage.offsetLeft, sy = stage.offsetTop;
      const w = btn.offsetWidth, h = btn.offsetHeight;
      const pr = parent.getBoundingClientRect();
      let g;
      if (s.edge === 'top') {
        const x = sx + Math.max(w * 0.1, Math.min(W - w * 1.1, s.at * W - w / 2));
        // rise as far as the room above allows: at least head + shoulders, at most down to the waist
        const room = bounds ? pr.top + sy - bounds.getBoundingClientRect().top - 6 : h;
        const rise = Math.min(h * 0.6, room);
        if (rise < h * 0.44) return null;
        g = { vis: { x, y: sy - rise }, hid: { x, y: sy + h * 0.14 }, face: s.face || 1, lean: 0, box: { x, y: sy - rise, w, h: rise } };
      } else {
        const left = s.edge === 'left';
        const y = sy + Math.max(H * 0.06, Math.min(H - h - H * 0.1, s.at * H - h / 2));
        const room = left ? pr.left + sx - 6 : innerWidth - (pr.left + sx + W) - 6;
        // lean out when there is room; on narrow screens peek straight, just an eye and a bit of face
        let lean = 7, tilt = h * 0.85 * Math.sin(lean / R2D); // tilt = how far the head swings past the edge
        if (room - tilt < w * 0.32) { lean = 0; tilt = 0; }
        const depth = Math.min(w * 0.46, room - tilt);
        if (depth < w * 0.24) return null;
        const vx = left ? sx - depth : sx + W - w + depth;
        g = {
          vis: { x: vx, y }, hid: { x: left ? sx + w * 0.16 : sx + W - w * 1.16, y },
          face: left ? -1 : 1, lean: left ? -lean : lean,
          box: { x: left ? sx - depth - tilt : sx + W, y, w: depth + tilt, h },
        };
      }
      g.edge = s.edge;
      // the part that shows, in viewport coords
      const v = { left: pr.left + g.box.x, top: pr.top + g.box.y, right: pr.left + g.box.x + g.box.w, bottom: pr.top + g.box.y + g.box.h };
      if (v.left < 4 || v.right > innerWidth - 4) return null;
      if (bounds) { const b = bounds.getBoundingClientRect(); if (v.top < b.top + 4 || v.left < b.left || v.right > b.right) return null; }
      if (avoid) for (const el of document.querySelectorAll(avoid)) { const r = el.getBoundingClientRect(); if (r.width && hit(v, r)) return null; }
      if (s.target) { const t = typeof s.target === 'string' ? document.querySelector(s.target) : s.target; if (!t || !t.getClientRects().length) return null; g.target = t; }
      return g;
    }

    const setFace = (f) => { facing = f; gsap.set(face, { scaleX: f }); };

    function act(s, g) {
      const t = gsap.timeline();
      const lean = g.lean;
      switch (s.act) {
        case 'point':
          t.add(pointTl(g.target, { lean, hold: 1.2 }));
          break;
        case 'peekaboo': // duck back in, then burst out again
          t.to(host, { '--head': `${g.face * -12}deg`, duration: 0.25 })
            .to(btn, { x: g.hid.x, y: g.hid.y, duration: 0.2, ease: 'power3.in' }, '+=0.5')
            .to(host, { '--head': '0deg', duration: 0.01 })
            .to(btn, { x: g.vis.x, y: g.vis.y, duration: 0.42, ease: 'back.out(3.2)' }, '+=0.45')
            .fromTo(pose, { scaleY: 1.14, scaleX: 0.9 }, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1,0.35)' }, '<')
            .call(() => host.classList.add('waving'))
            .call(() => host.classList.remove('waving'), null, '+=1.3');
          break;
        case 'look': // curious head turns, side to side
          t.to(host, { '--head': '-11deg', duration: 0.35, ease: 'power2.inOut' })
            .to(host, { '--head': '11deg', duration: 0.5, ease: 'power2.inOut' }, '+=0.35')
            .to(host, { '--head': '0deg', duration: 0.35, ease: 'power2.inOut' }, '+=0.35');
          break;
        default: // wave
          t.call(() => host.classList.add('waving'))
            .to(host, { '--head': `${g.face * 8}deg`, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
            .call(() => host.classList.remove('waving'), null, 1.7);
      }
      return t;
    }

    function next() {
      wait = null;
      if (!onScreen) return;
      let s, g;
      for (let n = 0; n < stops.length && !g; n++) { i = (i + 1) % stops.length; s = stops[i]; g = geom(s); }
      if (!g) { wait = gsap.delayedCall(2, next); return; } // nothing fits right now, stay hidden

      const prev = spot;
      spot = null;
      tl = gsap.timeline({ onComplete: () => { wait = gsap.delayedCall(rand(1.4, 2.6), next); } });
      if (prev) { // anticipation squash, then duck behind the card
        tl.call(hush)
          .to(pose, { scaleY: 0.88, scaleX: 1.08, duration: 0.1, ease: 'power1.out' })
          .to(btn, { x: prev.hid.x, y: prev.hid.y, duration: 0.26, ease: 'back.in(1.8)' })
          .to(pose, { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.15 }, '<')
          .to(host, { '--arm': '0deg', '--armb': '0deg', '--head': '0deg', duration: 0.15 }, '<');
      } else {
        tl.set(btn, { x: g.hid.x, y: g.hid.y });
      }
      // sneak along behind it (out of sight) to the next edge
      tl.to(btn, { x: g.hid.x, y: g.hid.y, duration: prev ? 0.55 : 0, ease: 'power2.inOut' }, prev ? '+=0.25' : 0)
        .call(() => setFace(g.face))
        .set(pose, { rotation: g.lean })
        // pop out: stretch, overshoot, wobble to rest
        .to(pose, { scaleY: 0.86, scaleX: 1.1, duration: 0.12 }, '+=0.15')
        .to(btn, { x: g.vis.x, y: g.vis.y, duration: 0.46, ease: 'back.out(2.4)' })
        .fromTo(pose, { scaleY: 1.12, scaleX: 0.92 }, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1,0.35)' }, '<')
        .call(() => { spot = g; if (s.say) say(s.say, 2600); });
      if (g.edge === 'top') tl.to(host, { '--armb': '52deg', '--arm': '-52deg', duration: 0.3, ease: 'back.out(2)' }, '<'); // hands on the ledge
      tl.add(act(s, g), '+=0.15');
      if (g.edge === 'top') tl.to(host, { '--armb': '52deg', '--arm': '-52deg', duration: 0.25 });
      tl.to({}, { duration: s.hold ?? rand(1.6, 2.6) });
    }

    // only run while the stage is on screen; re-check spots on resize
    let started = false;
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (tl) onScreen ? tl.resume() : tl.pause();
      if (started && onScreen && !wait && !(tl && tl.isActive())) next();
    }).observe(stage);
    const hide = () => gsap.set(btn, { x: stage.offsetLeft + stage.offsetWidth / 2 - btn.offsetWidth / 2, y: stage.offsetTop + stage.offsetHeight / 3 });
    let rz;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => { // layout changed, so her spot might now cover something: hide and restart
        if (!started) return;
        tl && tl.kill(); wait && wait.kill(); wait = null; hush();
        spot = null; hide();
        gsap.set(pose, { rotation: 0, scaleX: 1, scaleY: 1 });
        gsap.set(host, { '--arm': '0deg', '--armb': '0deg', '--head': '0deg' });
        wait = gsap.delayedCall(0.8, next);
      }, 200);
    });

    hide();
    wait = gsap.delayedCall(start, () => { wait = null; started = true; next(); });
  }

  /* ---------- screen-edge mode (long pages) ---------- */
  // She hides just past the left or right edge of the screen and peeks around it like it's a
  // door frame: her feet stay out of sight and she pivots on them, so her head tilts into view
  // with her whole face showing. She sneaks a look first, flinches, then pops out, looks at
  // something in the section you're reading and points at it (sometimes she plays peekaboo).
  // She comes out once scrolling settles, stays out between actions, and ducks away only
  // while you scroll on.
  const LEAN = 30; // how far she tilts around the edge, in degrees
  const OFF = 56;  // her pivot sits this far past the edge (viewBox units): fully hidden when upright
  function peekScreen({ sections, avoid = '', top = 68 }) {
    if (reduce) return { onSection() {} };
    host.classList.add('screen');
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const inView = (r) => r.width > 0 && r.top >= top + 10 && r.bottom <= innerHeight - 40;
    const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    let tl = null, idleT = 0, sec = null, n = 0, enterPending = false, active = null, startY = 0, held = false;

    // a point of the avatar (viewBox coords) -> screen offset from her pivot, for a given tilt/facing
    function rot(px, py, deg, f, s) {
      const a = deg / R2D, dx = (px - 100) * f * s, dy = (py - 290) * s;
      return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
    }

    // where she peeks from to look at `target`, scored by how much page content she'd cover
    function geom(target, side, blockers) {
      const w = btn.offsetWidth, h = btn.offsetHeight, s = w / 200, t = target.getBoundingClientRect();
      const left = side === 'left', f = left ? 1 : -1, lean = left ? LEAN : -LEAN;
      const head = rot(100, 78, lean, f, s), crown = rot(100, 17, lean, f, s);
      // line her head up with the target, keeping room above it for the speech bubble
      const py = clamp(t.top + t.height / 2 - head.y, top + 64 - crown.y, innerHeight + 30 * s);
      const px = left ? -OFF * s : innerWidth + OFF * s;
      const reach = 96 * s; // how far into the page her head and shoulders get
      const box = { left: left ? 0 : innerWidth - reach, right: left ? reach : innerWidth, top: py + crown.y, bottom: py - 40 * s };
      const area = (box.right - box.left) * (box.bottom - box.top);
      const cover = blockers.reduce((sum, r) => sum + overlap(box, r), 0) / area;
      return {
        side, face: f, lean, cover, target,
        pivot: { x: px, y: py },
        vis: { x: px - w / 2, y: py - h }, hid: { x: px - w / 2 + (left ? -w * 0.15 : w * 0.15), y: py - h },
        crown: { x: px + crown.x, y: py + crown.y },
      };
    }

    function lookAt(el, ms) { // eyes on the thing she's about to point at
      const t = el.getBoundingClientRect(), r = look.getBoundingClientRect();
      let dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2);
      const a = -(active ? active.lean : 0) / R2D;
      [dx, dy] = [(dx * Math.cos(a) - dy * Math.sin(a)) * facing, dx * Math.sin(a) + dy * Math.cos(a)];
      const d = Math.hypot(dx, dy) || 1;
      look.setAttribute('transform', `translate(${(dx / d) * 3.4} ${(dy / d) * 3.4})`);
      gazeUntil = performance.now() + ms;
    }

    function retreat(t = gsap.timeline(), g = active) {
      if (!g) return t;
      return t.call(() => { spot = null; hush(); host.classList.remove('waving'); })
        .to(host, { '--arm': '0deg', '--armb': '0deg', '--head': '0deg', duration: 0.15 })
        .to(pose, { rotation: 0, duration: 0.32, ease: 'back.in(1.6)' }, '<')
        .to(btn, { x: g.hid.x, duration: 0.18, ease: 'power2.in' }, '>-0.06')
        .call(() => { active = null; });
    }

    // Once she's out she stays parked at the edge between actions. If the next thing to point at
    // is reachable from where she already is, she just turns to it; otherwise she ducks out and
    // peeks in again at the new spot. `leave` = go back into hiding afterwards (thin margins).
    function show(g, { line, hold = 1.4, after, peekaboo, leave } = {}) {
      tl && tl.kill();
      tl = gsap.timeline({ onComplete: () => { tl = null; after && after(); } });
      const L = g.lean;
      const stay = active && active.side === g.side && Math.abs(active.pivot.y - g.pivot.y) < 70;
      if (stay) {
        g = { ...active, target: g.target, cover: g.cover };
        tl.call(() => { active = g; spot = g; lookAt(g.target, 2600); if (line) say(line, 2600 + hold * 700); })
          .to(pose, { rotation: L, scaleX: 1, scaleY: 1, duration: 0.25 }) // in case she was interrupted mid-move
          .to(host, { '--head': '-8deg', duration: 0.25, ease: 'power2.out' }, '<')
          .to(host, { '--head': '3deg', duration: 0.3, ease: 'back.out(2)' });
      } else {
        retreat(tl);
        tl.call(() => { active = g; facing = g.face; gsap.set(face, { scaleX: g.face }); })
          .set(btn, { x: g.hid.x, y: g.hid.y })
          .set(pose, { rotation: 0, scaleX: 1, scaleY: 1 })
          .set(host, { '--arm': '0deg', '--armb': '0deg', '--head': '0deg' })
          // sneak: creep up to the edge and lean out just enough for one eye
          .to(btn, { x: g.vis.x, duration: 0.3, ease: 'power1.out' })
          .to(pose, { rotation: L * 0.42, duration: 0.6, ease: 'power2.out' }, '<0.1')
          .to(host, { '--head': '-9deg', duration: 0.4, ease: 'power2.out' }, '<')
          .call(() => lookAt(g.target, 2600))
          .to({}, { duration: 0.55 })
          // flinch back... then pop out all the way, with a springy wobble
          .to(pose, { rotation: L * 0.22, duration: 0.14, ease: 'power2.in' })
          .to(pose, { rotation: L, duration: 0.95, ease: 'elastic.out(1,0.42)' })
          .fromTo(face, { scaleY: 0.9 }, { scaleY: 1, duration: 0.7, ease: 'elastic.out(1,0.35)' }, '<')
          .to(host, { '--head': '4deg', duration: 0.35, ease: 'back.out(2)' }, '<')
          .call(() => { spot = g; if (line) say(line, 2600 + hold * 700); });
      }
      tl.call(() => { startY = scrollY; });
      tl.add(pointTl(g.target, { lean: L, hold }), '+=0.05');
      if (peekaboo) { // duck out of sight, then burst back in waving
        tl.call(hush)
          .to(pose, { rotation: 0, duration: 0.22, ease: 'back.in(2)' }, '+=0.1')
          .to(host, { '--head': '0deg', duration: 0.2 }, '<')
          .to({}, { duration: 0.6 })
          .to(pose, { rotation: L, duration: 0.8, ease: 'elastic.out(1,0.4)' })
          .call(() => { host.classList.add('waving'); say(pick(['peekaboo!', 'boo!', 'hehe'])); })
          .to(host, { '--head': '-7deg', duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' })
          .call(() => host.classList.remove('waving'));
      } else {
        tl.to(host, { '--head': '-6deg', duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut' }); // little head bob
      }
      tl.to(host, { '--head': '0deg', duration: 0.3 });
      if (leave) { tl.to({}, { duration: 0.5 }); retreat(tl, g); }
    }

    // peek at something in the current section from whichever edge covers the least
    function idlePeek() {
      idleT = 0;
      if (!sec || tl || held) return;
      const firstTime = enterPending;
      const visibleOf = (sel) => (sel ? [...document.querySelectorAll(sel)] : []).filter((el) => inView(el.getBoundingClientRect()));
      // just entered a section: point at its title if it's on screen, otherwise at anything in it
      const els = (firstTime && visibleOf(sec.title).length) ? visibleOf(sec.title) : visibleOf(sec.targets);
      if (!els.length) { idleT = setTimeout(idlePeek, 2000); return; }
      const blockers = avoid ? [...document.querySelectorAll(avoid)].map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.bottom > 0 && r.top < innerHeight) : [];
      const el = els[n % els.length];
      // the edge where she'd cover the least (a coin flip when both are clear)
      const g = ['left', 'right'].map((s) => geom(el, s, blockers)).sort((a, b) => (a.cover - b.cover) || (Math.random() - 0.5))[0];
      n += 1; enterPending = false;
      // where the margins are thin she'd overlap the page, so there she pops back in after each peek
      const thin = g.cover > 0.15;
      show(g, {
        line: firstTime ? sec.enter : pick(sec.lines),
        peekaboo: !firstTime && Math.random() < 0.3,
        leave: thin,
        after: () => { idleT = setTimeout(idlePeek, thin ? rand(5000, 7000) : rand(4500, 7000)); },
      });
    }

    const onScroll = () => {
      // small nudges are fine; a real scroll and she ducks away
      if (active && Math.abs(scrollY - startY) > 140) { tl && tl.kill(); tl = null; retreat(); }
      clearTimeout(idleT);
      idleT = setTimeout(idlePeek, 1000);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { if (active) { tl && tl.kill(); tl = null; retreat(); } onScroll(); });

    // hovering her holds her still (mid-move too) so she's easy to click
    btn.addEventListener('pointerenter', () => { held = true; tl && tl.pause(); clearTimeout(idleT); });
    btn.addEventListener('pointerleave', () => {
      held = false;
      if (tl) tl.resume(); else { clearTimeout(idleT); idleT = setTimeout(idlePeek, 2500); }
    });
    gsap.set(btn, { x: -btn.offsetWidth * 2, y: innerHeight / 2 });

    return {
      onSection(id) {
        if (!sections[id] || sec === sections[id]) return;
        sec = sections[id]; n = 0; enterPending = true;
        if (!tl) { clearTimeout(idleT); idleT = setTimeout(idlePeek, 900); }
      },
    };
  }

  return { say, hop, pointAt, roam, peekScreen };
}
