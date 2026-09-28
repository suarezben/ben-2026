import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVideoPlayback } from '../../src/app/lib/video-playback.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const video = new EventTarget();
  const page = new EventTarget();
  Object.assign(page, { hidden: false });
  Object.assign(video, {
    paused: true, readyState: 4, calls: 0,
    play() {
      this.calls++;
      if (this.reject) return Promise.reject(Object.assign(new Error(), { name: this.reject }));
      this.paused = false;
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    },
    pause() { this.paused = true; },
    load() { this.error = null; },
  });
  const states = [];
  return { video, page, states, control: createVideoPlayback(video, s => states.push(s), page) };
}

test('blocked autoplay offers play and retries on user intent', async () => {
  const { video, states, control } = fixture();
  video.reject = 'NotAllowedError';
  control.setVisible(true);
  await flush();
  assert.equal(states.at(-1), 'play');
  video.dispatchEvent(new Event('canplay'));
  assert.equal(video.calls, 1);
  video.reject = null;
  control.retry();
  await flush();
  assert.equal(states.at(-1), 'playing');
  control.dispose();
});

test('offscreen and hidden videos pause, visible videos resume', async () => {
  const { video, page, control } = fixture();
  control.setVisible(false);
  assert.equal(video.calls, 0);
  control.setVisible(true);
  await flush();
  page.hidden = true;
  page.dispatchEvent(new Event('visibilitychange'));
  assert.equal(video.paused, true);
  page.hidden = false;
  page.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(video.paused, false);
  control.dispose();
  video.dispatchEvent(new Event('canplay'));
  assert.equal(video.paused, true);
});

test('media errors offer recovery', async () => {
  const { video, states, control } = fixture();
  video.reject = 'NotSupportedError';
  control.setVisible(true);
  await flush();
  assert.equal(states.at(-1), 'retry');
  control.dispose();
});
