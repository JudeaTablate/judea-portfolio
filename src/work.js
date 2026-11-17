import { gsap, ScrollTrigger, lenis, setMenuSections, bindLinks, paintHover, reveals, scrollToHashSoon, finePointer } from './shared.js';
import { injectIcons } from './icons.js';
import { initGallery } from './gallery.js';
import { initFloatingShape } from './three-scene.js';
import { initTerminal } from './terminal.js';
import { mountBuddy } from './buddy.js';

/* ---------- projects gallery ---------- */
const gallery = initGallery(lenis, injectIcons);

/* ---------- chapters: rail, toc, "you are here" pill, mobile menu ---------- */
const chapters = [...document.querySelectorAll('.chapter')].map((el) => ({ id: el.id, n: el.dataset.n, name: el.dataset.chapter, el }));
const railList = document.getElementById('railList');
railList.innerHTML = chapters.map((c) => `<li><a href="#${c.id}" data-id="${c.id}"><span class="lcd">${c.n}</span><b>${c.name}</b></a></li>`).join('');
document.getElementById('toc').innerHTML = chapters.map((c) => `<li><a href="#${c.id}"><span class="lcd">${c.n}</span>${c.name}</a></li>`).join('');
const sheet = document.getElementById('whereSheet');
sheet.innerHTML = chapters.map((c) => `<a href="#${c.id}" role="menuitem"><span class="lcd">${c.n}</span>${c.name}</a>`).join('');
setMenuSections(chapters);
bindLinks(railList); bindLinks(document.getElementById('toc')); bindLinks(sheet);

const pill = document.getElementById('wherePill');
const wpNum = document.getElementById('wpNum');
const wpName = document.getElementById('wpName');
pill.addEventListener('click', (e) => {
  e.stopPropagation();
  const o = sheet.classList.toggle('open');
  pill.setAttribute('aria-expanded', String(o));
});
sheet.addEventListener('click', () => { sheet.classList.remove('open'); pill.setAttribute('aria-expanded', 'false'); });
document.addEventListener('click', (e) => { if (!sheet.contains(e.target) && e.target !== pill) { sheet.classList.remove('open'); pill.setAttribute('aria-expanded', 'false'); } });

const railBuddy = mountBuddy(document.getElementById('railBuddy'), {
  lines: ['keep scrolling, it gets better', 'i helped with the docs', 'the wins section is my fave', 'hire her (me)', 'psst: try the >_ button up top'],
});

let current = null;
function setActive(c) {
  if (!c || current === c.id) return;
  const first = current === null;
  current = c.id;
  railList.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.id === c.id));
  wpNum.textContent = c.n; wpName.textContent = c.name;
  document.querySelectorAll('.crumb-live').forEach((el) => { el.textContent = c.name; });
  pill.classList.add('pulse'); setTimeout(() => pill.classList.remove('pulse'), 500);
  if (!first && railBuddy) { railBuddy.hop(); railBuddy.say(`now: ${c.name.toLowerCase()}`, 1600); }
}
chapters.forEach((c) => {
  ScrollTrigger.create({ trigger: c.el, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => s.isActive && setActive(c) });
});
setActive(chapters[0]);
// pill only after the intro scrolls away
ScrollTrigger.create({ trigger: '.page-intro', start: 'bottom 30%', onEnter: () => document.body.classList.add('in-chapters'), onLeaveBack: () => document.body.classList.remove('in-chapters') });
// overall progress line on the rail
const railFill = document.getElementById('railFill');
lenis.on('scroll', ({ progress }) => { railFill.style.transform = `scaleY(${progress || 0})`; });

