import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initNeuralScene, initFloatingShape } from './three-scene.js';
import { initBinaryPhoto } from './binary-photo.js';
import { ICONS, injectIcons } from './icons.js';
import { initGallery } from './gallery.js';
import { nextJoke } from './jokes.js';
import { PALETTES, setPalette, clickSound, isOn } from './audio.js';
import { themeTransition } from './theme-fx.js';
import { initAvatar } from './avatar.js';

gsap.registerPlugin(ScrollTrigger);

/* ================= SMOOTH SCROLL (Lenis + GSAP ticker) ================= */
const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Smooth-scroll for in-page nav links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -20, duration: 1.2 });
    }
  });
});

/* ================= INTRO LOADER ================= */
let p = 0;
const fill = document.getElementById('loadFill');
const pctEl = document.getElementById('loadPct');
const loader = document.getElementById('loader');
const li = setInterval(() => {
  p += Math.random() * 22;
  if (p >= 100) {
    p = 100;
    clearInterval(li);
    setTimeout(() => {
      loader.classList.add('hide');
      playHeroIntro();
    }, 350);
  }
  fill.style.width = p + '%';
  pctEl.textContent = Math.floor(p) + '%';
}, 150);

/* ================= HERO INTRO ANIMATION (word-by-word) ================= */
const heroTitle = document.getElementById('heroTitle');
// wrap each word so GSAP can stagger-reveal them
heroTitle.innerHTML = heroTitle.innerHTML
  .split(/(<br>)/)
  .map((chunk) => {
    if (chunk === '<br>') return chunk;
    // preserve the gradient span, split only its inner words too
    return chunk.replace(/(<span class="grad">)(.*?)(<\/span>)|(\S+)/g, (m, open, inner, close, plain) => {
      if (plain) return `<span class="word">${plain}</span> `;
      const words = inner.split(' ').map((w) => `<span class="word">${w}</span>`).join(' ');
      return `${open}${words}${close}`;
    });
  })
  .join('');

function playHeroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.to('.hero .word', { y: '0%', duration: 1, stagger: 0.06 })
    .to('.hero-sub', { opacity: 1, duration: 0.6 }, '-=0.5')
    .to('.hero-ctas', { opacity: 1, duration: 0.6 }, '-=0.4')
    .fromTo('.hero-photo', { opacity: 0, y: 30, rotateY: -12, transformPerspective: 900 }, { opacity: 1, y: 0, rotateY: 0, duration: 0.9 }, '-=0.7');
}

/* ================= CYCLING GREETING ("Hi" in different languages) ================= */
(function () {
  const el = document.getElementById('greetingWord');
  if (!el) return;
  const greetings = ['Hi', 'Kumusta', 'Hola', 'Bonjour', 'Ciao', 'Hallo', 'Olá', 'こんにちは', '안녕', 'Namaste', '你好', 'Selamat'];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % greetings.length;
    gsap.to(el, {
      opacity: 0, y: -6, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        el.textContent = greetings[i];
        gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
      },
    });
  }, 2200);
})();

/* ================= MOBILE MENU ================= */
(function () {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const isOpen = btn.classList.toggle('open');
    menu.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    btn.classList.remove('open');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open navigation menu');
  }));
})();

/* ================= PAINT REVEAL HOVER ================= */
function attachPaintHover(el) {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty('--mx', x + '%');
    el.style.setProperty('--my', y + '%');
  });
}
document.querySelectorAll('.paint-hover').forEach(attachPaintHover);

/* ================= CURSOR FOLLOW ================= */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });

gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
gsap.ticker.add(() => {
  dotX(mouseX); dotY(mouseY);
  ringX(mouseX); ringY(mouseY);
});

document.querySelectorAll('a, button, .magnetic-card, input').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    ring.style.width = '54px'; ring.style.height = '54px'; ring.style.borderColor = 'var(--accent2)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.width = '34px'; ring.style.height = '34px'; ring.style.borderColor = 'var(--accent)';
  });
});

/* ================= MAGNETIC BUTTONS ================= */
document.querySelectorAll('.magnetic').forEach((btn) => {
  const strength = 0.35;
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * strength;
    const y = (e.clientY - r.top - r.height / 2) * strength;
    gsap.to(btn, { x, y, duration: 0.3, ease: 'power3.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  });
});

document.querySelectorAll('.magnetic-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card, { rotateX: py * -6, rotateY: px * 6, y: -6, duration: 0.4, ease: 'power2.out', transformPerspective: 700 });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.6, ease: 'power3.out' });
  });
});

