// site.mjs — shared site data: navigation, footer links, lesson slugs and the image registry.
import { courseModules } from '../../public/course.mjs';

export const SITE = {
  name: 'Fairylearn AI',
  url: 'https://fairylearn-ai.vercel.app',
  tagline: 'A little curiosity goes a long way.',
  appUrl: '/app',
  signupUrl: '/signup',
  loginUrl: '/login'
};

export const slugify = text => text.toLowerCase().replace(/[’'?]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const lessonSlug = module => slugify(module.title);
export const lessonUrl = module => `/lessons/${lessonSlug(module)}`;
export const freeLessons = courseModules.map(module => ({ ...module, slug: lessonSlug(module), url: lessonUrl(module) }));

export const levelBlurbs = {
  Starter: 'Start with the very basics.',
  Beginner: 'Turn curiosity into confidence.',
  Medium: 'Put your knowledge to work.',
  Expert: 'Explore what’s possible next.'
};

// Top navigation. Items with `menu` open a glass dropdown; `art` adds the line-drawing card.
export const nav = [
  { label: 'Learn', href: '/lessons', key: 'learn', menu: [
    { label: 'Learn', items: [
      { title: 'Lessons', text: 'Three free essentials to start', href: '/lessons' },
      { title: 'Paths', text: 'Four levels, one winding path', href: '/paths' },
      { title: 'Quiz', text: 'See what stuck, one question at a time', href: '/quiz' }
    ] },
    { label: 'Levels', items: Object.entries(levelBlurbs).map(([level, text]) => ({ title: level, text, href: `/paths#${level.toLowerCase()}` })) }
  ] },
  { label: 'Pricing', href: '/pricing', key: 'pricing' },
  { label: 'Company', href: '/about', key: 'company', art: 'path', menu: [
    { items: [
      { title: 'About', text: 'Why Fairylearn exists', href: '/about' },
      { title: 'Sources & credits', text: 'Where our lessons come from', href: '/references' },
      { title: 'Open the app', text: 'Your path, guide and progress', href: '/app' }
    ] }
  ] },
  { label: 'Resources', href: '/lessons', key: 'resources', art: 'shield', menu: [
    { items: [
      { title: 'Sample lesson', text: freeLessons[0].title, href: freeLessons[0].url },
      { title: 'Privacy', text: 'What we keep, and why', href: '/privacy' },
      { title: 'Terms', text: 'The simple rules', href: '/terms' }
    ] }
  ] }
];

export const footerColumns = [
  { title: 'Learn', links: [['Lessons', '/lessons'], ['Paths', '/paths'], ['Quiz', '/quiz']] },
  { title: 'Levels', links: Object.keys(levelBlurbs).map(level => [level, `/paths#${level.toLowerCase()}`]) },
  { title: 'Free lessons', links: freeLessons.map(lesson => [lesson.title, lesson.url]) },
  { title: 'Account', links: [['Start free', '/signup'], ['Log in', '/login'], ['Open the app', '/app']] },
  { title: 'Company', links: [['About', '/about'], ['Pricing', '/pricing'], ['Sources & credits', '/references']] },
  { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms']] }
];

// Every image the site uses. Files live in public/assets/img and are produced by
// scripts/generate-images.mjs (one locked style prompt). `alt` is the text screen readers hear.
export const images = {
  heroWide: { src: '/assets/img/hero-16x9.webp', width: 2400, height: 1350, alt: 'A watercolor landscape at dawn: a pale path winds through sage meadows toward misty lavender hills under soft lavender clouds.' },
  heroTall: { src: '/assets/img/hero-4x5.webp', width: 1080, height: 1350, alt: 'A watercolor landscape at dawn: a pale path winds through sage meadows toward misty lavender hills under soft lavender clouds.' },
  sky: { src: '/assets/img/sky.webp', width: 2400, height: 1240, alt: 'Soft cream and peach watercolor clouds framing a deep lavender-blue sky.' },
  footer: { src: '/assets/img/footer.webp', width: 2400, height: 1400, alt: 'A watercolor meadow at dusk with a lone tree, a small bench and lavender mountains under a dusky sky.' },
  lessonFoundations: { src: '/assets/img/lesson-foundations.webp', width: 1440, height: 1080, alt: 'Watercolor illustration of seeds laid in a gentle spiral on a small sage field, with two sprouts coming up.' },
  lessonTools: { src: '/assets/img/lesson-tools.webp', width: 1440, height: 1080, alt: 'Watercolor illustration of a glowing lantern beside a winding path through lavender and sage bushes.' },
  lessonEthics: { src: '/assets/img/lesson-ethics.webp', width: 1440, height: 1080, alt: 'Watercolor illustration of two hands cupping a small sprouting plant in cream light.' }
};
export const lessonImage = { foundations: images.lessonFoundations, tools: images.lessonTools, ethics: images.lessonEthics };

export function picture(image, { className = '', loading = 'lazy', sizes = '100vw', fetchpriority, alt } = {}) {
  return `<img class="${className}" src="${image.src}" width="${image.width}" height="${image.height}" alt="${escapeHtml(alt ?? image.alt)}" loading="${loading}" decoding="async" sizes="${sizes}"${fetchpriority ? ` fetchpriority="${fetchpriority}"` : ''}>`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