/* ---------- tech stack tabs ---------- */
const TECH = {
  frontend: [['JavaScript', 'javascript'], ['TypeScript', 'typescript'], ['React', 'react'], ['Next.js', 'nextdotjs'], ['HTML', 'html5'], ['CSS', 'css'], ['Vite', 'vite']],
  backend: [['Node.js', 'nodedotjs'], ['Python', 'python'], ['Java', 'openjdk'], ['PHP', 'php'], ['FastAPI', 'fastapi'], ['PostgreSQL', 'postgresql'], ['MySQL', 'mysql'], ['C++', 'cplusplus'], ['MongoDB', 'mongodb'], ['Discord API', 'discord'], ['Google Drive API', 'googledrive']],
  devops: [['GitHub Actions', 'githubactions'], ['GitLab CI', 'gitlab'], ['Docker', 'docker'], ['Kubernetes', 'kubernetes'], ['Vercel', 'vercel']],
  ai: [['TensorFlow', 'tensorflow'], ['PyTorch', 'pytorch'], ['OpenAI', 'openai'], ['Anthropic', 'anthropic'], ['AutoGPT', 'autogpt'], ['Claude Code', 'claude'], ['Codex', null], ['Copilot', 'githubcopilot']],
  devtools: [['Git', 'git'], ['GitHub', 'github'], ['GitLab', 'gitlab'], ['VS Code', 'visualstudiocode'], ['Visual Studio', 'visualstudio'], ['IntelliJ IDEA', 'intellijidea'], ['PyCharm', 'pycharm'], ['MATLAB', null], ['SAP S/4HANA', 'sap'], ['Discord', 'discord'], ['Teams', 'microsoftteams'], ['Jira', 'jira'], ['Cisco Packet Tracer', 'cisco']],
};
document.querySelectorAll('.tech-grid').forEach((grid) => {
  (TECH[grid.dataset.cat] || []).forEach(([name, slug]) => {
    const tile = document.createElement('div');
    tile.className = 'tech-tile paint-hover' + (slug ? '' : ' no-icon');
    if (slug) {
      const img = document.createElement('img');
      img.src = `https://cdn.simpleicons.org/${slug}`; img.alt = ''; img.loading = 'lazy'; img.width = 34; img.height = 34;
      img.onerror = () => { img.remove(); tile.classList.add('no-icon'); };
      tile.appendChild(img);
    }
    const label = document.createElement('div');
    label.className = 'tech-tile-name'; label.textContent = name;
    tile.appendChild(label);
    grid.appendChild(tile);
  });
});
function tabs(group, onPick) {
  const btns = [...group.querySelectorAll('.chip')];
  const pick = (b) => {
    btns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    onPick(b);
    ScrollTrigger.refresh();
  };
  btns.forEach((b) => b.addEventListener('click', () => pick(b)));
  group.addEventListener('keydown', (e) => {
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const n = btns[(i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length];
      n.focus(); pick(n);
    }
  });
}
const skillTabs = document.querySelector('#skills .chips');
tabs(skillTabs, (b) => {
  document.querySelectorAll('#skills .tech-grid').forEach((g) => {
    const show = g.dataset.cat === b.dataset.tab;
    g.hidden = !show;
    if (show) gsap.fromTo(g.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.025 });
  });
});

/* ---------- certificates filter + issuer badges ---------- */
const certCards = [...document.querySelectorAll('.cert-grid .cert-card')];
tabs(document.querySelector('#certificates .chips'), (b) => {
  const f = b.dataset.filter;
  const shown = certCards.filter((c) => f === 'all' || c.dataset.cat === f);
  certCards.forEach((c) => { c.hidden = !shown.includes(c); });
  gsap.fromTo(shown, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.03 });
});
(() => {
  const HAS_ICON = new Set(['cisco', 'datacamp']);
  document.querySelectorAll('.cert-badge[data-issuer-slug]').forEach((badge) => {
    const slug = badge.dataset.issuerSlug;
    const issuer = badge.closest('.cert-card')?.querySelector('.cert-issuer')?.textContent || '?';
    const initials = () => { badge.classList.add('initials'); badge.textContent = issuer.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(); };
    if (!HAS_ICON.has(slug)) return initials();
    const img = document.createElement('img');
    img.src = `https://cdn.simpleicons.org/${slug}`; img.alt = ''; img.onerror = initials;
    badge.appendChild(img);
  });
})();

/* ---------- experience timeline fill ---------- */
const tl = document.querySelector('.timeline');
if (tl) gsap.to('.timeline-fill', { height: '100%', ease: 'none', scrollTrigger: { trigger: tl, start: 'top 75%', end: 'bottom 60%', scrub: 0.5 } });

/* ---------- contact accent ---------- */
const cs = document.getElementById('contactShape');
if (cs && finePointer) initFloatingShape(cs, document.getElementById('contact'), 0xff9ecd);
else cs?.remove();

/* ---------- email button ---------- */
document.querySelectorAll('.js-email-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const email = btn.dataset.email;
    const su = encodeURIComponent('Hello Judea');
    const body = encodeURIComponent('Hi Judea,\n\nI found your portfolio and would like to get in touch.\n\n');
    const w = window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${su}&body=${body}`, '_blank', 'noopener,noreferrer');
    if (!w) location.href = `mailto:${email}?subject=${su}&body=${body}`;
  });
});

/* ---------- terminal (easter egg) ---------- */
const term = initTerminal({
  projects: () => { setTimeout(() => term.go('work'), 500); return gallery.projects.map((p, i) => `${i + 1}) ${p.title} — ${p.sub}`).join('\n'); },
  wins: () => { setTimeout(() => term.go('wins'), 500); return "P&G Next AIdeathon 2026: 2nd Place, Next 8 (Digital PM), Social Media Challenge · Elite Academic Scholar · Dean's Lister"; },
  skills: () => { setTimeout(() => term.go('skills'), 500); return 'Python, JS/TS, React, Node, FastAPI, PostgreSQL, Docker, GitHub Actions, LLM APIs'; },
});

paintHover();
reveals();
scrollToHashSoon();
