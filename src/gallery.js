import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PROJECTS = [
  { slug: 'psyclick', title: 'PsyClick', sub: 'Clinical Psychomotor Screening', kicker: 'Thesis · Team ByteMe',
    desc: 'A clinician-guided screening companion pairing PHQ-9/GAD-7 questionnaires with keystroke and mouse-dynamics analysis for exportable decision-support reports. I served as Lead Researcher & Documentation Specialist.',
    tags: ['Clinical Decision Support', 'Research'], live: 'https://psyclick-app.vercel.app/' },
  { slug: 'secondsense', title: 'Second Sense', sub: 'Continuous Authentication', kicker: 'Behavioral Biometrics · Full Stack',
    desc: 'A continuous authentication system that learns typing rhythm and mouse movement, then flags a real-time risk score if behavior stops matching after login. Full stack with a scoring backend, behavioral-baseline database, and alerts, packaged with Docker and CI/CD.',
    tags: ['Security', 'Full-Stack', 'Docker'], live: 'https://second-sense-frontend.vercel.app/', code: 'https://github.com/JudeaTablate/Second-Sense' },
  { slug: 'sentinel', title: 'Sentinel', sub: 'Health & Alerting Automation', kicker: 'Automation · Monitoring · Discord API',
    desc: 'A lightweight monitoring layer that replaces manual status checks with automated ones, routing real-time alerts to Discord. Cuts response time on issues before they escalate.',
    tags: ['Monitoring', 'DevOps'], live: 'https://sentinel-uptime-monitor-docs.vercel.app/' },
  { slug: 'splitbill', title: 'Splitbill.live', sub: 'Real-time bill splitting', kicker: 'Node.js · Express · WebSockets',
    desc: 'A shared bill-splitting tool where totals sync live for everyone as items get added, with no app or account required. Handles tax, tip, and multiple currencies automatically, ready to hand off via Venmo or GCash.',
    tags: ['Real-Time Sync', 'Multi-Currency'], live: 'https://splitbill-5ulc.onrender.com' },
  { slug: 'backup', title: 'Automated Cloud Backup', sub: 'Python + GitHub Actions', kicker: 'Python · GitHub Actions · Google Drive API',
    desc: 'A scheduled Python tool wired into GitHub Actions that syncs files straight to Google Drive, with credentials locked down via GitHub Secrets. Removes the "did I back that up" anxiety entirely.',
    tags: ['Automation', 'Cloud'], code: 'https://github.com/JudeaTablate/cloud-auto-backup' },
  { slug: 'wine', title: 'Wine About It', sub: 'Wine basics, no snobbery', kicker: 'React · Vite · Three.js · GSAP · Gemini API',
    desc: 'A front-end site that teaches wine basics without the snobbery, with varietals, tasting notes, and pairings in plain language. Built with React and Vite, with an AI assistant powered by the Gemini API.',
    tags: ['Content Site', 'React', 'AI'], live: 'https://wine-about-it.vercel.app/' },
];

