Alliance No. 1 (licensed) — add two WOFF2 files here so headings use the real face instead of sans-serif fallback:

  alliance-no-1-light.woff2    → weight 300 (font-light in the app)
  alliance-no-1-regular.woff2  → weight 400 (font-normal)

Names must match exactly. @font-face lives in src/styles/fonts.css.
Convert from your OTF/TTF with a tool you trust (e.g. fonttools, online converter for personal use only per your license).

After adding files: commit them (if your license allows hosting on the public site) and push — Netlify will serve /fonts/*.woff2 like any static asset.