/* ================= HERO 3D SCENE ================= */
(function () {
  const canvas = document.getElementById('warpCanvas');
  const heroSection = document.querySelector('.hero');
  initNeuralScene(canvas, heroSection);

  const photoCanvas = document.getElementById('binaryPhoto');
  const photoContainer = document.querySelector('.hero-photo');
  if (photoCanvas && photoContainer) initBinaryPhoto(photoCanvas, ['/judea-poker.jpg', '/judea-jolly.jpg'], photoContainer);

  ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      const scrollFade = 1 - self.progress;
      canvas.style.opacity = scrollFade;
      gsap.set('.wrap-inner', { y: self.progress * -80, opacity: scrollFade });
    },
  });
})();

/* ================= PROJECT GALLERY (one at a time, horizontal) ================= */
injectIcons();
const gallery = initGallery(lenis, injectIcons);
(function () {
  const sub = document.getElementById('mmProjects');
  if (!sub) return;
  sub.innerHTML = gallery.projects.map((p, i) => `<a href="#work" data-proj="${i}">${p.title}</a>`).join('');
  sub.addEventListener('click', (e) => {
    const a = e.target.closest('[data-proj]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('hamburgerBtn').click();
    setTimeout(() => gallery.goTo(+a.dataset.proj), 320);
  });
})();
initAvatar(lenis);

/* ================= CONTACT 3D ACCENT ================= */
(function () {
  const canvas = document.getElementById('contactShape');
  const container = document.getElementById('contact');
  if (canvas && container) initFloatingShape(canvas, container, 0xff9ecd);
})();

/* ================= EXPERIENCE TIMELINE ================= */
(function () {
  const timeline = document.querySelector('.timeline');
  const fill = document.querySelector('.timeline-fill');
  if (!timeline || !fill) return;
  gsap.to(fill, {
    height: '100%', ease: 'none',
    scrollTrigger: {
      trigger: timeline, start: 'top 75%', end: 'bottom 60%', scrub: 0.5,
    },
  });
})();

/* ================= SCROLL-TRIGGERED SECTION REVEALS ================= */
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 40, rotateX: 10, transformPerspective: 900, transformOrigin: '50% 100%' },
    {
      opacity: 1, y: 0, rotateX: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    }
  );
});