const row = (a, b, c) => `<div class="mk-row"><b>${a}</b><span>${b}</span><em>${c || ''}</em></div>`;
const MOCKS = {
  psyclick: `<div class="mk mk-psy"><div class="mk-h">PsyClick <small>clinician view</small></div><div class="mk-cols"><div class="mk-card"><h5>PHQ-9</h5><i style="width:78%"></i><i style="width:52%"></i><i style="width:66%"></i><i style="width:40%"></i></div><div class="mk-card"><h5>Keystroke dynamics</h5><svg viewBox="0 0 160 70"><polyline points="0,50 14,40 28,48 42,22 56,34 70,16 84,30 98,12 112,38 126,26 140,44 160,20" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></div></div><div class="mk-btn">Export report</div></div>`,
  secondsense: `<div class="mk mk-sec"><div class="mk-h">Second Sense <small>session monitor</small></div><div class="mk-cols"><div class="mk-card mk-gauge"><svg viewBox="0 0 120 70"><path d="M10 62a50 50 0 0 1 100 0" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10" stroke-linecap="round"/><path d="M10 62a50 50 0 0 1 72-45" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg><strong>risk 0.18</strong></div><div class="mk-card"><h5>Behavior baseline</h5><i style="width:88%"></i><i style="width:61%"></i><i style="width:74%"></i></div></div><div class="mk-alert">identity match: stable</div></div>`,
  sentinel: `<div class="mk mk-sen"><div class="mk-h">Sentinel <small>status</small></div><div class="mk-list">${row('api.prod', 'up', '112ms')}${row('db.primary', 'up', '38ms')}${row('worker-02', 'down', '--')}${row('cdn.edge', 'up', '64ms')}</div><div class="mk-alert">#alerts: worker-02 is down, notified on-call</div></div>`,
  splitbill: `<div class="mk mk-split"><div class="mk-h">Splitbill.live <small>room: dinner-night</small></div><div class="mk-list">${row('Pasta', 'Ana', '$14.00')}${row('Salad', 'Ja', '$9.50')}${row('Drinks', 'all', '$21.00')}</div><div class="mk-total"><span>Tax + tip</span><b>$44.50 total</b></div><div class="mk-btn">Pay via GCash</div></div>`,
  backup: `<div class="mk mk-bak"><div class="mk-h">backup.yml <small>GitHub Actions</small></div><pre>on:\n  schedule:\n    - cron: "0 2 * * *"\njobs:\n  sync:\n    steps:\n      - run: python backup.py\n        env:\n          DRIVE_KEY: \${{ secrets.DRIVE_KEY }}\n\n✓ 214 files synced to Google Drive</pre></div>`,
  wine: `<div class="mk mk-wine"><div class="mk-h">Wine About It</div><div class="mk-hero"><div class="glass"></div><div><h4>Wine, minus the snobbery.</h4><p>Varietals, notes, pairings.</p></div></div><div class="mk-cols"><div class="mk-card"><h5>Merlot</h5></div><div class="mk-card"><h5>Riesling</h5></div><div class="mk-card"><h5>Rosé</h5></div></div></div>`,
};

function slideHTML(p, i, n) {
  const host = p.live ? p.live.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'github.com/JudeaTablate';
  return `
  <article class="proj" data-i="${i}" aria-label="Project ${i + 1} of ${n}: ${p.title}">
    <div class="proj-visual">
      <div class="bframe">
        <div class="bbar"><i></i><i></i><i></i><span class="burl">${host}</span><span class="blive">${p.live ? 'live preview' : 'code preview'}</span></div>
        <div class="bview" data-slug="${p.slug}" ${p.live ? `data-live="${p.live}"` : ''}>${MOCKS[p.slug]}</div>
      </div>
    </div>
    <div class="proj-info">
      <div class="proj-num">${String(i + 1).padStart(2, '0')}<span>/${String(n).padStart(2, '0')}</span></div>
      <div class="kicker">${p.kicker}</div>
      <h3>${p.title}<small>${p.sub}</small></h3>
      <p>${p.desc}</p>
      <div class="proj-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="work-links">
        ${p.live ? `<a class="btn solid" href="${p.live}" target="_blank" rel="noopener">Open live site <span class="ic-i" data-icon="arrow"></span></a>` : ''}
        ${p.code ? `<a class="btn ghost" href="${p.code}" target="_blank" rel="noopener">View code <span class="ic-i" data-icon="arrow"></span></a>` : ''}
      </div>
    </div>
  </article>`;
}

function fitFrame(view) {
  const f = view.querySelector('iframe');
  if (f) f.style.transform = `scale(${view.clientWidth / 1280})`;
}
function loadPreview(i) {
  const view = document.querySelectorAll('.bview')[i];
  if (!view || view.dataset.loaded) return;
  view.dataset.loaded = '1';
  // 1) a screenshot you drop into /public/previews/<slug>.jpg wins; 2) else the live site in an iframe; 3) else the drawn mock.
  const img = new Image();
  img.className = 'shot';
  img.alt = `${view.dataset.slug} landing page`;
  img.onload = () => view.appendChild(img);
  img.onerror = () => {
    if (!view.dataset.live) return;
    const f = document.createElement('iframe');
    f.src = view.dataset.live;
    f.title = `Live preview of ${view.dataset.slug}`;
    f.loading = 'lazy';
    f.tabIndex = -1;
    f.referrerPolicy = 'no-referrer';
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    f.onload = () => view.classList.add('loaded');
    view.appendChild(f);
    fitFrame(view);
  };
  img.src = `/previews/${view.dataset.slug}.jpg`;
}

