/**
 * Read-only media diagnostics. Loaded only by the dev server with ?mediaDebug=1.
 * Logs stay in the browser console; nothing is uploaded. No media/style writes.
 * Switch projects, then filter the console for [media-debug]. Reload to stop.
 */
const ids = new WeakMap();
const attached = new WeakSet();
const last = new WeakMap();
let nextId = 0;
let until = 0;
let pending = false;
const round = (n) => Math.round(n * 100) / 100;
const id = (node) => {
  if (!ids.has(node)) ids.set(node, ++nextId);
  return ids.get(node);
};
function snapshot(v) {
  const r = v.getBoundingClientRect();
  const ancestors = [];
  for (let el = v.parentElement; el; el = el.parentElement) {
    if (el.style.opacity || el.style.zoom || el.style.transform) {
      const css = getComputedStyle(el);
      ancestors.push({ id: id(el), opacity: css.opacity, zoom: css.zoom, transform: css.transform });
    }
  }
  const poster = Array.from(v.parentElement?.children ?? []).find(
    (el) => el.tagName === 'IMG' && el.getAttribute('src') === v.getAttribute('poster')
  );
  return {
    id: id(v), src: v.getAttribute('src'), ready: v.readyState,
    time: round(v.currentTime), paused: v.paused,
    rect: [r.x, r.y, r.width, r.height].map(round),
    poster: poster ? getComputedStyle(poster).opacity : null,
    ancestors,
  };
}
function log(event, detail) {
  console.info('[media-debug]', JSON.stringify({ at: round(performance.now()), event, ...detail }));
}
function sample() {
  for (const v of document.querySelectorAll('video')) {
    if (!v.getBoundingClientRect().width) continue;
    const s = snapshot(v);
    // Ignore normal playback time; report layout, readiness, and poster changes.
    const signature = JSON.stringify({ ...s, time: 0 });
    if (last.get(v) !== signature) {
      last.set(v, signature);
      log('state', s);
    }
  }
  if (performance.now() < until) requestAnimationFrame(sample);
  else {
    pending = false;
    log('capture-end', {});
  }
}
function sampleForTransition() {
  until = performance.now() + 2500;
  if (!pending) {
    pending = true;
    requestAnimationFrame(sample);
  }
}
function attach(v) {
  if (attached.has(v)) return;
  attached.add(v);
  log('mount', { id: id(v), src: v.getAttribute('src') });
  for (const name of ['loadstart', 'loadedmetadata', 'loadeddata', 'play', 'playing', 'pause', 'waiting', 'stalled', 'emptied', 'error']) {
    v.addEventListener(name, () => {
      if (v.getBoundingClientRect().width) log(name, snapshot(v));
      if (name === 'loadeddata' && v.requestVideoFrameCallback) {
        let count = 0;
        const frame = (now, metadata) => {
          if (!v.isConnected) return;
          log('video-frame', { ...snapshot(v), callbackAt: round(now), expectedDisplayTime: round(metadata.expectedDisplayTime), presentationTime: round(metadata.presentationTime), mediaTime: metadata.mediaTime, presentedFrames: metadata.presentedFrames });
          if (++count < 3) v.requestVideoFrameCallback(frame);
        };
        v.requestVideoFrameCallback(frame);
      }
    });
  }
}
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === 'attributes' && m.target instanceof HTMLVideoElement) {
      log('source-change', { id: id(m.target), attribute: m.attributeName, old: m.oldValue, value: m.target.getAttribute(m.attributeName) });
    }
    for (const n of m.removedNodes) {
      if (!(n instanceof Element)) continue;
      for (const v of [ ...(n.matches('video') ? [n] : []), ...n.querySelectorAll('video') ]) log('unmount', { id: id(v) });
    }
  }
  document.querySelectorAll('video').forEach(attach);
});
observer.observe(document.getElementById('root'), { childList: true, subtree: true, attributes: true, attributeFilter: ['src'], attributeOldValue: true });
document.querySelectorAll('video').forEach(attach);
document.addEventListener('click', (e) => {
  const button = e.target instanceof Element ? e.target.closest('button') : null;
  if (!button) return;
  log('click', { label: button.textContent, viewport: [innerWidth, innerHeight, devicePixelRatio] });
  sampleForTransition();
}, true);
log('start', { userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight, devicePixelRatio] });
sampleForTransition();

document.addEventListener('keydown', (e) => {
  if (e.key === 'F8') {
    log('user-flicker-marker', {});
    document.querySelectorAll('video').forEach((v) => {
      if (v.getBoundingClientRect().width) log('marked-state', snapshot(v));
    });
  }
});
