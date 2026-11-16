// components.mjs — HTML helpers for the shared components. Each returns a string.
// Styles live in site/styles/02-components.css. Sections and pages compose these;
// they should not restyle them.
import { icon, chevron } from './icons.mjs';
import { escapeHtml as e } from './site.mjs';

const attrs = (extra = {}) => Object.entries(extra).filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${e(v)}"`).join('');

// Buttons. variant: 'dark' (sm|md|hero), 'white', 'outline', 'quiet'.
export function button({ label, href, variant = 'dark', size = 'md', chev = false, className = '', type, ...rest }) {
  const sizeClass = variant === 'dark' ? ` btn-${size}` : '';
  const cls = `btn btn-${variant}${sizeClass}${className ? ` ${className}` : ''}`;
  const inner = `<span>${e(label)}</span>${chev ? chevron() : ''}`;
  return href ? `<a class="${cls}" href="${e(href)}"${attrs(rest)}>${inner}</a>` : `<button class="${cls}" type="${type || 'button'}"${attrs(rest)}>${inner}</button>`;
}

export const explore = (href, label = 'Explore') => button({ label, href, variant: 'outline', chev: true });

export const tag = (label, className = '') => `<span class="tag${className ? ` ${className}` : ''}">${e(label)}</span>`;
export const pillGlass = (label, href) => `<a class="pill-glass" href="${e(href)}"><span>${e(label)}</span>${chevron()}</a>`;
export const chipGlass = label => `<span class="chip-glass"><i class="signal-square" aria-hidden="true"></i>${e(label)}</span>`;
export const labelMono = (label, neutral = false) => `<span class="label-mono${neutral ? ' is-neutral' : ''}">${e(label)}</span>`;
export const seal = (big, small) => `<div class="seal"><span><strong>${e(big)}</strong>${e(small)}</span></div>`;

// Module header: tag, 44px heading, 20px stone subline, outline Explore button on the right.
export function sectionHead({ tagLabel, title, sub, href, linkLabel = 'Explore', level = 'h2', id }) {
  return `<header class="section-head" data-reveal>${tagLabel ? tag(tagLabel) : ''}<${level} class="t-heading-lg"${id ? ` id="${id}"` : ''}>${title}</${level}>${href ? explore(href, linkLabel) : ''}${sub ? `<p class="section-sub">${sub}</p>` : ''}</header>`;
}

// Feature accordion (the module lists). items: [{ icon, title, text }]. The first item starts open.
// data-features turns on hover/click/auto-advance (site/scripts/20-features.js); data-target
// lets a visual panel follow the open item (elements with data-feature-step="n").
export function features(items, { target, interval = 4500 } = {}) {
  return `<div class="features" data-features data-interval="${interval}"${target ? ` data-target="${e(target)}"` : ''}>${items.map((item, i) => `<div class="feature${i === 0 ? ' is-open' : ''}" data-feature="${i}"><button class="feature-title" type="button" aria-expanded="${i === 0}">${icon(item.icon)}<span>${e(item.title)}</span></button><div class="feature-body"><div><p>${e(item.text)}</p></div></div><span class="feature-progress" aria-hidden="true"><i></i></span></div>`).join('')}</div>`;
}

export function field({ label, name, type = 'text', placeholder = '', autocomplete, required = true, minlength, maxlength, hint = '' }) {
  const id = `field-${name}`;
  return `<label class="field" for="${id}"><span class="field-label">${e(label)}</span><input class="input" id="${id}" name="${e(name)}" type="${type}" placeholder="${e(placeholder)}"${attrs({ autocomplete, required, minlength, maxlength })}>${hint ? `<span class="field-hint">${e(hint)}</span>` : ''}</label>`;
}

export { icon, chevron };
