import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const port = 5173

/** Keep in sync with <meta name="description"> in index.html. */
const SEO_DESCRIPTION =
  'Ben Suarez is a product designer in San Francisco. Portfolio: Meta Reality Labs, Fellow, Ghost Autonomy, Sutter Hill Ventures, Lyft, Twitter, and Periscope.'

/**
 * Canonical, og:url, social image URLs, and Person JSON-LD — only when `VITE_SITE_URL` is set
 * (Netlify: `VITE_SITE_URL=$DEPLOY_PRIME_URL npm run build`).
 */
function injectSeoAbsoluteTags(): Plugin {
  return {
    name: 'inject-seo-absolute-tags',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const base = (process.env.VITE_SITE_URL || '').trim().replace(/\/$/, '')
        if (!base) {
          return html
        }
        const imageUrl = `${base}/images/bensuarez-name.png`
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Ben Suarez',
          url: `${base}/`,
          jobTitle: 'Product designer',
          description: SEO_DESCRIPTION,
          image: imageUrl,
          homeLocation: {
            '@type': 'Place',
            name: 'San Francisco, California',
            addressCountry: 'US',
          },
        }
        const jsonStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c')
        const block = `
    <link rel="canonical" href="${base}/" />
    <meta property="og:url" content="${base}/" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json">${jsonStr}</script>`
        return html.replace(/(\s*)<\/head>/i, `${block}$1</head>`)
      },
    },
  }
}

/**
 * Preload Inter weights used above the fold: chips (400/500), intro card eyebrow + body (600/400).
 * Latin first, then latin-ext — reduces system→Inter width flash and description FOUT on real deploys.
 */
function preloadInterAboveFold(): Plugin {
  let base = '/'
  const specs: { test: (name: string) => boolean }[] = [
    { test: (n) => n.includes('inter-latin-400-normal') && !n.includes('latin-ext') },
    { test: (n) => n.includes('inter-latin-ext-400-normal') },
    { test: (n) => n.includes('inter-latin-500-normal') && !n.includes('latin-ext') },
    { test: (n) => n.includes('inter-latin-ext-500-normal') },
    { test: (n) => n.includes('inter-latin-600-normal') && !n.includes('latin-ext') },
    { test: (n) => n.includes('inter-latin-ext-600-normal') },
  ]
  return {
    name: 'preload-inter-above-fold',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html
        const files: string[] = []
        for (const { test } of specs) {
          for (const item of Object.values(ctx.bundle)) {
            if (item.type !== 'asset' || !item.fileName.endsWith('.woff2')) continue
            if (test(item.fileName)) {
              files.push(item.fileName)
              break
            }
          }
        }
        if (files.length === 0) return html
        const root = base.endsWith('/') ? base : `${base}/`
        const href = (file: string) => `${root}${file.replace(/^\//, '')}`
        const tags = files
          .map(
            (file) =>
              `    <link rel="preload" href="${href(file)}" as="font" type="font/woff2" crossorigin />`
          )
          .join('\n')
        return html.replace(/<head>/, `<head>\n${tags}`)
      },
    },
  }
}

export default defineConfig({
  plugins: [
    injectSeoAbsoluteTags(),
    preloadInterAboveFold(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Open locally; host: true binds to LAN so you can open http://<your-mac-ip>:5173 on iPhone (same Wi‑Fi).
  server: {
    port,
    // Fail fast if something else is already on 5173 (zombie Vite / other app). Avoids “wrong site, wrong carousel” confusion.
    strictPort: true,
    open: `http://localhost:${port}/`,
    host: true,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  },
})
