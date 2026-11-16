// generate-images.mjs — paints every image the marketing site uses with Gemini's image model
// ("Nano Banana") and saves them as webp in public/assets/img/.
//
//   npm run images                     (all images)
//   npm run images -- --only=hero,sky  (some images; names below)
//   npm run images -- --dry-run        (print the prompts; no network, no key needed)
//
// The API key is read only from process.env.GEMINI_API_KEY. `npm run images` loads it from
// .env.local, which is gitignored (.env* in .gitignore). The key is never printed or logged.
// Optional: GEMINI_IMAGE_MODEL overrides the model (default gemini-2.5-flash-image).
//
// Every prompt starts with the same locked style prompt so all images read as one series.
// Filenames and pixel sizes match the `images` registry in site/lib/site.mjs, which is also
// the single source of the alt text.
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const run = promisify(execFile);
const outDir = fileURLToPath(new URL('../public/assets/img/', import.meta.url));
const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

export const STYLE = 'Soft painterly watercolor illustration on cold-press paper. Palette limited to misty lavender, muted sage green and warm cream, with gentle peach-cream light where noted. Loose wet-on-wet washes, soft blooms and feathered edges, visible paper grain, delicate dry-brush texture in the foreground, calm and airy mood, plenty of breathing room. No text, no letters, no numbers, no logos, no signatures, no watermarks, no borders, no frames, no user interface, no people’s faces.';

// Scenes that sit behind text must reach every edge; a white paper border would show as a box.
const FULL_BLEED = 'Full-bleed composition: paint covers the entire canvas edge to edge, including all four corners. No white border, no unpainted paper margin, no vignette, no frame.';

export const jobs = [
  { name: 'hero', file: 'hero-16x9.webp', width: 2400, height: 1350, aspectRatio: '16:9', fadeBottom: 0.34,
    fullBleed: true,
    prompt: 'Wide landscape at dawn, not sunset. The sky fills the whole top edge with layered lavender and lavender-grey cloud washes, with a soft cream and pale peach glow low on the horizon. Several ranges of misty lavender hills in deeper, confident mid-tones (dusty violet and lavender-grey, clearly darker than the sky) cross the full width at about 40% height, with mist pooling in the valleys. Rich sage meadows with tiny cream and lilac wildflowers sweep in from the far left and far right edges, painted with confident saturated washes. A clearly visible pale sandy footpath, the hero of the picture, winds in an S-curve from the lower left foreground up through the meadow and disappears toward the distant hills; its edges are defined by darker sage grass. The middle of the image, just below the hills, is calm and open so a headline can sit there. The bottom third is very pale cream mist that fades into plain off-white (#f7f7f5) at the bottom edge, with meadow grasses only at the far left and right.' },
  { name: 'hero', file: 'hero-4x5.webp', width: 1080, height: 1350, aspectRatio: '4:5', fadeBottom: 0.36,
    fullBleed: true,
    prompt: 'Portrait crop of the same dawn landscape. Layered lavender and lavender-grey cloud washes fill the whole top edge, a soft cream and pale peach dawn glow sits on the horizon, misty lavender hills in deeper dusty-violet mid-tones cross the full width at about 40% height, and sage meadows with tiny cream flowers reach in from both side edges. A clearly visible pale sandy footpath, edged by darker sage grass, winds in an S-curve from the lower centre up toward the hills. Quiet, open middle for a headline. The bottom 40% is very pale cream mist fading into plain off-white (#f7f7f5) at the bottom edge.' },
  { name: 'sky', file: 'sky.webp', width: 2400, height: 1240, aspectRatio: '16:9',
    fullBleed: true,
    prompt: 'A wide horizontal band of open sky seen straight ahead, nothing but sky and clouds: soft billowing cream and pale lavender clouds gather along the left and right edges and drift along the top and bottom edges, over a dusky lavender-blue sky. For this image use only lavender, lavender-blue, cream and pale peach: no green anywhere, cloud shadows are soft lavender-grey. The centre is open, calm sky in a deep, saturated dusky lavender-blue (around #6f78a8), clearly darker than the clouds, so white text placed there stays readable. Absolutely no land, no ground, no grass, no hills, no horizon, no trees, no leaves, no plants.' },
  { name: 'footer', file: 'footer.webp', width: 2400, height: 1400, aspectRatio: '16:9',
    fullBleed: true,
    prompt: 'A meadow at dusk: a lone rounded tree on the left, a tiny wooden bench far away on a gentle sage hill, distant lavender mountains with soft cream light on their peaks. The upper third is a deeper dusky lavender sky, dark enough that white text placed over it reads clearly. Sage meadow with small cream flowers along the bottom.' },
  { name: 'lessons', file: 'lesson-foundations.webp', width: 1440, height: 1080, aspectRatio: '4:3',
    prompt: 'Simple centred motif: a small sage-green field seen from slightly above, with rows of tiny seeds laid out in a gentle spiral pattern, two small sprouts just coming up among them, soft cream and pale lavender washes around it. Clearly recognisable seeds and sprouts, minimal, lots of quiet space around the motif.' },
  { name: 'lessons', file: 'lesson-tools.webp', width: 1440, height: 1080, aspectRatio: '4:3',
    prompt: 'Simple centred motif: a small glowing lantern resting beside a winding lavender path that curves into soft mist, warm cream light around the lantern. Minimal, lots of quiet space around the motif.' },
  { name: 'lessons', file: 'lesson-ethics.webp', width: 1440, height: 1080, aspectRatio: '4:3',
    prompt: 'Simple centred motif: two hands, seen only from the wrists, gently cupping a small sage-green sprout in soil, bathed in soft cream light, over lavender washes. Hands only, no faces, no bodies. Minimal, lots of quiet space.' }
];

