/**
 * Block first paint until webfonts used by the document are loaded (or timeout).
 * Same idea as “blocking” / optimized font loading in Next.js and web.dev guidance:
 * avoids system-font → custom-font swap on initial chip / intro text.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts
 */
const DEFAULT_TIMEOUT_MS = 4000;

export function waitForWebFonts(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const ready = document.fonts?.ready;
  if (!ready) return Promise.resolve();
  // `document.fonts.ready` can reject in some browsers when a @font-face fails; without a catch,
  // callers that only `.then(render)` never run → permanent blank page.
  const settled = ready.then(() => undefined).catch(() => undefined);
  return Promise.race([
    settled,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
