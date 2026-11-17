import { lenis, PAGE } from './shared.js';
import { nextJoke } from './jokes.js';

// The >_ easter-egg terminal, shared by The Work and Off the Clock.
// `coffee` = how far through the site the visitor is:
//   Home 0-10% -> The Work 10-70% -> Off the Clock 70-100% (100% at the Substack section).
const RANGES = { home: [0, 10], work: [10, 70], offline: [70, 100] };

function where() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const p = Math.min(1, Math.max(0, scrollY / max));
  const [lo, hi] = RANGES[PAGE] || [0, 10];
  const secs = [...document.querySelectorAll('[data-chapter]')];
  let here = null;
  for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * 0.5) here = s;
  const last = secs[secs.length - 1];
  let pct = Math.round(lo + (hi - lo) * p);
  if (PAGE === 'offline' && here && here === last) pct = Math.max(pct, 96);
  if (PAGE === 'offline' && (p > 0.97 || (here === last && last.getBoundingClientRect().bottom < innerHeight * 1.05))) pct = 100;
  const next = here ? secs[secs.indexOf(here) + 1] : secs[0];
  return { pct, here: here?.dataset.chapter, next: next?.dataset.chapter };
}

function coffee() {
  const { pct, here, next } = where();
  const filled = Math.round(pct / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  const spot = here ? `you're at: ${here}` : PAGE === 'work' ? "you're at the start of The Work" : "you're at the top of Off the Clock";
  let mood;
  if (pct >= 100) mood = 'fully caffeinated. you saw everything. now say hi → type "contact"';
  else if (pct >= 85) mood = `almost done. last sip: ${next || 'scroll down'}`;
  else if (pct >= 70) mood = `off the clock already, nice. next: ${next || 'keep scrolling'}`;
  else if (pct >= 40) mood = `halfway there. next: ${next || 'keep scrolling'}`;
  else mood = `just getting warm. next: ${next || 'keep scrolling'}`;
  return `[ c(_) ] ${bar} ${pct}%\n${spot}\n${mood}`;
}

export function initTerminal(extra = {}) {
  if (!document.getElementById('termDrawer')) {
    document.body.insertAdjacentHTML('beforeend', `
<div class="term-drawer" id="termDrawer" aria-hidden="true">
  <div class="term">
    <div class="term-bar">
      <span class="dotr r"></span><span class="dotr y"></span><span class="dotr g"></span>
      <span class="term-title lcd">judea@portfolio:~</span>
      <button class="term-x" id="termClose" aria-label="Close terminal">&times;</button>
    </div>
    <div class="term-body" id="termBody"></div>
    <div class="term-inputline">
      <span class="lcd term-prompt">visitor ~ %</span>
      <input id="termInput" class="lcd" autocomplete="off" spellcheck="false" placeholder="type help">
    </div>
  </div>
</div>`);
  }
  const drawer = document.getElementById('termDrawer');
  const body = document.getElementById('termBody');
  const input = document.getElementById('termInput');
  const open = (o) => {
    drawer.classList.toggle('open', o); drawer.setAttribute('aria-hidden', String(!o));
    if (o) setTimeout(() => input.focus({ preventScroll: true }), 250);
  };
  document.getElementById('termBtn')?.addEventListener('click', () => open(!drawer.classList.contains('open')));
  document.getElementById('termClose').addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  const print = (text, cls = 'out') => { const l = document.createElement('div'); l.className = 'line ' + cls; l.textContent = text; body.appendChild(l); body.scrollTop = body.scrollHeight; };
  const go = (id) => { open(false); const t = document.getElementById(id); if (t) lenis.scrollTo(t, { offset: -70 }); };
  const toContact = () => { if (document.getElementById('contact')) go('contact'); else location.href = '/work.html#contact'; };
  const cmds = {
    whoami: () => 'judea_ann_tablate — BSCS Software Engineering, FEU Tech. Full-stack + AI.',
    contact: () => 'judeaannctablate@gmail.com · github.com/JudeaTablate',
    joke: () => nextJoke(),
    coffee,
    clear: () => { body.innerHTML = ''; return null; },
    ...extra,
  };
  const helpText = () => `commands: ${Object.keys(cmds).join(' · ')} · sudo hire-me\n(coffee = how far through the site you are)`;
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const raw = input.value.trim(); input.value = '';
    print(raw, 'cmd');
    if (!raw) return;
    const k = raw.toLowerCase();
    if (k === 'help') { print(helpText()); return; }
    if (k === 'sudo hire-me' || k === 'sudo hire me') { print('permission granted. taking you to contact...', 'accent'); setTimeout(toContact, 700); return; }
    const out = cmds[k] ? cmds[k]() : `command not found: ${raw}. try "help"`;
    if (out != null) print(out, cmds[k] ? 'out' : 'accent');
  });
  print("judea's terminal — type 'help'");
  return { go };
}
