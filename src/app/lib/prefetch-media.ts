/**
 * Background media prefetch: warms the HTTP cache for project assets so switching
 * projects is instant, without competing with the visible project's media.
 *
 * - URLs must be byte-identical to the ones the <img>/<video> elements use, or the
 *   cache entry is wasted (a URL mismatch here once caused every asset to download twice).
 * - Sequential (one asset at a time) so the active project's own media wins bandwidth.
 * - Primary transport is <link rel="prefetch"> — document-initiated and browser-managed
 *   at idle priority. fetch()/XHR are a fallback for engines without prefetch support
 *   (Safari); some embedded webviews stall programmatic requests entirely, and a stalled
 *   fetch holds one of the per-origin connections, which can starve <img>/<video> loads.
 * - Every item has a hard timeout, and repeated consecutive failures trip a circuit
 *   breaker that disables prefetching for the session (better no warmup than a jammed
 *   connection pool).
 * - Starts after window `load` plus a short delay; skipped on Save-Data / 2G.
 */

const queued: string[] = [];
const seen = new Set<string>();
let running = false;
let releaseStartGate: (() => void) | null = null;
let startGate: Promise<void> | null = null;
let disabled = false;
let consecutiveFailures = 0;

/** Cancel hook for the in-flight item (abort fetch / remove link). */
let cancelInFlight: ((url: string) => void) | null = null;

const START_DELAY_MS = 1200;
const ITEM_TIMEOUT_MS = 60_000;
const MAX_CONSECUTIVE_FAILURES = 2;

function connectionAllowsPrefetch(): boolean {
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  if (conn.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;
  return true;
}

function supportsLinkPrefetch(): boolean {
  const link = document.createElement('link');
  return !!link.relList?.supports?.('prefetch');
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

/** Warm one URL via <link rel="prefetch">; resolves true on success, false on error/timeout. */
function prefetchViaLink(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      cancelInFlight = null;
      clearTimeout(timer);
      link.remove();
      resolve(ok);
    };
    const timer = setTimeout(() => settle(false), ITEM_TIMEOUT_MS);
    link.rel = 'prefetch';
    link.as = url.includes('.mp4') ? 'video' : 'image';
    link.href = url;
    link.onload = () => settle(true);
    link.onerror = () => settle(false);
    // Media element took over this URL — get out of its way (avoids the HTTP-cache
    // write lock stalling the element's own request behind the prefetch).
    cancelInFlight = (u) => {
      if (u === url) settle(true);
    };
    document.head.appendChild(link);
  });
}

/** Fallback for engines without link prefetch (Safari): plain low-priority fetch. */
function prefetchViaFetch(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ITEM_TIMEOUT_MS);
  // A markMediaFetched abort means a media element took over — count it as success.
  let takenOver = false;
  cancelInFlight = (u) => {
    if (u === url) {
      takenOver = true;
      controller.abort();
    }
  };
  return fetch(url, { priority: 'low', signal: controller.signal } as RequestInit)
    .then((r) => {
      // Drain so the body actually lands in the HTTP cache.
      return r.arrayBuffer().then(() => true);
    })
    .catch(() => takenOver)
    .finally(() => {
      clearTimeout(timer);
      cancelInFlight = null;
    });
}

async function run(): Promise<void> {
  if (running) return;
  running = true;
  await afterWindowLoad();
  const useLink = supportsLinkPrefetch();
  while (queued.length > 0 && !disabled) {
    const url = queued.shift()!;
    const ok = await (useLink ? prefetchViaLink(url) : prefetchViaFetch(url));
    if (ok) {
      consecutiveFailures = 0;
    } else if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      // Environment can't prefetch (offline, blocked requests, jammed pool) — stop
      // for the session rather than holding connections hostage.
      disabled = true;
      queued.length = 0;
    }
  }
  running = false;
}

/** Append URLs to the prefetch queue (deduped across the session). */
export function queueMediaPrefetch(urls: string[]): void {
  if (disabled) return;
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    queued.push(url);
  }
  if (!connectionAllowsPrefetch()) {
    disabled = true;
    queued.length = 0;
    return;
  }
  if (queued.length > 0) void run();
}

/**
 * Mark URLs the DOM is already fetching natively (<img> src, <video> src/poster) so the
 * background queue never competes with a media element for the same bytes. Also cancels
 * an in-flight prefetch of that URL (Chrome serializes same-URL requests behind the
 * cache write lock, which would stall the element until the prefetch finished).
 */
export function markMediaFetched(urls: (string | undefined)[]): void {
  for (const url of urls) {
    if (!url) continue;
    seen.add(url);
    const i = queued.indexOf(url);
    if (i !== -1) queued.splice(i, 1);
    cancelInFlight?.(url);
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