gsap.utils.toArray('.cap-row').forEach((row, i) => {
  gsap.fromTo(
    row,
    { opacity: 0, x: -30 },
    { opacity: 1, x: 0, duration: 0.7, delay: i * 0.05, ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 88%' } }
  );
});

gsap.utils.toArray('.exp-row').forEach((row, i) => {
  gsap.fromTo(
    row,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, delay: i * 0.06, ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 90%' } }
  );
});

/* ================= CERTIFICATE ISSUER LOGOS ================= */
(function () {
  // Slugs confirmed to exist in Simple Icons. Others (TestDome, Pearson, IPOPHL, PMI)
  // don't have logos in this open icon library, so they fall back to a clean initials badge.
  const HAS_ICON = new Set(['cisco', 'datacamp']);
  document.querySelectorAll('.cert-badge[data-issuer-slug]').forEach((badge) => {
    const slug = badge.getAttribute('data-issuer-slug');
    const issuerText = badge.closest('.cert-card')?.querySelector('.cert-issuer')?.textContent || '?';
    if (HAS_ICON.has(slug)) {
      const img = document.createElement('img');
      img.src = `https://cdn.simpleicons.org/${slug}`;
      img.alt = slug;
      img.onerror = () => renderInitials(badge, issuerText);
      badge.appendChild(img);
    } else {
      renderInitials(badge, issuerText);
    }
  });
  function renderInitials(badge, text) {
    const initials = text.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    badge.classList.add('initials');
    badge.textContent = initials;
  }
})();

/* ================= TECH STACK ICON GRID ================= */
(function () {
  const TECH = {
    frontend: [
      ['JavaScript', 'javascript'], ['TypeScript', 'typescript'], ['React', 'react'], ['Next.js', 'nextdotjs'],
      ['HTML', 'html5'], ['CSS', 'css'], ['Vite', 'vite'],
    ],
    backend: [
      ['Node.js', 'nodedotjs'], ['Python', 'python'], ['Java', 'openjdk'], ['PHP', 'php'], ['FastAPI', 'fastapi'],
      ['PostgreSQL', 'postgresql'], ['MySQL', 'mysql'], ['C++', 'cplusplus'], ['MongoDB', 'mongodb'],
      ['Discord API', 'discord'], ['Google Drive API', 'googledrive'],
    ],
    devops: [
      ['GitHub Actions', 'githubactions'],
      ['GitLab CI', 'gitlab'], ['Docker', 'docker'], ['Kubernetes', 'kubernetes'], ['Vercel', 'vercel'],
    ],
    ai: [
      ['TensorFlow', 'tensorflow'], ['PyTorch', 'pytorch'], ['OpenAI', 'openai'], ['Anthropic', 'anthropic'],
      ['AutoGPT', 'autogpt'], ['Claude Code', 'claudecode'], ['Codex', null], ['Copilot', 'githubcopilot'],
    ],
    devtools: [
      ['Git', 'git'], ['GitHub', 'github'], ['GitLab', 'gitlab'], ['VS Code', 'visualstudiocode'],
      ['Visual Studio', 'visualstudio'], ['JetBrains IntelliJ', 'intellijidea'], ['PyCharm', 'pycharm'],
      ['MATLAB', null], ['SAP S/4HANA', 'sap'], ['Discord', 'discord'], ['Teams', 'microsoftteams'],
      ['JIRA', 'jira'], ['Cisco Packet Tracer', 'cisco'],
    ],
  };

  document.querySelectorAll('.tech-grid').forEach((grid) => {
    const cat = grid.getAttribute('data-cat');
    const items = TECH[cat] || [];
    items.forEach(([name, slug]) => {
      const tile = document.createElement('div');
      tile.className = 'tech-tile paint-hover' + (slug ? '' : ' no-icon');
      if (slug) {
        const img = document.createElement('img');
        img.src = `https://cdn.simpleicons.org/${slug}`;
        img.alt = name;
        img.loading = 'lazy';
        img.onerror = () => img.remove();
        tile.appendChild(img);
      }
      const label = document.createElement('div');
      label.className = 'tech-tile-name';
      label.textContent = name;
      tile.appendChild(label);
      grid.appendChild(tile);
      attachPaintHover(tile);
    });
  });
})();

/* ================= KINETIC SCROLL-REVEAL TEXT ================= */
(function () {
  const el = document.getElementById('kineticText');
  if (!el) return;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="kword">${w}</span>`).join(' ');
  gsap.timeline({
    scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
  }).to(el.querySelectorAll('.kword'), { color: 'var(--text)', stagger: 0.06, ease: 'none' });
})();

/* ================= SECTION TITLE LETTER WAVE ON HOVER ================= */
document.querySelectorAll('.sec-title').forEach((title) => {
  const text = title.textContent;
  title.innerHTML = text.split('').map((ch) => `<span class="kletter">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
  const letters = title.querySelectorAll('.kletter');
  title.addEventListener('mouseenter', () => {
    gsap.fromTo(letters, { y: 0 }, { y: -10, duration: 0.28, stagger: { each: 0.025, from: 'start' }, ease: 'power2.out', yoyo: true, repeat: 1 });
  });
});

/* ================= TERMINAL EASTER EGG ================= */
(function () {
  const body = document.getElementById('termBody');
  const input = document.getElementById('termInput');
  if (!body || !input) return;

  function printLine(text, cls) {
    const line = document.createElement('div');
    line.className = 'line ' + (cls || 'out');
    line.textContent = text;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
    return line;
  }
  function printTyped(text, cls, speed = 14) {
    const line = document.createElement('div');
    line.className = 'line ' + (cls || 'out');
    body.appendChild(line);
    let i = 0;
    const iv = setInterval(() => {
      line.textContent += text[i];
      i++;
      body.scrollTop = body.scrollHeight;
      if (i >= text.length) clearInterval(iv);
    }, speed);
  }

  const commands = {
    help: () => [
      'available commands:',
      '  whoami        — who is running this thing',
      '  skills        — technical skillset',
      '  projects      — things I\'ve built',
      '  experience    — work history',
      '  contact       — how to reach me',
      '  sudo hire-me  — try it and see',
      '  coffee        — status report',
      '  joke          — fresh dev-life humor (there are a lot)',
      '  clear         — wipe the terminal',
    ].join('\n'),
    whoami: () => 'judea_ann_tablate — BSCS (Software Engineering), FEU Institute of Technology. Aspiring AI & ML Engineer / Web Developer.',
    skills: () => 'Frontend: HTML/CSS/JS, Vite. Backend: Python, Node.js. AI/ML: applied AI/ML (learning), LLM APIs. DevOps: Docker, GitHub Actions, Vercel, Google Cloud. Tools: GitHub, VS Code, Cisco Packet Tracer.',
    projects: () => '1) PsyClick — clinical psychomotor screening (thesis, team ByteMe) — Lead Researcher & Documentation Specialist\n2) Sentinel — health monitoring → real-time Discord alerts\n3) Automated Cloud Backup System — Python + GitHub Actions → Google Drive',
    experience: () => 'Discipline Unit, FEUTech (Student Assistant) · FEU Tech Library (Student Assistant) · Student Coordinating Council (Exec Secretary) · ACM (Assoc. Director, Logistics) · JPCS, SCC & ACM (Jr. Officer, Logistics)',
    contact: () => 'judeaannctablate@gmail.com · +63 908 728 8413 · github.com/JudeaTablate · linkedin.com/in/judea-ann-tablate-65a8901b7',
    coffee: () => '[ c(_) ] status: 74% full. sufficient for approximately 3.5 more hours of debugging.',
    joke: () => nextJoke(),
    clear: () => { body.innerHTML = ''; return null; },
  };

  function handle(raw) {
    const cmd = raw.trim();
    printLine(cmd, 'cmd');
    if (!cmd) return;
    const key = cmd.toLowerCase();
    if (key === 'sudo hire-me' || key === 'sudo hire me') {
      printTyped('permission granted. redirecting to contact section...', 'accent');
      setTimeout(() => {
        const c = document.querySelector('#contact');
        if (c) c.scrollIntoView({ behavior: 'smooth' });
      }, 700);
      return;
    }
    if (key in commands) {
      const out = commands[key]();
      if (out !== null && out !== undefined) printLine(out, 'out');
      return;
    }
    printLine(`command not found: ${cmd} — type "help" for a list`, 'accent');
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handle(input.value);
      input.value = '';
    }
  });

  printTyped("judea's portfolio terminal v1.0 — type 'help' to get started", 'out', 12);
})();

