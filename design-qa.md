# Design QA — Mobile Writing Header and Carousel Corners

- Source visual truth: `/var/folders/6y/v13c_pqx30l5y3_pkcy1sh_r0000gn/T/TemporaryItems/NSIRD_screencaptureui_nxFG6f/Screenshot 2026-09-28 at 2.10.35 PM.png`
- Implementation: `http://localhost:5173/writing`
- Implementation screenshots: Codex in-app browser captures `headerShot`, `settledHeaderShot`, `carouselShot2`, and `finalTopShot` in the current task evidence. The in-app browser API does not expose a filesystem path for captures.
- Reference pixels: 2468 × 1018 (two-state annotated Safari comparison)
- Implementation capture pixels: 481 × 1041
- CSS viewport requested: 390 × 844; browser-reported layout viewport: 433.33 × 937.78
- State: mobile Writing route at page top, returned header after upward scroll, and first animated carousel in motion
- Density normalization: relational alignment and component proportions were compared because the source is an annotated two-panel Safari composite rather than a 1:1 page capture.

## Full-view comparison evidence

- The updated header is 84px tall versus the previous 112px layout box.
- The logo is visually centered between the Work and Contact labels while their position remains stable.
- At page top the header has only its white continuation shadow and no gray divider.
- The shorter header and the embedded article's 124px first-paint inset remain aligned without exposing content beneath the header.

## Focused region comparison evidence

- Returned-scroll header: the settled header includes a visible 1px inset divider at `rgb(19 16 21 / 0.12)` and returns to its normal y-position.
- Animated carousel: the generated mobile clip path now resolves the percentage radius to 18.36px instead of truncating `12.25%` to 12.25px. Captured cards show the intended rounded/smoothed silhouette while tilted and scaled.
- Fonts/typography: existing signature asset and navigation typography are unchanged.
- Colors/tokens: white header and site-ink navigation are unchanged; the divider uses the existing site-ink color at increased alpha.
- Image quality: existing source logo and carousel image assets are preserved; no stand-ins were introduced.
- Copy/content: unchanged.
- Console: no warnings or errors in the final mobile state.

## Comparison history

1. Earlier P1: carousel smoothing parsed a percentage radius as pixels, visibly flattening the animated cards. Fixed by resolving horizontal and vertical percentage radii against the measured card dimensions. Post-fix capture and computed clip path confirm an 18.36px mobile radius.
2. Earlier P2: the mobile header logo sat below the nav's visual center and the header retained excess layout height. Fixed with a 72px writing-header row, an anchored nav, and a 16px upward signature adjustment. Post-fix capture matches the supplied after-state proportions.
3. Earlier P2: the scroll-return divider was too faint to perceive. Fixed by increasing the scroll-only divider from 3% to 12% site-ink opacity. Top-state capture confirms it remains absent by default; returned-scroll capture confirms it is present over content.

## Findings

No actionable P0, P1, or P2 differences remain for the requested regions.

## Follow-up polish

- Physical iPhone Safari remains the final authority for browser-chrome/safe-area rendering, which the in-app Chromium preview cannot reproduce exactly.

final result: passed
