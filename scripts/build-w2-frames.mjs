// Builds the film's cover and final frames for the home page (public/index.html).
// The three photo frames between them (manav, reyon, kasa) are W1's, already in
// public/assets/v1/film (build-site-assets.mjs).
//
// Inputs (committed): site-assets/film/{kapak,final}-{dikey,yatay}.png
//   dikey 1520x2688, yatay 2688x1520 — the same sizes as the photo frames.
//   Horizon (the back edge of the surface, where the word stands):
//     dikey  y = 1290  (--L 0.47991 in index.html)
//     yatay  y = 669   (--L 0.44013)
//   A real frame drawn with its horizon on these rows replaces the file as is.
//   A frame with its horizon elsewhere also needs its --L in index.html
//   (.f-kapak / .f-final, one value per orientation).
//
// Run (sharp is not a project dependency on purpose):
//   npx -p sharp@0.34.3 node scripts/build-w2-frames.mjs [--placeholder]
//   --placeholder  first draws the temporary frames: flat cream, a thin horizon.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'site-assets/film');
const out = path.join(root, 'public/assets/v2/film');

const ORIENT = {
  // key in output names, source suffix, size, horizon row, line thickness
  p: { name: 'dikey', w: 1520, h: 2688, horizon: 1290, line: 3, widths: [570, 760, 950, 1140, 1520] },
  l: { name: 'yatay', w: 2688, h: 1520, horizon: 669, line: 2, widths: [1008, 1344, 1680, 2016, 2688] },
};
const FRAMES = ['kapak', 'final'];

// Page ground and the page's line (rgba(45,139,117,.25) over the ground).
const CREAM = { r: 0xF8, g: 0xF7, b: 0xF4 };
const LINE = { r: 0xC5, g: 0xDC, b: 0xD4 };

async function placeholder(file, o) {
  const line = await sharp({ create: { width: o.w, height: o.line, channels: 3, background: LINE } }).png().toBuffer();
  await sharp({ create: { width: o.w, height: o.h, channels: 3, background: CREAM } })
    .composite([{ input: line, top: o.horizon, left: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}

mkdirSync(srcDir, { recursive: true });
mkdirSync(out, { recursive: true });

for (const frame of FRAMES) {
  for (const [key, o] of Object.entries(ORIENT)) {
    const file = path.join(srcDir, `${frame}-${o.name}.png`);
    if (process.argv.includes('--placeholder')) await placeholder(file, o);
    if (!existsSync(file)) throw new Error(`missing ${file}`);
    const meta = await sharp(file).metadata();
    if (meta.width !== o.w || meta.height !== o.h) throw new Error(`${file}: ${meta.width}x${meta.height}, expected ${o.w}x${o.h}`);
    for (const w of o.widths) {
      const h = (o.h * w) / o.w;
      if (!Number.isInteger(h)) throw new Error(`${frame}-${key}-${w}: height ${h} is not whole`);
      const img = sharp(file).resize(w, h, { kernel: 'lanczos3' });
      const base = path.join(out, `${frame}-${key}-${w}`);
      await img.clone().avif({ quality: 52, effort: 6 }).toFile(base + '.avif');
      await img.clone().webp({ quality: 78, effort: 6 }).toFile(base + '.webp');
    }
    console.log(frame, key);
  }
}
