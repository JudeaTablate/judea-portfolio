// "AI vision" portrait: the photo stays clean; a face-tracking box with a
// label + confidence score sits AROUND the face (never on it). Hover/tap swaps
// to the jolly photo, the box glides to the new face and a scan line sweeps down.
// (File name kept so imports don't change.)

// face boxes as fractions of the ORIGINAL image (x, y, w, h)
const FACES = [
  { x: 0.32, y: 0.085, w: 0.29, h: 0.29, label: 'judea', tag: 'mood: unbothered', conf: 98.7 },
  { x: 0.43, y: 0.085, w: 0.29, h: 0.29, label: 'judea', tag: 'mood: jolly', conf: 99.4 },
];

export function initBinaryPhoto(canvas, srcs, container) {
  const ctx = canvas.getContext('2d');
  const [srcA, srcB] = Array.isArray(srcs) ? srcs : [srcs, srcs];
  const imgA = new Image(), imgB = new Image();
  let readyA = false, readyB = false;
  imgA.onload = () => { readyA = true; resize(); };
  imgB.onload = () => { readyB = true; };
  imgA.src = srcA; imgB.src = srcB;

  let W = 0, H = 0, dpr = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas);

  let hovered = false, tapT;
  container.addEventListener('mouseenter', () => { hovered = true; });
  container.addEventListener('mouseleave', () => { hovered = false; });
  container.addEventListener('touchstart', () => { hovered = true; clearTimeout(tapT); tapT = setTimeout(() => { hovered = false; }, 2200); }, { passive: true });

  // object-fit: cover mapping (image fraction -> canvas px)
  function coverRect(im) {
    const iw = im.naturalWidth, ih = im.naturalHeight, cr = W / H, ir = iw / ih;
    let sx, sy, sw, sh;
    if (ir > cr) { sh = ih; sw = ih * cr; sx = (iw - sw) / 2; sy = 0; }
    else { sw = iw; sh = iw / cr; sx = 0; sy = (ih - sh) / 2; }
    return { sx, sy, sw, sh, iw, ih };
  }
  const mapBox = (f, c) => ({
    x: ((f.x * c.iw - c.sx) / c.sw) * W, y: ((f.y * c.ih - c.sy) / c.sh) * H,
    w: ((f.w * c.iw) / c.sw) * W, h: ((f.h * c.ih) / c.sh) * H,
  });
  const drawPhoto = (im, a) => { const c = coverRect(im); ctx.globalAlpha = a; ctx.drawImage(im, c.sx, c.sy, c.sw, c.sh, 0, 0, W, H); ctx.globalAlpha = 1; };

  let cA = '#6ff0e0', cB = '#ff9ecd';
  const readColors = () => { const s = getComputedStyle(document.body); cA = s.getPropertyValue('--accent3').trim() || cA; cB = s.getPropertyValue('--accent2').trim() || cB; };
  readColors();
  new MutationObserver(readColors).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  let vis = true;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(canvas);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mix = 0, scan = -1, wasHover = false, box = null, conf = FACES[0].conf, t0 = performance.now();

  function bracket(x, y, w, h, len, col) {
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
    ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
    ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
    ctx.stroke();
  }
  function pill(text, x, y, bg, fg) {
    ctx.font = `600 ${Math.max(10, W * 0.03)}px 'JetBrains Mono', monospace`;
    const pw = ctx.measureText(text).width + 12, ph = Math.max(16, W * 0.05);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y - ph, pw, ph, 4); ctx.fill();
    ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 6, y - ph / 2 + 0.5);
    return ph;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis || document.hidden || !readyA || !W) return;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);

    mix += ((hovered && readyB ? 1 : 0) - mix) * 0.12;
    drawPhoto(imgA, 1);
    if (mix > 0.01 && readyB) drawPhoto(imgB, mix);

    // faint scanlines: texture only, never hides the photo
    ctx.fillStyle = 'rgba(10,14,39,0.06)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    // target face box glides between photos
    const ca = coverRect(imgA);
    const a = mapBox(FACES[0], ca), b = mapBox(FACES[1], readyB ? coverRect(imgB) : ca);
    const target = { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix, w: a.w + (b.w - a.w) * mix, h: a.h + (b.h - a.h) * mix };
    if (!box) box = { ...target };
    for (const k of ['x', 'y', 'w', 'h']) box[k] += (target[k] - box[k]) * 0.18;
    // tiny "tracking" jitter
    const j = reduce ? 0 : Math.sin(t * 2.3) * 0.8;
    const pad = box.w * 0.08, bx = box.x - pad + j, by = box.y - pad, bw = box.w + pad * 2, bh = box.h + pad * 2;

    const col = mix > 0.5 ? cB : cA;
    bracket(bx, by, bw, bh, Math.min(bw, bh) * 0.22, col);
    // tiny centre-of-face crosshair on the cheek line, offset so it isn't on the eyes
    ctx.globalAlpha = 0.55; ctx.strokeStyle = col; ctx.lineWidth = 1;
    const cx = bx + bw + 8, cy = by + bh * 0.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 14, cy); ctx.stroke(); ctx.globalAlpha = 1;

    // label above the box
    const f = mix > 0.5 ? FACES[1] : FACES[0];
    conf += (f.conf + (reduce ? 0 : Math.sin(t * 3) * 0.2) - conf) * 0.1;
    const ph = pill(`${f.label} · ${conf.toFixed(1)}%`, bx, by - 6, col, '#0A0E27');
    ctx.font = `500 ${Math.max(9.5, W * 0.027)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4;
    ctx.fillText(f.tag, bx, by + bh + 12);
    ctx.shadowBlur = 0;

    // scan sweep when hover starts
    if (hovered && !wasHover) scan = 0;
    wasHover = hovered;
    if (scan >= 0 && !reduce) {
      scan += 0.022;
      const sy = scan * H;
      const g = ctx.createLinearGradient(0, sy - 40, 0, sy);
      g.addColorStop(0, 'rgba(255,158,205,0)'); g.addColorStop(1, 'rgba(255,158,205,.28)');
      ctx.fillStyle = g; ctx.fillRect(0, sy - 40, W, 40);
      ctx.fillStyle = cB; ctx.fillRect(0, sy - 1, W, 2);
      if (scan > 1) scan = -1;
    }

    // corner HUD
    ctx.font = `500 ${Math.max(9, W * 0.025)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 4;
    const blink = Math.floor(t * 1.6) % 2 === 0;
    ctx.fillText((blink ? '● ' : '  ') + 'REC · cam_01', 10, H - 14);
    const right = hovered ? 'scan: complete' : 'tracking…';
    ctx.fillText(right, W - ctx.measureText(right).width - 10, H - 14);
    ctx.shadowBlur = 0;
  }
  requestAnimationFrame(frame);
}
