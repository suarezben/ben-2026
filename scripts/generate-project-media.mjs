/**
 * Scans public/projects/<projectId>/ for images and videos, sorts by filename,
 * and writes src/content/project-media.json. Also looks for logo.svg / logo.png / logo.webp
 * per folder and writes src/content/project-logos.json.
 *
 * Merges per-asset derived data from src/content/media-derived.json (see derive-media.mjs):
 * URLs get a `?v=<content-hash>` suffix (stable across deploys until the file changes —
 * pairs with the long-lived immutable cache headers in netlify.toml), and entries carry
 * aspectRatio / lqip / poster so the app renders placeholders with zero runtime probing.
 *
 * Pure Node (no ffmpeg) so it can run on every dev/build (predev, prebuild).
 */

import fs from 'fs';
import path from 'path';

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

const LOGO_NAMES = ['logo.svg', 'logo.png', 'logo.webp'];
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const root = process.cwd();
const projectsDir = path.join(root, 'public', 'projects');
const outDir = path.join(root, 'src', 'content');
const outFile = path.join(outDir, 'project-media.json');
const logosOutFile = path.join(outDir, 'project-logos.json');
const derivedFile = path.join(outDir, 'media-derived.json');

/** @type {Record<string, { hash?: string; width?: number; height?: number; lqip?: string; poster?: string }>} */
let derivedData = {};
try {
  derivedData = JSON.parse(fs.readFileSync(derivedFile, 'utf8'));
} catch {
  console.warn(
    '[generate-project-media] media-derived.json missing — run `node scripts/derive-media.mjs` (needs ffmpeg). Continuing without posters/LQIP.'
  );
}

/** @type {Record<string, object[]>} */
const manifest = {};
/** @type {Record<string, string | null>} */
const projectLogos = {};

const missingDerived = [];

/** Versioned public URL for a file in public/projects/. */
function mediaUrl(id, name, hash) {
  const base = `/projects/${id}/${encodeURIComponent(name)}`;
  return hash ? `${base}?v=${hash}` : base;
}

function posterUrl(posterRel, hash) {
  const [pid, ...rest] = posterRel.split('/');
  const base = `/projects/_derived/${pid}/${rest.map(encodeURIComponent).join('/')}`;
  return hash ? `${base}?v=${hash}` : base;
}

/** Derived metadata for `<id>/<name>`, tracking misses for the summary warning. */
function derivedFor(id, name) {
  const d = derivedData[`${id}/${name}`];
  if (!d || !d.width) {
    missingDerived.push(`${id}/${name}`);
    return d ?? {};
  }
  return d;
}

function aspect(d) {
  return d.width && d.height ? Math.round((d.width / d.height) * 10000) / 10000 : undefined;
}

/**
 * Filenames like `00-lyft-mobile-b.png` pair with `00-lyft-b.png` for responsive art
 * (desktop url + optional `mobileUrl` in JSON).
 */
function isMobileImageName(name) {
  const ext = path.extname(name);
  const stem = path.basename(name, ext);
  return /(?:^|[-_])mobile(?:[-_]|$)/i.test(stem);
}

/** Map a mobile filename to its desktop partner basename (same extension). */
function desktopPartnerForMobileName(name) {
  const ext = path.extname(name);
  let stem = path.basename(name, ext);
  // `00-lyft-mobile-b` → `00-lyft-b` (avoid turning `-mobile-` into `--` via a naive single-char replace)
  stem = stem.replace(/-mobile-/gi, '-').replace(/_mobile_/gi, '_');
  stem = stem.replace(/-mobile$/i, '').replace(/^_mobile_/i, '').replace(/_mobile$/i, '');
  return stem + ext;
}

function mobilePartnerForDesktopName(desktopName, imageFileSet) {
  for (const name of imageFileSet) {
    if (!isMobileImageName(name)) continue;
    if (desktopPartnerForMobileName(name) === desktopName) return name;
  }
  return null;
}

/** Image entry with derived placeholder / layout metadata attached. */
function imageEntry(id, name, mobileName) {
  const d = derivedFor(id, name);
  /** @type {any} */
  const entry = {
    mediaType: 'image',
    url: mediaUrl(id, name, d.hash),
  };
  const ar = aspect(d);
  if (ar) entry.aspectRatio = ar;
  if (d.lqip) entry.lqip = d.lqip;
  if (mobileName) {
    const dm = derivedFor(id, mobileName);
    entry.mobileUrl = mediaUrl(id, mobileName, dm.hash);
    const arm = aspect(dm);
    if (arm) entry.mobileAspectRatio = arm;
    if (dm.lqip) entry.mobileLqip = dm.lqip;
  }
  return entry;
}

/**
 * @param {string} id
 * @param {string[]} files sorted media filenames (images + videos)
 */
function buildMediaEntries(id, files) {
  const imageSet = new Set(
    files.filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()))
  );
  const used = new Set();
  /** @type {object[]} */
  const out = [];

  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (VIDEO_EXT.has(ext)) {
      const d = derivedFor(id, name);
      /** @type {any} */
      const entry = {
        mediaType: 'video',
        url: mediaUrl(id, name, d.hash),
      };
      const ar = aspect(d);
      if (ar) entry.aspectRatio = ar;
      if (d.lqip) entry.lqip = d.lqip;
      if (d.poster) entry.poster = posterUrl(d.poster, d.hash);
      out.push(entry);
      continue;
    }
    if (!IMAGE_EXT.has(ext)) continue;
    if (used.has(name)) continue;

    if (isMobileImageName(name)) {
      const desk = desktopPartnerForMobileName(name);
      if (desk !== name && imageSet.has(desk)) {
        continue;
      }
      out.push(imageEntry(id, name, null));
      used.add(name);
      continue;
    }

    const mobile = mobilePartnerForDesktopName(name, imageSet);
    if (mobile && !used.has(mobile)) {
      out.push(imageEntry(id, name, mobile));
      used.add(name);
      used.add(mobile);
    } else {
      out.push(imageEntry(id, name, null));
      used.add(name);
    }
  }
  return out;
}

for (const id of PROJECT_IDS) {
  const dir = path.join(projectsDir, id);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    manifest[id] = [];
    projectLogos[id] = null;
    continue;
  }
  const fileNames = new Set(entries.filter((e) => e.isFile()).map((e) => e.name));

  const logoNamesSet = new Set(LOGO_NAMES);
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => {
      if (logoNamesSet.has(name)) return false; // logo only, not content
      const ext = path.extname(name).toLowerCase();
      return IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  manifest[id] = buildMediaEntries(id, files);

  let logoUrl = null;
  for (const name of LOGO_NAMES) {
    if (fileNames.has(name)) {
      const d = derivedData[`${id}/${name}`];
      logoUrl = mediaUrl(id, name, d?.hash);
      break;
    }
  }
  projectLogos[id] = logoUrl;
}

if (missingDerived.length > 0) {
  console.warn(
    `[generate-project-media] ${missingDerived.length} asset(s) missing derived data (no lqip/poster/aspect): ${missingDerived.join(', ')}. Run \`node scripts/derive-media.mjs\` locally (needs ffmpeg) and commit the results.`
  );
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), 'utf8');
fs.writeFileSync(logosOutFile, JSON.stringify(projectLogos, null, 2), 'utf8');
