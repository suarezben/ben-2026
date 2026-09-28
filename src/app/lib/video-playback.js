/** Explicit playback ownership, with a recoverable fallback for autoplay policy. */
export function createVideoPlayback(video, onState, page = document) {
  let visible = false;
  let disposed = false;
  let pending = false;
  let blocked = false;
  let generation = 0;
  let timer;
  const clear = () => clearTimeout(timer);
  const eligible = () => !disposed && visible && !page.hidden;
  const stalled = () => {
    clear();
    if (eligible()) timer = setTimeout(() => {
      if (eligible()) onState('retry');
    }, 8000);
  };
  const attempt = () => {
    if (!eligible() || pending || blocked) return;
    if (!video.paused && video.readyState >= 3) {
      clear();
      onState('playing');
      return;
    }
    pending = true;
    const request = ++generation;
    video.muted = true;
    onState('loading');
    stalled();
    Promise.resolve(video.play()).then(() => {
      if (request !== generation) return;
      if (!eligible()) video.pause();
    }).catch((error) => {
      if (!eligible() || request !== generation) return;
      if (error.name === 'NotAllowedError') {
        blocked = true;
        clear();
        onState('play');
      } else if (error.name !== 'AbortError') {
        clear();
        onState('retry');
      }
    }).finally(() => { if (request === generation) pending = false; });
  };
  const playing = () => {
    clear();
    if (eligible()) onState('playing');
    else video.pause();
  };
  const error = () => { clear(); if (eligible()) onState('retry'); };
  const sync = () => {
    if (eligible()) attempt();
    else { clear(); video.pause(); }
  };
  const events = { playing, waiting: stalled, stalled, error, canplay: attempt };
  for (const [name, handler] of Object.entries(events)) video.addEventListener(name, handler);
  page.addEventListener('visibilitychange', sync);
  return {
    setVisible(value) { visible = value; sync(); },
    retry() {
      blocked = false;
      generation++;
      const reload = pending || video.error;
      pending = false;
      if (reload) video.load();
      attempt();
    },
    dispose() {
      disposed = true;
      generation++;
      clear();
      video.pause();
      for (const [name, handler] of Object.entries(events)) video.removeEventListener(name, handler);
      page.removeEventListener('visibilitychange', sync);
    },
  };
}
