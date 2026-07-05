/**
 * Background media prefetch: warms the HTTP cache for project assets so switching
 * projects is instant, without competing with the visible project's media.
 *
 * - URLs must be byte-identical to the ones the <img>/<video> elements use, or the
 *   cache entry is wasted (this was the root cause of the old double-download bug).
 * - Sequential (one request at a time) with `priority: 'low'` so the active
 *   project's own media wins bandwidth.
 * - Starts after window `load` plus a short delay; skipped entirely on Save-Data
 *   or very slow connections.
 */

const queued: string[] = [];
const seen = new Set<string>();
let running = false;
let releaseStartGate: (() => void) | null = null;
let startGate: Promise<void> | null = null;

const START_DELAY_MS = 1200;

function connectionAllowsPrefetch(): boolean {
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;
  return true;
}

function afterWindowLoad(): Promise<void> {
  if (startGate) return startGate;
  startGate = new Promise((resolve) => {
    releaseStartGate = resolve;
    const arm = () => setTimeout(resolve, START_DELAY_MS);
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
  });
  return startGate;
}

async function run(): Promise<void> {
  if (running) return;
  running = true;
  await afterWindowLoad();
  while (queued.length > 0) {
    const url = queued.shift()!;
    try {
      await fetch(url, { priority: 'low' } as RequestInit);
    } catch {
      // Offline / aborted — drop and continue; the media element will retry on demand.
    }
  }
  running = false;
}

/** Append URLs to the prefetch queue (deduped across the session). */
export function queueMediaPrefetch(urls: string[]): void {
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    queued.push(url);
  }
  if (!connectionAllowsPrefetch()) {
    queued.length = 0;
    return;
  }
  if (queued.length > 0) void run();
}

/**
 * Mark URLs the DOM is already fetching natively (<img> src, <video> src/poster) so the
 * background queue never downloads the same bytes in parallel with a media element.
 */
export function markMediaFetched(urls: (string | undefined)[]): void {
  for (const url of urls) {
    if (!url) continue;
    seen.add(url);
    const i = queued.indexOf(url);
    if (i !== -1) queued.splice(i, 1);
  }
}

/** Move the given URLs (if still pending) to the front of the queue, preserving their order. */
export function prioritizeMediaPrefetch(urls: string[]): void {
  const wanted = new Set(urls);
  const pulled = queued.filter((u) => wanted.has(u));
  if (pulled.length === 0) return;
  const rest = queued.filter((u) => !wanted.has(u));
  const ordered = urls.filter((u) => pulled.includes(u));
  queued.length = 0;
  queued.push(...ordered, ...rest);
  // A project switch means the user is waiting on this media now — don't hold the gate.
  releaseStartGate?.();
}
