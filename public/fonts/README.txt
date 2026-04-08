Alliance No. 1 (licensed) — place files in this folder. @font-face is in src/styles/fonts.css.

Current setup supports either:

  OTF (export names from the desktop kit):
    Alliance-No-1-Light.otf      → weight 300 (font-light)
    Alliance-No-1-Regular.otf    → weight 400 (font-normal)
    Alliance-No-1-SemiBold.otf   → weight 600 (font-semibold) — intro card eyebrow

  Optional smaller web files (if you convert later):
    alliance-no-1-light.woff2
    alliance-no-1-regular.woff2
    alliance-no-1-semibold.woff2

If both WOFF2 and OTF exist for a weight, browsers use WOFF2 first.

Commit and push only if your license allows self-hosting on a public site. Netlify serves /fonts/* as static files.
