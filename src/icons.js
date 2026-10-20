// Custom hand-drawn SVG icon set (replaces all emojis). Stroke uses currentColor.
const s = (body, vb = 32) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICONS = {
  brain: s('<path d="M12 6.5a4 4 0 0 0-4 4 3.6 3.6 0 0 0-2 3.2 3.6 3.6 0 0 0 2 3.2 4 4 0 0 0 4 4.6V6.5Z"/><path d="M20 6.5a4 4 0 0 1 4 4 3.6 3.6 0 0 1 2 3.2 3.6 3.6 0 0 1-2 3.2 4 4 0 0 1-4 4.6V6.5Z"/><circle cx="16" cy="9" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="23" r="1.2" fill="currentColor"/><path d="M8.5 13.5h3M20.5 13.5h3M9 19h3M20 19h3"/>'),
  tools: s('<rect x="3.5" y="6" width="25" height="20" rx="4"/><path d="m11 13 -4 3 4 3M21 13l4 3-4 3M17.5 12l-3 8"/>'),
  cap: s('<path d="M16 6 3 12.5 16 19l13-6.5L16 6Z"/><path d="M8 15.5V21c0 1.8 3.6 3.5 8 3.5s8-1.7 8-3.5v-5.5"/><path d="M29 12.5V20"/><circle cx="29" cy="21.5" r="1.3" fill="currentColor"/>'),
  sparkle: s('<path d="M16 3c.8 6.2 3.8 9.2 10 10-6.2.8-9.2 3.8-10 10-.8-6.2-3.8-9.2-10-10 6.2-.8 9.2-3.8 10-10Z"/><path d="M26 23c.3 2.2 1.3 3.2 3.5 3.5-2.2.3-3.2 1.3-3.5 3.5-.3-2.2-1.3-3.2-3.5-3.5 2.2-.3 3.2-1.3 3.5-3.5Z" stroke-width="1.4"/>'),
  sun: s('<circle cx="16" cy="16" r="5.5"/><path d="M16 3.5v3M16 25.5v3M3.5 16h3M25.5 16h3M7.2 7.2l2.1 2.1M22.7 22.7l2.1 2.1M7.2 24.8l2.1-2.1M22.7 9.3l2.1-2.1"/>'),
  moon: s('<path d="M25.5 19.5A10.5 10.5 0 0 1 12.5 6.5a10.5 10.5 0 1 0 13 13Z"/><path d="M22 6v3M20.5 7.5h3" stroke-width="1.4"/>'),
  music: s('<path d="M12 23V8l13-3v15"/><circle cx="9" cy="23" r="3.2"/><circle cx="22" cy="20" r="3.2"/>'),
  mute: s('<path d="M5 12h4l6-5v18l-6-5H5Z"/><path d="m21 12 6 8M27 12l-6 8"/>'),
  chevron: s('<path d="m8 12 8 8 8-8"/>'),
  arrow: s('<path d="M9 23 23 9M11 9h12v12"/>'),
  boot: s('<path d="M11 4h8v12l7 4.5V27H8V4h3Z"/><path d="M8 22h18" stroke-width="1.4"/>'),
};

export function injectIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const svg = ICONS[el.dataset.icon];
    if (svg && !el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', svg);
  });
}
