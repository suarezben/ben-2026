---
name: live-runtime-debugger
description: Optional pattern for small dev-only interaction HUDs. The chip debug panel was removed from this repo; use only if the user explicitly asks to add a debugger back.
---

# Live runtime debugger (optional)

This project **does not** ship an in-app debug panel by default.

If the user asks for a hover/press/state HUD again:

- Mount only when `import.meta.env.DEV` (or an explicit query flag if they prefer).
- Fixed corner, `pointer-events-none` if read-only, monospace, respect custom cursor `z-index`.
- Wire pointer events on the relevant controls and lift state to a parent.

Do **not** reintroduce carousel physics sliders or a separate debug URL unless they ask.
