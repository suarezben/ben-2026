/**
 * Writes `public/robots.txt` and, when `VITE_SITE_URL` is set, `public/sitemap.xml`.
 * Run from `prebuild` after Netlify sets `VITE_SITE_URL` (see netlify.toml).
 */
import fs from 'fs';
import path from 'path';

const base = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');
const publicDir = path.join(process.cwd(), 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const robotsPath = path.join(publicDir, 'robots.txt');

if (base) {
  const home = `${base}/`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${home}</loc>
    <changefreq>monthly</changefreq>
    <priority>1</priority>
  </url>
</urlset>
`;
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  fs.writeFileSync(
    robotsPath,
    `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`,
    'utf8'
  );
} else {
  if (fs.existsSync(sitemapPath)) fs.unlinkSync(sitemapPath);
  fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n`, 'utf8');
}
