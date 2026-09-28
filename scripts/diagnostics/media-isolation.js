/** Development-only experiments. Neither mode writes styles or controls playback. */
const mode = new URLSearchParams(location.search).get('mediaDebug');
console.info('[media-isolation]', mode);

if (mode === 'reads') {
  // Reproduce the full diagnostic's per-frame geometry/style reads, without
  // logging, MutationObserver, media listeners, or video-frame callbacks.
  let until = 0;
  let pending = false;
  function sample() {
    for (const video of document.querySelectorAll('video')) {
      if (!video.getBoundingClientRect().width) continue;
      video.getBoundingClientRect();
      for (let el = video.parentElement; el; el = el.parentElement) {
        if (el.style.opacity || el.style.zoom || el.style.transform) {
          const css = getComputedStyle(el);
          void css.opacity;
          void css.zoom;
          void css.transform;
        }
      }
      const poster = Array.from(video.parentElement?.children ?? []).find(
        (el) => el.tagName === 'IMG' && el.getAttribute('src') === video.getAttribute('poster')
      );
      if (poster) void getComputedStyle(poster).opacity;
    }
    if (performance.now() < until) requestAnimationFrame(sample);
    else pending = false;
  }
  function start() {
    until = performance.now() + 2500;
    if (pending) return;
    pending = true;
    requestAnimationFrame(sample);
  }
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('button')) start();
  }, true);
  start();
} else if (mode === 'events') {
  // Media observation and logging without geometry or computed-style reads.
  const attached = new WeakSet();
  function log(event, video, metadata) {
    console.info('[media-isolation]', JSON.stringify({
      at: performance.now(), event, src: video.getAttribute('src'),
      ready: video.readyState, time: video.currentTime, paused: video.paused,
      metadata,
    }));
  }
  function attach() {
    for (const video of document.querySelectorAll('video')) {
      if (attached.has(video)) continue;
      attached.add(video);
      log('mount', video);
      for (const name of ['loadstart', 'loadedmetadata', 'loadeddata', 'play', 'playing', 'pause', 'waiting', 'stalled', 'emptied', 'error']) {
        video.addEventListener(name, () => {
          log(name, video);
          if (name !== 'loadeddata' || !video.requestVideoFrameCallback) return;
          let count = 0;
          const frame = (now, metadata) => {
            if (!video.isConnected) return;
            log('video-frame', video, { now, ...metadata });
            if (++count < 3) video.requestVideoFrameCallback(frame);
          };
          video.requestVideoFrameCallback(frame);
        });
      }
    }
  }
  new MutationObserver(attach).observe(document.getElementById('root'), {
    childList: true, subtree: true, attributes: true, attributeFilter: ['src'],
  });
  attach();
}
