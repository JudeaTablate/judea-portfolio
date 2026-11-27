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
  let visible = false, raf = 0, px = 0, py = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; host.classList.toggle('paused', !visible); }).observe(host);
  window.addEventListener('pointermove', (e) => {
    if (!visible || raf) return;
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
    const t = el.getBoundingClientRect(), r = btn.getBoundingClientRect();
    const sx = r.left + ((facing > 0 ? SHOULDER.x : 200 - SHOULDER.x) / 200) * r.width;
    const sy = r.top + (SHOULDER.y / 290) * r.height;
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
  // She lives just past the edge of the screen and leans into the empty side margin to point at
  // something in the section you're reading. She only comes out once scrolling settles and ducks
  // away as soon as you scroll. Where the margins are too thin (phones) she pops up from behind
  // `perch` (the "you are here" pill) when you enter a new section instead.
  function peekScreen({ sections, avoid = '', perch, top = 68 }) {
    if (reduce) return { onSection() {} };
    host.classList.add('screen');
    const hit = (a, b, pad = 8) => a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const inView = (r) => r.width > 0 && r.top >= top + 10 && r.bottom <= innerHeight - 80;
    let tl = null, idleT = 0, sec = null, n = 0, enterPending = false, active = null; // active = the peek in progress

    function sideGeom(target, side) {
      const w = btn.offsetWidth, h = btn.offsetHeight, t = target.getBoundingClientRect();
      const left = side === 'left', lean = 7, tilt = h * 0.85 * Math.sin(lean / R2D);
      const y = clamp(t.top + t.height / 2 - h * 0.42, top + 8, innerHeight - h - 8);
      const blockers = avoid ? [...document.querySelectorAll(avoid)].map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.bottom > 0 && r.top < innerHeight) : [];
      // lean in as far as the free margin allows; she needs ~42% showing so her pointing arm is visible
      for (let k = 0.62; k >= 0.42; k -= 0.05) {
        const depth = w * k, span = depth + tilt;
        const box = left ? { left: 0, right: span, top: y, bottom: y + h } : { left: innerWidth - span, right: innerWidth, top: y, bottom: y + h };
        if (blockers.some((r) => hit(box, r))) continue;
        // widest speech bubble that still fits in the free margin above her head
        const free = [220, 190, 160, 140, 120].find((bw) => {
          const b = left ? { left: 8, right: 8 + bw, top: y - 64, bottom: y } : { left: innerWidth - 8 - bw, right: innerWidth - 8, top: y - 64, bottom: y };
          return !blockers.some((r) => hit(b, r, 2));
        });
        return {
          free: free || 170,
          edge: 'side', tail: left ? 'l' : 'r', face: left ? 1 : -1, lean: left ? lean : -lean,
          vis: { x: left ? depth - w : innerWidth - depth, y }, hid: { x: left ? -w - 16 : innerWidth + 16, y },
        };
      }
      return null;
    }
    function perchGeom() {
      if (!perch) return null;
      const p = perch.getBoundingClientRect(), w = btn.offsetWidth, h = btn.offsetHeight;
      if (!p.width || p.top > innerHeight - 20 || p.width < w * 1.2) return null;
      const x = p.left + 6;
      return { edge: 'top', tail: 'l', face: 1, lean: 0, vis: { x, y: p.top - h * 0.5 }, hid: { x, y: p.top + 10 } };
    }

    function retreat(t = gsap.timeline(), g = active) {
      if (!g) return t;
      return t.call(() => { spot = null; active = null; hush(); })
        .to(pose, { scaleY: 0.88, scaleX: 1.08, duration: 0.08 })
        .to(btn, { x: g.hid.x, y: g.hid.y, duration: 0.28, ease: 'back.in(1.7)' })
        .to(pose, { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.12 }, '<')
        .to(host, { '--arm': '0deg', '--head': '0deg', duration: 0.12 }, '<');
    }
    function show(g, { line, point, hold = 1.6, after } = {}) {
      tl && tl.kill();
      tl = gsap.timeline({ onComplete: () => { tl = null; after && after(); } });
      retreat(tl);
      tl.call(() => { active = g; })
        .set(btn, { x: g.hid.x, y: g.hid.y })
        .call(() => { facing = g.face; gsap.set(face, { scaleX: g.face }); })
        .set(pose, { rotation: g.lean })
        .to(pose, { scaleY: 0.86, scaleX: 1.1, duration: 0.1 })
        .to(btn, { x: g.vis.x, y: g.vis.y, duration: 0.48, ease: 'back.out(2.4)' })
        .fromTo(pose, { scaleY: 1.12, scaleX: 0.92 }, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1,0.35)' }, '<')
        .call(() => { spot = g; if (line) say(line, 2400 + hold * 600); });
      if (point) tl.add(pointTl(point, { lean: g.lean, hold }), '+=0.1');
      else tl.call(() => host.classList.add('waving')).to({}, { duration: hold + 1 }).call(() => host.classList.remove('waving'));
      tl.to({}, { duration: 0.4 });
      retreat(tl, g);
    }

    // a peek at something in the current section, in whichever side margin has room
    function idlePeek() {
      idleT = 0;
      if (!sec || tl) return;
      const sides = Math.random() < 0.5 ? ['right', 'left'] : ['left', 'right'];
      const firstTime = enterPending;
      const pool = firstTime && sec.title ? [document.querySelector(sec.title)] : [...document.querySelectorAll(sec.targets)];
      const els = pool.filter((el) => el && inView(el.getBoundingClientRect()));
      for (const s of sides) {
        // try the things nearest that side first, rotating so she doesn't always pick the same one
        const near = els.map((el) => { const r = el.getBoundingClientRect(); return { el, d: s === 'left' ? r.left : innerWidth - r.right }; })
          .sort((a, b) => a.d - b.d).slice(0, 3);
        for (let k = 0; k < near.length; k++) {
          const el = near[(n + k) % near.length].el;
          const g = sideGeom(el, s);
          if (!g) continue;
          n += 1; enterPending = false;
          show(g, { line: firstTime ? sec.enter : pick(sec.lines), point: el, after: () => { idleT = setTimeout(idlePeek, rand(5500, 8500)); } });
          return;
        }
      }
      if (firstTime) { // no room at the sides: say it from behind the pill instead
        enterPending = false;
        const g = perchGeom();
        if (g) show(g, { line: sec.enter, point: perch, hold: 1.2 });
      }
    }

    const onScroll = () => {
      if (active && active.edge === 'side') { tl && tl.kill(); tl = null; retreat(); }
      clearTimeout(idleT);
      idleT = setTimeout(idlePeek, 1100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    gsap.set(btn, { x: -btn.offsetWidth - 16, y: innerHeight / 2 });

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