async function paint(job, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}${job.fullBleed ? ` ${FULL_BLEED}` : ''}\n\n${job.prompt}` }] }],
      generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: job.aspectRatio } }
    }),
    signal: AbortSignal.timeout(180000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${job.file}: the image API answered ${response.status}${data.error?.message ? ` (${data.error.message})` : ''}.`);
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
  if (!part) throw new Error(`${job.file}: no image came back${data.candidates?.[0]?.finishReason ? ` (finish reason: ${data.candidates[0].finishReason})` : ''}.`);
  return Buffer.from(part.inlineData.data, 'base64');
}

// Cover-resize to the exact registry size and save as webp: sharp if installed, else ImageMagick.
// `fadeBottom` (a share of the height) blends the bottom of the image into the page canvas,
// #f7f7f5, so the hero always ends in a pale band the headline can sit on.
const CANVAS = '247,247,245';
async function toWebp(buffer, job) {
  const target = join(outDir, job.file);
  const fade = job.fadeBottom ? Math.round(job.height * job.fadeBottom) : 0;
  try {
    const { default: sharp } = await import('sharp');
    let image = sharp(buffer).resize(job.width, job.height, { fit: 'cover', position: 'attention' });
    if (fade) {
      const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${job.width}" height="${fade}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(${CANVAS})" stop-opacity="0"/><stop offset="0.75" stop-color="rgb(${CANVAS})" stop-opacity="0.92"/><stop offset="1" stop-color="rgb(${CANVAS})"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`);
      image = sharp(await image.toBuffer()).composite([{ input: overlay, gravity: 'south' }]);
    }
    await image.webp({ quality: 82 }).toFile(target);
    return 'sharp';
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  }
  const source = join(tmpdir(), `fairylearn-${process.pid}-${job.file}.png`);
  await writeFile(source, buffer);
  const args = [source, '-resize', `${job.width}x${job.height}^`, '-gravity', 'center', '-extent', `${job.width}x${job.height}`];
  if (fade) args.push('(', '-size', `${job.width}x${fade}`, `gradient:rgba(${CANVAS},0)-rgba(${CANVAS},1)`, ')', '-gravity', 'south', '-composite');
  args.push('-quality', '82', target);
  try {
    for (const bin of ['magick', 'convert']) {
      try { await run(bin, args); return bin; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    throw new Error('Saving webp needs either the sharp package (npm install --no-save sharp) or ImageMagick (magick/convert) on your PATH.');
  } finally { await rm(source, { force: true }); }
}

async function main() {
  const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',').map(s => s.trim()).filter(Boolean);
  const dryRun = process.argv.includes('--dry-run');
  const selected = only ? jobs.filter(job => only.includes(job.name) || only.includes(job.file.replace('.webp', ''))) : jobs;
  if (!selected.length) throw new Error(`Nothing matches --only. Names: ${[...new Set(jobs.map(j => j.name))].join(', ')} (or a filename without .webp).`);

  if (dryRun) {
    console.log(`Style prompt:\n${STYLE}\n`);
    for (const job of selected) console.log(`${job.file} (${job.width}×${job.height}, ${job.aspectRatio})\n${job.fullBleed ? `${FULL_BLEED}\n` : ''}${job.prompt}\n`);
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set. Add it to .env.local (gitignored) and run npm run images.');

  await mkdir(outDir, { recursive: true });
  let failed = 0;
  for (const job of selected) {
    try {
      const via = await toWebp(await paint(job, apiKey), job);
      console.log(`✓ ${job.file} (${job.width}×${job.height}, saved with ${via})`);
    } catch (error) {
      failed++;
      console.error(`✗ ${error.message}`);
    }
  }
  console.log('Run `npm run build:site` so the local server lists any new files.');
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
