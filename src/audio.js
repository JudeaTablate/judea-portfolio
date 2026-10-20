// Synthesized mood palettes (Web Audio) — no licensed audio files. Each palette = generative loop + click sound.
let ctx, master, current = 'off', timer = null, stepN = 0, live = [];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function ensure() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function note(m, t, dur, type = 'sine', vol = 0.12, lp = 6000, dest = master) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = hz(m);
  f.type = 'lowpass'; f.frequency.value = lp;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise(t, dur, vol = 0.05, hp = 6000) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = buf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t);
}
function kick(t, vol = 0.35) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.14);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.22);
}
function drone(m, type, vol, lp) {
  const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = hz(m); o.detune.value = (Math.random() - 0.5) * 18;
  f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol;
  o.connect(f); f.connect(g); g.connect(master); o.start();
  live.push(o);
  return o;
}

const PAL = {
  chill: { label: 'Lo-fi chill', bpm: 72, div: 2, click: [660, 'sine'],
    step(n, t, d) {
      const ch = [[50, 53, 57, 60], [46, 50, 53, 57], [43, 47, 50, 53], [48, 52, 55, 59]][Math.floor(n / 8) % 4];
      if (n % 8 === 0) ch.forEach((m, i) => note(m, t + i * 0.02, d * 7, 'triangle', 0.07, 900));
      if (n % 2 === 0 && Math.random() > 0.3) note(pick(ch) + 24, t, d * 1.6, 'sine', 0.07, 2500);
      if (n % 4 === 0) kick(t, 0.18);
      if (n % 4 === 2) noise(t, 0.05, 0.03, 7000);
    } },
  horror: { label: 'Horror', bpm: 40, div: 2, click: [110, 'sawtooth'],
    start() { drone(33, 'sawtooth', 0.06, 160); drone(33.4, 'sawtooth', 0.05, 140); drone(39.5, 'sine', 0.035, 300); },
    step(n, t, d) {
      if (Math.random() > 0.72) note(pick([81, 82, 87, 93]), t, d * 3, 'sine', 0.045, 5000);
      if (n % 16 === 7) note(pick([45, 46]), t, d * 6, 'sawtooth', 0.07, 280);
      if (Math.random() > 0.9) noise(t, 0.6, 0.015, 3000);
    } },
  girlboss: { label: 'Girlboss', bpm: 112, div: 2, click: [880, 'square'],
    step(n, t, d) {
      const bass = [40, 40, 43, 40, 45, 45, 43, 38];
      if (n % 4 === 0) kick(t);
      if (n % 2 === 1) noise(t, 0.04, 0.04, 8000);
      if (n % 8 === 4) noise(t, 0.12, 0.06, 4000);
      note(bass[n % 8], t, d * 0.9, 'sawtooth', 0.09, 700);
      if (n % 8 === 0 || n % 8 === 3 || n % 8 === 6) [64, 67, 71].forEach((m) => note(m, t, d * 1.2, 'square', 0.035, 2600));
    } },
  whimsy: { label: 'Whimsy', bpm: 118, div: 2, click: [1320, 'triangle'],
    step(n, t, d) {
      const sc = [72, 74, 76, 78, 79, 81, 83, 84, 86];
      if (Math.random() > 0.28) note(pick(sc), t, d * 2.2, 'triangle', 0.1, 6000);
      if (n % 8 === 0) { note(60, t, d * 4, 'sine', 0.08); note(67, t, d * 4, 'sine', 0.05); }
      if (n % 8 === 4) note(55, t, d * 3, 'sine', 0.08);
    } },
  arcade: { label: 'Retro arcade', bpm: 140, div: 2, click: [988, 'square'],
    step(n, t, d) {
      const arp = [60, 64, 67, 72, 67, 64, 60, 55];
      const root = [0, 0, 5, 5, 7, 7, 3, 3][Math.floor(n / 8) % 8];
      note(arp[n % 8] + root, t, d * 0.8, 'square', 0.05, 5000);
      if (n % 4 === 0) note(36 + root, t, d * 3, 'triangle', 0.14, 500);
      if (n % 4 === 2) noise(t, 0.03, 0.035, 9000);
    } },
  cyber: { label: 'Cyber synthwave', bpm: 100, div: 2, click: [523, 'sawtooth'],
    step(n, t, d) {
      const root = [45, 45, 41, 43][Math.floor(n / 16) % 4];
      if (n % 2 === 0) note(root - 12, t, d * 1.8, 'sawtooth', 0.1, 520);
      note(root + [0, 7, 12, 15, 12, 7, 10, 3][n % 8], t, d * 0.9, 'sawtooth', 0.035, 1800);
      if (n % 8 === 0) kick(t, 0.25);
      if (n % 8 === 4) noise(t, 0.1, 0.05, 5000);
    } },
  default: { label: 'Y2K chimes', bpm: 96, div: 2, click: [520, 'sine'],
    step(n, t, d) {
      const sc = [72, 74, 76, 79, 81, 84];
      if (n % 2 === 0 && Math.random() > 0.35) note(pick(sc), t, d * 2.5, 'sine', 0.09, 5000);
      if (n % 8 === 0) { note(48, t, d * 6, 'triangle', 0.07, 800); note(55, t, d * 6, 'triangle', 0.05, 800); }
    } },
};

export const PALETTES = [['off', 'Off'], ...['default', 'chill', 'horror', 'girlboss', 'whimsy', 'arcade', 'cyber'].map((k) => [k, PAL[k].label])];

function stopLoop() {
  clearTimeout(timer); timer = null;
  live.forEach((o) => { try { o.stop(); } catch (e) {} });
  live = [];
}
function loop(p, id) {
  const d = 60 / p.bpm / p.div;
  let t = ctx.currentTime + 0.08;
  stepN = 0;
  const tick = () => {
    if (id !== current) return;
    while (t < ctx.currentTime + 0.3) { p.step(stepN++, t, d); t += d; }
    timer = setTimeout(tick, 80);
  };
  tick();
}

export function setPalette(id) {
  if (id === 'off') {
    current = 'off';
    if (ctx && master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4); }
    setTimeout(stopLoop, 450);
    return;
  }
  ensure();
  stopLoop();
  current = id;
  const p = PAL[id];
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.2);
  if (p.start) p.start();
  loop(p, id);
}

export function clickSound() {
  if (current === 'off' || !ctx) return;
  const [f, type] = PAL[current].click;
  const t = ctx.currentTime;
  note(69 + 12 * Math.log2(f / 440), t, 0.09, type, 0.08, 5000);
}
export const isOn = () => current !== 'off';