/* ================= CLOCK (Manila time, digital + analog) ================= */
const hourHand = document.getElementById('hourHand');
const minHand = document.getElementById('minHand');
const secHand = document.getElementById('secHand');

function getManilaParts() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Manila',
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  return { h: get('hour'), m: get('minute'), s: get('second') };
}
function tick() {
  const { h, m, s } = getManilaParts();
  document.getElementById('clock').textContent =
    'MNL · GMT+8 · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  const hourDeg = (h % 12) * 30 + m * 0.5;
  const minDeg = m * 6 + s * 0.1;
  const secDeg = s * 6;
  gsap.to(hourHand, { rotation: hourDeg, duration: 0.4, svgOrigin: '20px 20px', ease: 'power1.out' });
  gsap.to(minHand, { rotation: minDeg, duration: 0.4, svgOrigin: '20px 20px', ease: 'power1.out' });
  gsap.to(secHand, { rotation: secDeg, duration: 0.3, svgOrigin: '20px 20px', ease: 'power1.out' });
}
tick();
setInterval(tick, 1000);


/* ================= EMAIL ACTION ================= */
(function () {
  document.querySelectorAll('.js-email-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = btn.dataset.email || 'judeaannctablate@gmail.com';
      const subject = encodeURIComponent('Hello Judea');
      const body = encodeURIComponent('Hi Judea,\n\nI found your portfolio and would like to get in touch.\n\n');
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
      const popup = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      // If the browser blocks the new tab, fall back to the visitor's default mail app.
      if (!popup) window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  });
})();

/* ================= THEME (sunrise / night-falls) ================= */
const themeBtn = document.getElementById('themeBtn');
function applyTheme(next) {
  document.body.setAttribute('data-theme', next);
  const light = next === 'light';
  document.getElementById('themeLabel').textContent = light ? 'Dark' : 'Light';
  const ic = document.getElementById('themeIc');
  ic.innerHTML = ICONS[light ? 'moon' : 'sun'];
  themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#F6F3FF' : '#0A0E27');
}
themeBtn.addEventListener('click', () => {
  const toLight = document.body.getAttribute('data-theme') === 'dark';
  themeTransition(toLight, () => applyTheme(toLight ? 'light' : 'dark'));
});

/* ================= SOUND DROPDOWN (7 synthesized moods) ================= */
(function () {
  const menu = document.getElementById('soundMenu');
  const btn = document.getElementById('soundBtn');
  const list = document.getElementById('soundList');
  const label = document.getElementById('soundLabel');
  let cur = 'off';
  list.innerHTML = PALETTES.map(([id, name]) => `<li role="option" tabindex="0" data-id="${id}" aria-selected="${id === 'off'}">${name}</li>`).join('');
  const close = () => { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const o = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(o));
  });
  const choose = (li) => {
    cur = li.dataset.id;
    setPalette(cur);
    label.textContent = cur === 'off' ? 'Sound: Off' : PALETTES.find((p) => p[0] === cur)[1];
    list.querySelectorAll('li').forEach((x) => x.setAttribute('aria-selected', String(x === li)));
    close();
  };
  list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) { e.stopPropagation(); choose(li); } });
  list.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.id) { e.preventDefault(); choose(e.target); } if (e.key === 'Escape') close(); });
  document.addEventListener('click', (e) => { if (!menu.contains(e.target)) close(); });
})();
document.addEventListener('click', () => { if (isOn()) clickSound(); }, true);
