/**
 * Scans public/projects/<projectId>/ for images and videos, sorts by filename,
 * and writes src/content/project-media.json. Also looks for logo.svg / logo.png / logo.webp
 * per folder and writes src/content/project-logos.json.
 * Run before dev/build (predev, prebuild).
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

/** @type {Record<string, { mediaType: 'image' | 'video'; url: string; mobileUrl?: string }[]>} */
const manifest = {};
/** @type {Record<string, string | null>} */
const projectLogos = {};

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

/**
 * @param {string} id
 * @param {string[]} files sorted media filenames (images + videos)
 */
function buildMediaEntries(id, files) {
  const imageSet = new Set(
    files.filter((n) => IMAGE_EXT.has(path.extname(n).toLowerCase()))
  );
  const used = new Set();
  /** @type {{ mediaType: 'image' | 'video'; url: string; mobileUrl?: string }[]} */
  const out = [];

  for (const name of files) {
    const ext = path.extname(name).toLowerCase();
    if (VIDEO_EXT.has(ext)) {
      out.push({
        mediaType: 'video',
        url: `/projects/${id}/${encodeURIComponent(name)}`,
      });
      continue;
    }
    if (!IMAGE_EXT.has(ext)) continue;
    if (used.has(name)) continue;

    if (isMobileImageName(name)) {
      const desk = desktopPartnerForMobileName(name);
      if (desk !== name && imageSet.has(desk)) {
        continue;
      }
      out.push({
        mediaType: 'image',
        url: `/projects/${id}/${encodeURIComponent(name)}`,
      });
      used.add(name);
      continue;
    }

    const mobile = mobilePartnerForDesktopName(name, imageSet);
    if (mobile && !used.has(mobile)) {
      out.push({
        mediaType: 'image',
        url: `/projects/${id}/${encodeURIComponent(name)}`,
        mobileUrl: `/projects/${id}/${encodeURIComponent(mobile)}`,
      });
      used.add(name);
      used.add(mobile);
    } else {
      out.push({
        mediaType: 'image',
        url: `/projects/${id}/${encodeURIComponent(name)}`,
      });
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
      logoUrl = `/projects/${id}/${encodeURIComponent(name)}`;
      break;
    }
  }
  projectLogos[id] = logoUrl;
}

fs.mkdirSync(outDir, { recursive: true });
const output = { _generatedAt: Date.now(), ...manifest };
fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
fs.writeFileSync(logosOutFile, JSON.stringify(projectLogos, null, 2), 'utf8');