export function initGallery(lenis, injectIcons) {
  const sec = document.getElementById('work');
  const track = document.getElementById('workTrack');
  const n = PROJECTS.length;
  track.innerHTML = PROJECTS.map((p, i) => slideHTML(p, i, n)).join('');
  injectIcons(track);

  const nav = document.getElementById('workNav');
  nav.innerHTML = PROJECTS.map((p, i) => `<button type="button" data-go="${i}" aria-label="Show ${p.title}">${p.title}</button>`).join('');
  const bar = document.getElementById('workBar');
  const slides = [...track.children];
  const setActive = (i) => {
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    nav.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i));
    loadPreview(i); if (i + 1 < n) loadPreview(i + 1);
  };
  setActive(0);
  new ResizeObserver(() => document.querySelectorAll('.bview').forEach(fitFrame)).observe(track);

  let st = null;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px) and (min-height: 560px)', () => {
    sec.classList.add('is-pinned');
    let snapT, lastI = -1, programmatic = false;
    const tween = gsap.to(track, {
      x: () => -(track.scrollWidth - track.parentElement.clientWidth),
      ease: 'none',
      scrollTrigger: {
        trigger: sec, pin: true, start: 'top top', end: () => '+=' + n * window.innerHeight * 0.85,
        scrub: 0.4, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate(self) {
          const i = Math.round(self.progress * (n - 1));
          bar.style.transform = `scaleX(${self.progress})`;
          if (i !== lastI) { lastI = i; setActive(i); }
          // one-at-a-time: settle on the nearest project when scrolling pauses inside the gallery
          clearTimeout(snapT);
          if (self.progress > 0.001 && self.progress < 0.999 && !programmatic) {
            snapT = setTimeout(() => {
              const target = self.start + (Math.round(self.progress * (n - 1)) / (n - 1)) * (self.end - self.start);
              if (Math.abs(window.scrollY - target) > 4) lenis.scrollTo(target, { duration: 0.7, lock: false });
            }, 140);
          }
        },
      },
    });
    st = tween.scrollTrigger;
    const onNav = (e) => { const b = e.target.closest('[data-go]'); if (b) goTo(+b.dataset.go); };
    nav.addEventListener('click', onNav);
    window.__goProj = goTo;
    function goTo(i) {
      programmatic = true;
      const y = st.start + (i / (n - 1)) * (st.end - st.start);
      lenis.scrollTo(y, { duration: 1.3, onComplete: () => { programmatic = false; } });
      setTimeout(() => { programmatic = false; }, 1700);
    }
    return () => { sec.classList.remove('is-pinned'); nav.removeEventListener('click', onNav); st = null; gsap.set(track, { clearProps: 'transform' }); bar.style.transform = ''; };
  });
  mm.add('(max-width: 860px), (max-height: 559px)', () => {
    // touch/narrow/short screens: native swipe with scroll-snap (no scroll-jacking)
    const onScroll = () => {
      const i = Math.round(track.scrollLeft / (slides[0].offsetWidth + 16));
      setActive(Math.min(n - 1, Math.max(0, i)));
      bar.style.transform = `scaleX(${track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth)})`;
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    const goTo = (i) => {
      lenis.scrollTo(sec, { offset: -70, duration: 1 });
      setTimeout(() => track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' }), 650);
    };
    const onNav = (e) => { const b = e.target.closest('[data-go]'); if (b) goTo(+b.dataset.go); };
    nav.addEventListener('click', onNav);
    window.__goProj = goTo;
    return () => { track.removeEventListener('scroll', onScroll); nav.removeEventListener('click', onNav); };
  });

  return { goTo: (i) => window.__goProj && window.__goProj(i), projects: PROJECTS };
}
