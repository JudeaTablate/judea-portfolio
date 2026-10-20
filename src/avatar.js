import gsap from 'gsap';

// Hand-built SVG walking avatar (red boots!). Walks along the bottom while you scroll; flips with direction.
const AVATAR_SVG = `
<svg viewBox="12 4 76 192" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse class="av-shadow" cx="50" cy="193" rx="22" ry="3.2" fill="rgba(0,0,0,.28)"/>
  <g class="av-body">
    <!-- back arm -->
    <g class="av-arm av-arm-b"><path d="M33 64 q-12 8 -13 32 l-3 6 q6 4 11 0 l3 -6 q4 -14 10 -26Z" fill="#6c6a2c"/><path d="M17 102 q6 6 11 0 l-1 5 q-5 3 -9 0Z" fill="#6c6a2c" opacity=".8"/><circle cx="22" cy="106" r="3.6" fill="#d89a76"/></g>
    <!-- legs -->
    <g class="av-leg av-leg-b"><rect x="51" y="121" width="9" height="46" rx="4.2" fill="#d89a76"/><path d="M49 163 h13 l1 20 q1 6 -6 6 h-10 q-3 -1 -2 -6Z" fill="#c9121f"/><path d="M48.5 186 h15 v4 h-15Z" fill="#7d0a12"/></g>
    <g class="av-leg av-leg-f"><rect x="40" y="121" width="9" height="46" rx="4.2" fill="#e3a782"/><path d="M38 163 h13 l1 20 q1 6 -6 6 h-10 q-3 -1 -2 -6Z" fill="#e0202d"/><path d="M37.5 186 h15 v4 h-15Z" fill="#9a0f19"/></g>
    <!-- skirt (checker) -->
    <path d="M32 106 h36 l5 24 h-46Z" fill="#3a3418"/>
    <g fill="#8d8a3d"><rect x="32" y="108" width="6" height="6"/><rect x="44" y="108" width="6" height="6"/><rect x="56" y="108" width="6" height="6"/><rect x="38" y="114" width="6" height="6"/><rect x="50" y="114" width="6" height="6"/><rect x="62" y="114" width="5" height="6"/><rect x="29" y="120" width="6" height="6"/><rect x="41" y="120" width="6" height="6"/><rect x="53" y="120" width="6" height="6"/><rect x="65" y="120" width="6" height="6"/></g>
    <!-- torso: olive mesh + floral cami -->
    <path d="M32 62 q18 -6 36 0 l2 46 h-40Z" fill="#6c6a2c"/>
    <path d="M36 66 q14 -4 28 0 l2 38 h-32Z" fill="#2a1a1c"/>
    <g fill="#d3202c"><circle cx="43" cy="74" r="3.4"/><circle cx="56" cy="80" r="3.6"/><circle cx="46" cy="90" r="3.4"/><circle cx="58" cy="96" r="3"/><circle cx="41" cy="100" r="2.6"/></g>
    <g fill="#c9b79a"><circle cx="43" cy="74" r="1"/><circle cx="56" cy="80" r="1"/><circle cx="46" cy="90" r="1"/></g>
    <!-- red belt -->
    <rect x="32" y="104" width="38" height="5.4" rx="2" fill="#e0202d"/><ellipse cx="51" cy="106.7" rx="4.2" ry="3" fill="#d8d6d0"/><ellipse cx="51" cy="106.7" rx="1.6" ry="1.2" fill="#e0202d"/>
    <!-- neck + head -->
    <rect x="46" y="52" width="9" height="12" rx="3.5" fill="#d89a76"/>
    <path d="M31 40 q0 -34 20 -34 q20 0 20 34 q1 30 -5 42 l-6 -10 h-18 l-6 10 q-6 -12 -5 -42Z" fill="#4a1620"/>
    <ellipse cx="51" cy="38" rx="15.5" ry="19" fill="#e3a782"/>
    <path d="M34 30 q17 -17 33 0 q-4 -13 -16 -13 q-12 0 -17 13Z" fill="#4a1620"/>
    <!-- polka headband -->
    <path d="M32 27 q19 -17 38 0 l-2.5 4.6 q-16.5 -14 -33 0Z" fill="#a8192a"/>
    <g fill="#fff"><circle cx="38" cy="24.5" r="1.1"/><circle cx="45" cy="19.8" r="1.1"/><circle cx="53" cy="18.5" r="1.1"/><circle cx="61" cy="21.5" r="1.1"/><circle cx="66" cy="26" r="1.1"/></g>
    <!-- face -->
    <g class="av-eyes"><ellipse cx="44.5" cy="38" rx="1.9" ry="2.3" fill="#2a1216"/><ellipse cx="57.5" cy="38" rx="1.9" ry="2.3" fill="#2a1216"/></g>
    <path d="M45 46.5 q6 5 12 0" stroke="#8a2a3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="43.5" r="3" fill="#ef8f86" opacity=".45"/><circle cx="62" cy="43.5" r="3" fill="#ef8f86" opacity=".45"/>
    <circle cx="33" cy="42" r="1.8" fill="none" stroke="#d6a24a" stroke-width="1.2"/>
    <!-- front arm -->
    <g class="av-arm av-arm-f"><path d="M69 64 q12 8 13 32 l3 6 q-6 4 -11 0 l-3 -6 q-4 -14 -10 -26Z" fill="#6c6a2c"/><path d="M86 102 q-6 6 -11 0 l1 5 q5 3 9 0Z" fill="#6c6a2c" opacity=".8"/><circle cx="81" cy="106" r="3.6" fill="#e3a782"/></g>
  </g>
</svg>`;

export function initAvatar(lenis) {
  const host = document.createElement('div');
  host.id = 'walker';
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', 'Animated avatar of Judea walking along the page as you scroll');
  host.innerHTML = `<div class="walker-flip">${AVATAR_SVG}</div>`;
  document.body.appendChild(host);
  const flip = host.querySelector('.walker-flip');

  const W = () => host.offsetWidth;
  const setX = gsap.quickTo(host, 'x', { duration: 0.6, ease: 'power2.out' });
  let dir = 1, idleT;
  const update = () => {
    const max = window.innerWidth - W() - 6;
    const doc = document.documentElement;
    const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)));
    setX(p * max);
  };
  const onScroll = (e) => {
    const v = e && typeof e.velocity === 'number' ? e.velocity : 0;
    if (Math.abs(v) > 0.05) {
      const nd = v > 0 ? 1 : -1;
      if (nd !== dir) { dir = nd; gsap.to(flip, { scaleX: dir, duration: 0.25 }); }
    }
    host.classList.add('walking');
    clearTimeout(idleT);
    idleT = setTimeout(() => host.classList.remove('walking'), 220);
    update();
  };
  lenis.on('scroll', onScroll);
  window.addEventListener('resize', update);
  update();
}
