// icons.mjs — the thin-stroke geometric line icon set (24px grid, 1.5px stroke, currentColor).
// Drawn for this site; no icon library. Use icon('name') or icon('name', 'icon icon-20').

const paths = {
  'chevron-right': '<path d="M9.5 6.5 15 12l-5.5 5.5"/>',
  'chevron-down': '<path d="M6.5 9.5 12 15l5.5-5.5"/>',
  'arrow-right': '<path d="M4 12h15.5M14 6.5l5.5 5.5-5.5 5.5"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
  'arrow-left': '<path d="M20 12H4.5M10 6.5 4.5 12l5.5 5.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  route: '<circle cx="6" cy="18" r="2.25"/><circle cx="18" cy="6" r="2.25"/><path d="M8.25 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.75"/>',
  sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"/><path d="M19 16.5c.25 1.5.75 2 2.25 2.25-1.5.25-2 .75-2.25 2.25-.25-1.5-.75-2-2.25-2.25 1.5-.25 2-.75 2.25-2.25Z"/>',
  book: '<path d="M12 6.5c-1.8-1.3-4.5-2-8-2v13c3.5 0 6.2.7 8 2 1.8-1.3 4.5-2 8-2v-13c-3.5 0-6.2.7-8 2Z"/><path d="M12 6.5v13"/>',
  layers: '<path d="m12 3.5 9 4.75-9 4.75-9-4.75z"/><path d="m3 12.25 9 4.75 9-4.75"/><path d="m3 16.25 9 4.75 9-4.75"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  'check-square': '<rect x="3.75" y="3.75" width="16.5" height="16.5" rx="2.5"/><path d="m8 12.25 2.75 2.75L16.25 9.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12.25 2.75 2.75L16.25 9.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  message: '<path d="M4 5.5h16v11H9.5L5.5 20v-3.5H4z"/>',
  bulb: '<path d="M9 17.5h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9v1.7h5v-1.7c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z"/>',
  flag: '<path d="M5.5 21V4M5.5 4.5h12l-2.5 4 2.5 4h-12"/>',
  map: '<path d="m3.5 6 5.5-2 6 2 5.5-2v14l-5.5 2-6-2-5.5 2z"/><path d="M9 4v14M15 6v14"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M10 15.5h.01M14 15.5h.01"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11.5A8 8 0 0 0 6 6.5L4 8.5M4 4v4.5h4.5"/><path d="M4 12.5a8 8 0 0 0 14 5l2-2M20 20v-4.5h-4.5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.75 5.7 3.75 9S14.5 18.3 12 21c-2.5-2.7-3.75-5.7-3.75-9S9.5 5.7 12 3Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4-2.5-6.5-7-6.5 0 4 2.5 6.5 7 6.5Z"/><path d="M12 14.5c0-3.5 2.2-5.5 6.5-5.5 0 3.5-2.2 5.5-6.5 5.5Z"/>',
  mountain: '<path d="m2.5 19.5 7-12 4 6.5 2.5-3.5 5.5 9z"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
  list: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.75" cy="6.5" r=".75"/><circle cx="4.75" cy="12" r=".75"/><circle cx="4.75" cy="17.5" r=".75"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
  bookmark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>',
  minus: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  wand: '<path d="m4 20 11-11M13.5 7.5l3 3"/><path d="M17.5 3v3M16 4.5h3M20 8.5v2M19 9.5h2"/>',
  steps: '<path d="M3.5 19.5h5v-5h5v-5h5v-5h2"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.25 4.25 0 0 1 12 6.8a4.25 4.25 0 0 1 7.5 2.7c0 5.6-7.5 10-7.5 10Z"/>',
  pencil: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z"/><path d="M13.5 7l3 3"/>',
  device: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M10.5 18h3"/>',
  doc: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
  hint: '<path d="M12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4M3 13h2M19 13h2"/><path d="M8 13a4 4 0 1 1 8 0c0 1.5-.8 2.5-1.5 3.2-.4.4-.5.9-.5 1.3V18h-4v-.5c0-.4-.1-.9-.5-1.3C8.8 15.5 8 14.5 8 13Z"/><path d="M10 21h4"/>',
  trophy: '<path d="M7.5 4h9v6a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5v1.5A3 3 0 0 0 7.6 10.5M16.5 6h3v1.5a3 3 0 0 1-3.1 3M12 14.5V18M8.5 20.5h7"/>'
};

export const iconNames = Object.keys(paths);

export function icon(name, className = 'icon') {
  const body = paths[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const chevron = (className = 'chev') => `<svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5"/></svg>`;

// The Fairylearn mark: a four-point sparkle over a short winding path.
export const brandMark = (className = 'brand-mark') => `<svg class="${className}" viewBox="0 0 26 26" aria-hidden="true" focusable="false"><path d="M13 2.5c.7 5.2 2.8 7.3 8 8-5.2.7-7.3 2.8-8 8-.7-5.2-2.8-7.3-8-8 5.2-.7 7.3-2.8 8-8Z"/><path d="M4.5 23.5c3-1.6 6-1.6 8.5 0s5.5 1.6 8.5 0"/></svg>`;
