# One command: latest dev build in the browser

Run **`npm run dev` only.** It opens **`http://localhost:5173/`** (Vite `open` + `Cache-Control: no-store` on dev responses). If the port is busy, stop the old server or run `lsof -i :5173` and quit that process (`strictPort` is on).

---

# Localhost first open vs refresh (why Lorem + “good” carousel could appear)

Nothing in the current app intentionally shows Lorem ipsum on first paint. That text only exists in unused Figma exports under `src/imports/` (not mounted by `main.tsx`).

What you saw is almost always **browser disk cache**:

1. **First open** after `npm run dev` — Chrome may reuse a **cached** `localhost` document + old JS from an **earlier** project or older commit (e.g. when the app still pulled Figma screens, and when carousel logic differed). That feels like “my site” because the URL is still `localhost`.
2. **Refresh** — forces a trip to the **live** Vite server, so you get **today’s** `App.tsx`: real copy, current carousel code.

**Mitigations in this repo**

- `index.html` includes `Cache-Control` / `Pragma` meta hints so the shell is less likely to load from cache alone.
- Vite `server.headers` sends `no-store` for dev responses.
- **`strictPort: true` + `port: 5173`** — if dev fails with “port in use”, another process is holding 5173. Kill it (`lsof -i :5173`) so you are not accidentally hitting a **different** dev server while thinking it’s this project.

**If it happens again:** hard refresh (Cmd+Shift+R), or DevTools → Network → “Disable cache” while developing.

---

# Desktop content carousel — overscroll + in-bounds inertia

Overscroll release uses **Motion** `animate(from, 0, spring)` so the strip always eases back with a visible curve (no sub-pixel RAF “snap”). In-bounds coast still uses manual `requestAnimationFrame` + friction. See `.cursor/rules/desktop-carousel-baseline.mdc`.

## Rubber while dragging past the edge

- `desktopRubberResistance(o)`: `pow(abs(o), 0.62) * 1.68` → drives `rubberBandOffset` + `motion.div` `style.x`
- Rail flex `gap`: fixed **`30px`** (stretch-with-pull spacing deferred)

## `CAROUSEL_RUBBER_SPRING` (release)

| Key | Value |
|-----|------|
| stiffness | 260 |
| damping | 36 |
| mass | 0.58 |

## `runtimeCarouselPhysics` (in-bounds inertia only)

| Key | Value |
|-----|------|
| inertiaFriction | 0.97 |
| stopThreshold | 0.08 |

## Release behavior

- If `|rubberBandOffset| > 0` on pointer up → **`springRubberToZero()`** (Motion spring to 0), regardless of speed.
- Else EMA release velocity; start inertia when `|v| > stopThreshold * CAROUSEL_INERTIA_START_FACTOR` (**1.2**).
- EMA on drag: `ema = ema * 0.42 + instant * 0.58`; `instant = (deltaX / deltaTime) * 16`
- At scroll bounds during inertia: apply rubber + `currentVelocity *= 0.8`; when speed below threshold → **`springRubberToZero()`**
- In-bounds inertia keeps rubber at **0**

## Desktop project strip motion (Framer)

- `initial` / `animate` / `exit`: opacity 0 → 1 / 0
- `transition.opacity`: spring `stiffness: 320`, `damping: 30`, `mass: 0.4`

---

# Custom cursor (filters unchanged)

- **`src/app/components/custom-cursor.tsx`**: `CURSOR_SIZE = 20` px; `invert(30%) blur(10px)`; press scale `0.85`; spring `800 / 30 / 0.3`
- See also `docs/mikematas-site-reference.md`
