// Builds the optimized images for the home page (public/index.html).
//
// Inputs (not committed):
//   site-assets/screens/IMG_*.PNG   app screenshots, 1320x2868
//   <film dir>/hf_*.png             film photos, 1520x2688 / 2688x1520, from
//                                   https://d8j0ntlcm91z4.cloudfront.net/user_3KQb1omejfFlxfWO8iaBQE5a8Xz/
//
// Run (sharp is not a project dependency on purpose):
//   npx -p sharp@0.34.3 node scripts/build-site-assets.mjs <film dir>
//
// Every output width is chosen so the height is a whole number at the exact
// source aspect ratio; nothing is stretched.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filmDir = process.argv[2];
if (!filmDir) throw new Error('usage: build-site-assets.mjs <film dir>');

const out = path.join(root, 'public/assets/v1');
const screensIn = path.join(root, 'site-assets/screens');

const FILM = {
  // portrait set, 1520x2688: widths are multiples of 95 -> exact heights
  p1: 'hf_20261017_211454_404ba5e3-e65f-44e8-a97f-b3d9f3d0d7a8.png',
  p2: 'hf_20261017_210605_c0ec7b35-1197-480f-a67d-c156d3a33c8a.png',
  p3: 'hf_20261017_210608_f9f26a55-092f-463c-98b6-91e3069a5b76.png',
  p4: 'hf_20261017_210606_9dc3ead0-3d4c-463a-a9bd-b7df8e9ff3e1.png',
  p5: 'hf_20261017_211455_d2ebd5ba-dbf4-4758-a533-6eec16a90e93.png',
  // landscape set, 2688x1520: widths are multiples of 168 -> exact heights
  l1: 'hf_20261017_211454_9a3df20b-65f8-4be3-bf9b-daf3629f86ea.png',
  l2: 'hf_20261017_210606_c0591f19-f7ca-4cb8-940a-acc67f64f492.png',
  l3: 'hf_20261017_210607_0f72e89f-6eb9-43fd-aa00-7ed3bc1d879f.png',
  l4: 'hf_20261017_210605_50f54bfe-3264-4b8f-9cd3-4371cab264d8.png',
  l5: 'hf_20261017_211455_48e77bcd-c5f9-40fb-934a-345ed13ddfde.png',
};
const PORTRAIT_W = [570, 760, 950, 1140, 1520];
const LANDSCAPE_W = [1008, 1344, 1680, 2016, 2688];

// Status bar (clock, location arrow, battery) occupies y 74-120 on every
// screenshot and app content starts at y 174; cut the same 150 px from all.
const STATUS_BAR = 150;
const SCREENS = [8550, 8551, 8554, 8559, 8560, 8561, 8567, 8586, 8587, 8588, 8589, 8590, 8591, 8592];
const SCREEN_W = [440, 660, 880]; // 1320x2718 = 220:453 -> multiples of 220

async function write(img, file, kind) {
  const q = kind === 'ui' ? { avif: 64, webp: 86 } : { avif: 52, webp: 78 };
  await img.clone().avif({ quality: q.avif, effort: 6, chromaSubsampling: kind === 'ui' ? '4:4:4' : '4:2:0' }).toFile(file + '.avif');
  await img.clone().webp({ quality: q.webp, effort: 6 }).toFile(file + '.webp');
}

async function variants(input, extract, widths, base, kind) {
  const src = extract || (await sharp(input).metadata());
  for (const w of widths) {
    const h = (src.height * w) / src.width;
    if (!Number.isInteger(h)) throw new Error(`${base}-${w}: height ${h} is not whole`);
    let img = sharp(input);
    if (extract) img = img.extract(extract);
    await write(img.resize(w, h, { kernel: 'lanczos3' }), `${base}-${w}`, kind);
  }
}

mkdirSync(path.join(out, 'film'), { recursive: true });
mkdirSync(path.join(out, 'screens'), { recursive: true });

for (const [key, file] of Object.entries(FILM)) {
  const widths = key.startsWith('p') ? PORTRAIT_W : LANDSCAPE_W;
  await variants(path.join(filmDir, file), null, widths, path.join(out, 'film', key), 'photo');
  console.log('film', key);
}

// Handwritten list from the first portrait frame, starting just below the
// paper's top edge (L 0.5457 -> y 1467). 840x1218 = 20:29.
await variants(path.join(filmDir, FILM.p1), { left: 60, top: 1470, width: 840, height: 1218 }, [420, 640, 840], path.join(out, 'film', 'paper'), 'photo');
console.log('paper');

for (const n of SCREENS) {
  await variants(path.join(screensIn, `IMG_${n}.PNG`), { left: 0, top: STATUS_BAR, width: 1320, height: 2868 - STATUS_BAR }, SCREEN_W, path.join(out, 'screens', String(n)), 'ui');
  console.log('screen', n);
}

// Seasonal badges (Meyve header, Mandalina, Nar) from IMG_8550. 1320x528 = 5:2.
await variants(path.join(screensIn, 'IMG_8550.PNG'), { left: 0, top: 1012, width: 1320, height: 528 }, [440, 660, 880], path.join(out, 'screens', '8550-season'), 'ui');
console.log('season strip');
