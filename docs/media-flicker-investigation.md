# Project-switch flicker investigation — September 24, 2026

Status: cause not confirmed. No visual fix applied.

## Evidence

- Repository started at 317990d. The separate local modification to
  `public/projects/fellow/1_01_espresso-w.mp4` was not edited.
- Arc's open portfolio tab was `https://bensuarez.com/`.
- The publicly served bundle is `index-_Vk4hq_L.js`. It contains the current
  loadeddata/requestVideoFrameCallback handler and immediate poster removal,
  with no onCanPlay/onPlaying handlers. This verifies the server deployment,
  not whether an already-open Arc tab has refreshed its document.
- A visible Codex browser run used Chrome 153, 1280×720 CSS pixels, DPR 2.
  Diagnostic logs covered Fellow → Twitter → Periscope.
- Video geometry and CSS zoom (1) remained stable during the recorded transitions.
  Video source attachment occurred after incoming cards mounted, as expected;
  no secondary source reset or remount was observed after the fade settled.
- Poster removal preceded full project opacity in these runs:

| Project | Poster hidden before opacity reached 1 |
| --- | --- |
| Fellow, first visible video | 375 ms |
| Twitter, three visible videos | 366–375 ms |
| Periscope, three visible videos | 366–383 ms |

These results do not support late poster removal or zoom adjustment as the
cause in this particular run. They do not rule either out in the affected Arc
session, at other viewport sizes, or under different loading conditions.

The card already has `translateZ(0)` and isolation. Adding these again would
not be a new experiment. The animated ancestor's compositor behavior remains
unverified. There is no GPU layer trace or successful recording of the actual
Arc transition from this investigation: native screenshot/URL inspection
worked, but mouse actions repeatedly failed because the window was unavailable.
Static screenshots cannot establish absence of a brief flicker.

`requestVideoFrameCallback` means a frame was submitted to the compositor,
not necessarily that it has appeared on screen. The first callbacks in this
run had expected display times roughly 8 ms later. This corrects the existing
code comment's stronger claim, but is not proof of the reported flicker.
Reference: https://web.dev/articles/requestvideoframecallback-rvfc

## Reproduce with local diagnostics

1. Keep the existing dev server running and open
   `http://localhost:5173/?mediaDebug=1` in the affected browser.
2. In the developer console, filter for `[media-debug]`.
3. Switch Fellow → Twitter → Periscope → Fellow, including repeat visits.
4. Press F8 (Fn+F8 if needed on a Mac keyboard) when the shimmer is visible.
   This records `user-flicker-marker` and the current visible video state.
5. Save the console log alongside a browser-window recording. Correlate the
   marker with the video rectangles, masked edges, intro card, and fade end.
   A human marker has reaction delay; use the recording for exact frame timing.

Instrumentation is development-only and opt-in. It observes mounts, src
changes, media events, the first three video-frame callbacks, poster opacity,
geometry, and ancestor opacity/zoom/transform. Frame sampling runs for 2.5 s
following each button click. Logs are console-only; nothing is uploaded.
Removing the query parameter and reloading stops diagnostics.

Instrumentation adds observation overhead, so compare against an uninstrumented
recording before attributing a compositor glitch to a measured event. A readiness
barrier or layer change should wait for that correlation.

## Validation

- `npm run build` passed.
- Production JS remains `index-_Vk4hq_L.js`, matching the live bundle name.
- Production assets contain no diagnostic marker or module.
- No changes to project-card.tsx, transition parameters, masks, scale, or design.
