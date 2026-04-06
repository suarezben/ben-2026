# [mikematas.com](https://mikematas.com/) — implementation notes

Informal notes from inspecting shipped HTML/CSS/JS (April 2026). Not affiliated with the site.

## Custom cursor (CSS)

From `_next/static/css/e642b2c331f8488d.css`:

- Global: `*, a, body, html { cursor: none !important; … }` (plus `.cursor-visible` / `.window-inactive` escape hatches).
- Root: fixed `50×50px`, `pointer-events: none`, `will-change: transform`, `z-index: 1000`.
- Dot: `border-radius: 50%`, **`backdrop-filter: invert(30%) blur(10px)`** (and `-webkit-` prefix).

Our `CustomCursor` uses the same **filter** (`invert(30%) blur(10px)`) with a **smaller diameter** than his shipped 50px; we keep a higher `z-index` so the dot stays above local debug UI.

## Stack / animation (JS bundle hints)

Main page chunk (`pages/index-*.js`) is **Next.js**-built. Observed patterns (minified names will differ over deploys):

- **Spring configs** read like **react-spring** (or a fork): `tension`, `friction`, `precision`; separate configs for chains, mobile, overscroll, gallery paging, cursor scale/down, header date, etc. Some values appear driven from **parsed env/config** (`parseFloat(A().animationSpringTension)` style).
- **`Pageable`**-style helper with a **spring constant** for clamping / resistance at scroll bounds.
- **Gallery**: spring-driven paging (`Gallery.SpringConfig` / mobile variant).
- **DOM**: stacked full-viewport **WebP** backgrounds (`images_image__`), grid layout (`grid_grid__`), `translate3d` on scrollable content, `pointer-events` toggles (`util_locked__` / `util_unlocked__`).
- **Cursor targets**: interactive hits wrapped with `cursor_target__` for the custom cursor layer.

This is not a full source map; for pixel-perfect parity you’d need his actual components or a design spec.
