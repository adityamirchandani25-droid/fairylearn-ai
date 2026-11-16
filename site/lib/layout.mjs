// layout.mjs — the document shell every page shares: <head>, nav, mobile menu, footer and
// the cookie panel. A page module returns { title, description, body, current, ... } and
// build.mjs wraps it with document().
import { nav, footerColumns, SITE, picture, images, escapeHtml as e } from './site.mjs';
import { brandMark, chevron } from './icons.mjs';
import { button } from './components.mjs';

const menuArt = {
  path: '<svg viewBox="0 0 160 120"><path d="M8 104c22-4 30-18 46-30s34-6 44-22 6-30 30-38"/><circle cx="128" cy="14" r="4"/><circle cx="54" cy="74" r="2.5"/><circle cx="98" cy="52" r="2.5"/><path d="M128 14v-10l10 4-10 4"/></svg>',
  shield: '<svg viewBox="0 0 160 120"><path d="M80 10 44 24v26c0 24 15 42 36 50 21-8 36-26 36-50V24z"/><path d="M80 34c1.6 11 5.6 15 16.5 16.5-10.9 1.5-14.9 5.5-16.5 16.5-1.6-11-5.6-15-16.5-16.5C74.4 49 78.4 45 80 34Z"/></svg>'
};

function navItem(item, current) {
  const isCurrent = current === item.key;
  if (!item.menu) return `<li class="nav-item"><a class="nav-link" href="${item.href}"${isCurrent ? ' aria-current="page"' : ''}>${item.label}</a></li>`;
  const cols = item.menu.map(col => `<div class="nav-menu-col">${col.label ? `<span class="nav-menu-label">${col.label}</span>` : ''}${col.items.map(link => `<a class="nav-menu-item" href="${link.href}"><b>${e(link.title)}</b><span>${e(link.text)}</span></a>`).join('')}</div>`).join('');
  const art = item.art ? `<div class="nav-menu-art" aria-hidden="true">${menuArt[item.art]}</div>` : '';
  return `<li class="nav-item" data-nav-item><a class="nav-link" href="${item.href}" aria-haspopup="true" aria-expanded="false"${isCurrent ? ' aria-current="page"' : ''}>${item.label}</a><div class="nav-menu${item.art ? ' has-art' : ''}">${cols}${art}</div></li>`;
}

export function siteNav(current) {
  return `<header class="site-nav" data-nav>
  <div class="nav-blur" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="nav-wash" aria-hidden="true"></div>
  <nav class="nav-inner" aria-label="Main">
    <a class="brand" href="/" aria-label="Fairylearn AI home">${brandMark()}<span>fairylearn</span></a>
    <ul class="nav-links">${nav.map(item => navItem(item, current)).join('')}</ul>
    <div class="nav-right">
      <a class="nav-login" href="${SITE.loginUrl}">Log in</a>
      ${button({ label: 'Start free', href: SITE.signupUrl, size: 'sm' })}
      <button class="nav-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu" data-burger><i></i><i></i></button>
    </div>
  </nav>
</header>
<div class="mobile-menu" id="mobile-menu" data-mobile-menu>
  ${nav.map(item => `<div class="mobile-menu-group">${item.menu ? `<span>${item.label}</span>` : ''}${item.menu ? item.menu.flatMap(col => col.items).filter(link => !link.href.includes('#')).map(link => `<a href="${link.href}">${e(link.title)}</a>`).join('') : `<a href="${item.href}">${item.label}</a>`}</div>`).join('')}
  <div class="mobile-menu-actions">${button({ label: 'Start free', href: SITE.signupUrl, size: 'md', className: 'btn-block' })}${button({ label: 'Log in', href: SITE.loginUrl, variant: 'outline', className: 'btn-block' })}</div>
</div>`;
}

export function siteFooter() {
  return `<footer class="site-footer">
  <div class="footer-art">${picture(images.footer, { alt: '' })}</div>
  <div class="footer-inner">
    <div class="footer-cols">${footerColumns.map(col => `<div class="footer-col"><h3>${col.title}</h3><ul>${col.links.map(([label, href]) => `<li><a href="${href}">${e(label)}</a></li>`).join('')}</ul></div>`).join('')}</div>
    <div class="footer-bottom">
      <div class="footer-legal"><span>© Fairylearn 2026</span><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/references">Sources &amp; credits</a></div>
      <div class="footer-note"><span class="brand">${brandMark()}</span><span>${SITE.tagline}</span></div>
    </div>
  </div>
</footer>`;
}

export function cookiePanel() {
  return `<div class="cookie" data-cookie hidden role="region" aria-label="Storage notice">
  <div class="cookie-panel"><p>We store your progress in your browser, never for ads. No tracking. <a href="/privacy">Privacy</a></p><button class="btn btn-quiet" type="button" data-cookie-ok>Okay</button></div>
</div>`;
}

export function document({ title, description, body, current = '', bodyClass = '', head = '', scripts = [], path = '/', preload = [] }) {
  const fullTitle = title ? `${title} — Fairylearn AI` : 'Fairylearn AI — A little curiosity goes a long way.';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title>
<meta name="description" content="${e(description)}">
<meta name="theme-color" content="#f7f7f5">
<link rel="canonical" href="${SITE.url}${path}">
<meta property="og:title" content="${e(fullTitle)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:image" content="${SITE.url}${images.heroWide.src}">
<meta property="og:type" content="website">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
${preload.map(p => `<link rel="preload" ${p}>`).join('\n')}
<link rel="stylesheet" href="/assets/site.css">
<script>document.documentElement.classList.add('js');if(/(^|[#&])(access_token|error)=/.test(location.hash)&&location.pathname!=='/app')location.replace('/app'+location.hash);</script>
${head}
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to content</a>
${siteNav(current)}
<main id="main">
${body}
</main>
${siteFooter()}
${cookiePanel()}
<script src="/assets/site.js" defer></script>
${scripts.map(src => `<script type="module" src="${src}"></script>`).join('\n')}
</body>
</html>
`;
}
