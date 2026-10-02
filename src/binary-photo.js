// Renders the real photo in its actual colors, with a grid of binary digits
// (0/1) layered on top as a glowing HUD-style overlay — density/placement
// follows the image's brightness map, so the numbers trace the photo's
// contours without hiding who it is. Idle: gentle flicker. Hover: faster,
// more active digit movement.
export function initBinaryPhoto(canvas, imgSrc, container) {
  const ctx = canvas.getContext('2d');
  const COLS = 30;
  let ROWS = 36;
  let cellW, cellH, W, H;
  let brightness = [];
  let chars = [];
  let phase = [];
  let hovered = false;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imgSrc;

  function buildBrightnessGrid() {
    const off = document.createElement('canvas');
    off.width = COLS;
    ROWS = Math.round(COLS * (img.naturalHeight / img.naturalWidth)) || 36;
    off.height = ROWS;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, COLS, ROWS);
    const data = octx.getImageData(0, 0, COLS, ROWS).data;
    brightness = [];
    chars = [];
    phase = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = (y * COLS + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        brightness.push(lum);
        chars.push(Math.random() > 0.5 ? '1' : '0');
        phase.push(Math.random() * 1000);
      }
    }
  }

  function resize() {
    const w = container.clientWidth || 200;
    const h = container.clientHeight || 260;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = w; H = h;
    cellW = W / COLS;
    cellH = H / ROWS;
  }

  container.addEventListener('mouseenter', () => { hovered = true; });
  container.addEventListener('mouseleave', () => { hovered = false; });

  // draw the real photo, covering the canvas (object-fit: cover behavior)
  function drawPhotoCover() {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const canvasRatio = W / H, imgRatio = iw / ih;
    let sx, sy, sw, sh;
    if (imgRatio > canvasRatio) {
      sh = ih; sw = ih * canvasRatio; sx = (iw - sw) / 2; sy = 0;
    } else {
      sw = iw; sh = iw / canvasRatio; sx = 0; sy = (ih - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  }

  let t = 0;
  function frame() {
    t += 1;
    const styles = getComputedStyle(document.body);
    const c1 = styles.getPropertyValue('--accent3').trim() || '#6ff0e0';
    const c2 = styles.getPropertyValue('--accent2').trim() || '#ff9ecd';
    const c3 = styles.getPropertyValue('--accent').trim() || '#b983ff';

    // base layer: the real photo, true colors
    drawPhotoCover();
    // subtle dark scrim so digits stay legible over any photo
    ctx.fillStyle = 'rgba(5,8,20,0.28)';
    ctx.fillRect(0, 0, W, H);

    // overlay: binary digits, glow-blended so the photo still reads through
    ctx.font = `${Math.max(cellH * 0.85, 6)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalCompositeOperation = 'screen';

    const flipChance = hovered ? 0.05 : 0.012;
    const speed = hovered ? 1 : 0.35;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const idx = y * COLS + x;
        const lum = brightness[idx] ?? 0.5;
        if (Math.random() < flipChance) chars[idx] = Math.random() > 0.5 ? '1' : '0';

        const wobble = Math.sin((t + phase[idx]) * 0.02 * speed) * (hovered ? 3 : 0.8);
        const px = x * cellW + cellW / 2;
        const py = y * cellH + cellH / 2 + wobble;

        // brighter image areas get brighter/more visible digits (edge/detail emphasis)
        const alpha = hovered ? 0.5 + lum * 0.4 : 0.22 + lum * 0.28;
        ctx.fillStyle = (idx % 11 === 0) ? c2 : (idx % 5 === 0) ? c3 : c1;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillText(chars[idx], px, py);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  img.onload = () => {
    buildBrightnessGrid();
    resize();
    frame();
  };
  window.addEventListener('resize', () => {
    resize();
  });
}
