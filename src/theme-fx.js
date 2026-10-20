import gsap from 'gsap';

// Sunrise (dark -> light) and sunset / night-falls (light -> dark) full-screen transition.
let busy = false;
export function themeTransition(toLight, swap) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (busy) return;
  if (reduce) { swap(); return; }
  busy = true;
  const fx = document.createElement('div');
  fx.id = 'themeFx';
  const stars = Array.from({ length: 36 }, () =>
    `<i style="left:${Math.random() * 100}%;top:${Math.random() * 62}%;width:${1 + Math.random() * 2.5}px;height:${1 + Math.random() * 2.5}px;animation-delay:${Math.random() * 1.5}s"></i>`).join('');
  fx.innerHTML = `
    <div class="fx-night"></div><div class="fx-dawn"></div>
    <div class="fx-stars">${stars}</div>
    <div class="fx-sun"></div><div class="fx-moon"></div>
    <div class="fx-hills"></div>
    <div class="fx-label">${toLight ? 'good morning' : 'lights out'}</div>`;
  document.body.appendChild(fx);
  const q = (s) => fx.querySelector(s);
  const vh = window.innerHeight;
  const tl = gsap.timeline({ onComplete: () => { fx.remove(); busy = false; } });

  if (toLight) {
    gsap.set(q('.fx-night'), { opacity: 1 });
    gsap.set(q('.fx-dawn'), { opacity: 0 });
    gsap.set(q('.fx-moon'), { y: vh * 0.1, opacity: 0.9 });
    gsap.set(q('.fx-sun'), { y: vh * 0.75 });
    gsap.set(q('.fx-stars'), { opacity: 1 });
    gsap.set(fx, { opacity: 0 });
    tl.to(fx, { opacity: 1, duration: 0.25 })
      .to(q('.fx-moon'), { y: vh * 0.6, opacity: 0, duration: 0.9, ease: 'power2.in' }, 0.1)
      .to(q('.fx-sun'), { y: vh * 0.08, duration: 1.3, ease: 'power2.out' }, 0.2)
      .to(q('.fx-dawn'), { opacity: 1, duration: 1.1, ease: 'sine.inOut' }, 0.3)
      .to(q('.fx-stars'), { opacity: 0, duration: 0.7 }, 0.3)
      .to(q('.fx-label'), { opacity: 1, y: 0, duration: 0.5 }, 0.7)
      .add(swap, 1.25)
      .to(fx, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 1.55);
  } else {
    gsap.set(q('.fx-night'), { opacity: 0 });
    gsap.set(q('.fx-dawn'), { opacity: 1 });
    gsap.set(q('.fx-sun'), { y: vh * 0.08 });
    gsap.set(q('.fx-moon'), { y: vh * 0.7, opacity: 0 });
    gsap.set(q('.fx-stars'), { opacity: 0 });
    gsap.set(fx, { opacity: 0 });
    tl.to(fx, { opacity: 1, duration: 0.25 })
      .to(q('.fx-sun'), { y: vh * 0.8, duration: 1.2, ease: 'power2.in', backgroundColor: '#ff7a59' }, 0.2)
      .to(q('.fx-dawn'), { opacity: 0, duration: 1.1 }, 0.3)
      .to(q('.fx-night'), { opacity: 1, duration: 1.1 }, 0.3)
      .to(q('.fx-stars'), { opacity: 1, duration: 0.9 }, 0.7)
      .to(q('.fx-moon'), { y: vh * 0.12, opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.5)
      .to(q('.fx-label'), { opacity: 1, y: 0, duration: 0.5 }, 0.7)
      .add(swap, 1.3)
      .to(fx, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 1.6);
  }
}
