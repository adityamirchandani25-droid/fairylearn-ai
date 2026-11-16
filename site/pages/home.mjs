// home.mjs — the landing page. Sections live in site/sections/ and render in this order.
import hero from '../sections/hero.mjs';
import levels from '../sections/levels.mjs';
import stats from '../sections/stats.mjs';
import sky from '../sections/sky.mjs';
import modules from '../sections/modules.mjs';
import how from '../sections/how.mjs';
import free from '../sections/free.mjs';
import samples from '../sections/samples.mjs';
import { images } from '../lib/site.mjs';

export default function home() {
  return {
    path: '/',
    file: 'index.html',
    title: '',
    description: 'Fairylearn AI finds where you are, then lays a gentle path of short lessons, quizzes and an AI guide for curious high school students. Free to start.',
    bodyClass: 'page-home',
    preload: [`href="${images.heroWide.src}" as="image" type="image/webp" media="(min-width: 768px)" fetchpriority="high"`, `href="${images.heroTall.src}" as="image" type="image/webp" media="(max-width: 767px)" fetchpriority="high"`],
    body: [hero(), levels(), stats(), sky(), modules(), how(), free(), samples()].join('\n')
  };
}
