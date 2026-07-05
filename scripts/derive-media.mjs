/**
 * Derives per-asset metadata for everything in public/projects/<id>/:
 *   - content hash (cache-busting version that only changes when the file changes)
 *   - pixel dimensions (stable layout with zero runtime probing)
 *   - LQIP: tiny blurred WebP inlined as a data URI (instant placeholder, no network)
 *   - video posters: first frame as WebP in public/projects/_derived/<id>/
 *
 * Output: src/content/media-derived.json (committed) + poster files (committed).
 * Requires ffmpeg/ffprobe. When they are missing (e.g. Netlify build image) the
 * script exits 0 and generate-project-media.mjs reuses the committed data, so
 * this only needs to run locally when media files change.
 *
 * Run: node scripts/derive-media.mjs   (also wired into predev/prebuild)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync, spawnSync } from 'child_process';

const PROJECT_IDS = [
  'meta',
  'fellow',
  'general-collaboration',
  'ghost',
  'sutter-hill',
  'lyft',
  'twitter',
  'periscope',
];

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const LOGO_NAMES = new Set(['logo.svg', 'logo.png', 'logo.webp']);

const root = process.cwd();
const projectsDir = path.join(root, 'public', 'projects');
const derivedDir = path.join(projectsDir, '_derived');
const outFile = path.join(root, 'src', 'content', 'media-derived.json');

const POSTER_QUALITY = 82;
const LQIP_WIDTH = 32;
const LQIP_QUALITY = 45;

function hasCmd(cmd) {
  const r = spawnSync(cmd, ['-version'], { stdio: 'ignore' });
  return r.status === 0;
}

if (!hasCmd('ffmpeg') || !hasCmd('ffprobe') || !hasCmd('cwebp')) {
  console.warn(
    '[derive-media] ffmpeg/ffprobe/cwebp not found — skipping derivation and reusing committed media-derived.json.'
  );
  process.exit(0);
}

/** @type {Record<string, any>} */
let previous = {};
try {
  previous = JSON.parse(fs.readFileSync(outFile, 'utf8'));
} catch {
  previous = {};
}

function sha1Short(filePath) {
  const h = crypto.createHash('sha1');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex').slice(0, 10);
}

function probeDimensions(filePath) {
  const out = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'csv=p=0',
      filePath,
    ],
    { encoding: 'utf8' }
  ).trim();
  const [w, h] = out.split(',').map((n) => parseInt(n, 10));
  if (!w || !h) throw new Error(`could not probe dimensions of ${filePath}`);
  return { width: w, height: h };
}

/** First video frame extracted to a temp PNG (ffmpeg builds often lack a WebP encoder). */
function extractFirstFramePng(videoPath, pngPath) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', videoPath, '-frames:v', '1', pngPath]);
}

/** First frame of a video as a WebP poster (native resolution). */
function writePoster(videoPath, posterPath) {
  fs.mkdirSync(path.dirname(posterPath), { recursive: true });
  const tmpPng = posterPath + '.tmp.png';
  extractFirstFramePng(videoPath, tmpPng);
  execFileSync('cwebp', ['-quiet', '-q', String(POSTER_QUALITY), tmpPng, '-o', posterPath]);
  fs.rmSync(tmpPng, { force: true });
}

/** Tiny WebP (LQIP_WIDTH px wide) as a base64 data URI. Source can be a still image or video poster. */
function makeLqip(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  const tmp = path.join(derivedDir, `.lqip-tmp-${process.pid}.webp`);
  let input = sourcePath;
  let tmpPng = null;
  if (ext === '.gif') {
    // cwebp cannot read GIFs — grab the first frame via ffmpeg.
    tmpPng = path.join(derivedDir, `.lqip-src-${process.pid}.png`);
    extractFirstFramePng(sourcePath, tmpPng);
    input = tmpPng;
  }
  execFileSync('cwebp', [
    '-quiet',
    '-q', String(LQIP_QUALITY),
    '-resize', String(LQIP_WIDTH), '0',
    input,
    '-o', tmp,
  ]);
  if (tmpPng) fs.rmSync(tmpPng, { force: true });
  const b64 = fs.readFileSync(tmp).toString('base64');
  fs.rmSync(tmp, { force: true });
  return `data:image/webp;base64,${b64}`;
}

fs.mkdirSync(derivedDir, { recursive: true });

/** @type {Record<string, any>} */
const derived = {};
let reused = 0;
let generated = 0;

for (const id of PROJECT_IDS) {
  const dir = path.join(projectsDir, id);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    continue;
  }
  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const name = ent.name;
    const ext = path.extname(name).toLowerCase();
    const isLogo = LOGO_NAMES.has(name);
    if (!isLogo && !IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue;
    if (name === 'logo.svg') {
      // SVGs need no derivation; hash only so the URL can be versioned.
      const key = `${id}/${name}`;
      derived[key] = { hash: sha1Short(path.join(dir, name)), kind: 'logo' };
      continue;
    }

    const filePath = path.join(dir, name);
    const key = `${id}/${name}`;
    const hash = sha1Short(filePath);
    const isVideo = VIDEO_EXT.has(ext);
    const stem = name.slice(0, name.length - ext.length);
    const posterRel = isVideo ? `${id}/${stem}.webp` : null;
    const posterAbs = posterRel ? path.join(derivedDir, posterRel) : null;

    const prev = previous[key];
    if (
      prev &&
      prev.hash === hash &&
      prev.width &&
      (!isVideo || (prev.poster === posterRel && posterAbs && fs.existsSync(posterAbs)))
    ) {
      derived[key] = prev;
      reused++;
      continue;
    }

    if (isLogo) {
      derived[key] = { hash, kind: 'logo' };
      generated++;
      continue;
    }

    try {
      const { width, height } = probeDimensions(filePath);
      /** @type {any} */
      const entry = { hash, width, height };
      if (isVideo) {
        writePoster(filePath, posterAbs);
        entry.poster = posterRel;
        entry.lqip = makeLqip(posterAbs);
      } else {
        entry.lqip = makeLqip(filePath);
      }
      derived[key] = entry;
      generated++;
      console.log(`[derive-media] derived ${key}`);
    } catch (err) {
      console.warn(`[derive-media] FAILED ${key}: ${err.message}`);
    }
  }
}

// Prune poster files whose source media no longer exists.
const validPosters = new Set(
  Object.values(derived)
    .map((d) => d.poster)
    .filter(Boolean)
    .map((p) => path.join(derivedDir, p))
);
if (fs.existsSync(derivedDir)) {
  for (const id of fs.readdirSync(derivedDir)) {
    const sub = path.join(derivedDir, id);
    if (!fs.statSync(sub).isDirectory()) continue;
    for (const f of fs.readdirSync(sub)) {
      const abs = path.join(sub, f);
      if (!validPosters.has(abs)) {
        fs.rmSync(abs);
        console.log(`[derive-media] pruned stale poster ${id}/${f}`);
      }
    }
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(derived, null, 2), 'utf8');
console.log(
  `[derive-media] done: ${generated} derived, ${reused} reused, ${Object.keys(derived).length} total entries.`
);
