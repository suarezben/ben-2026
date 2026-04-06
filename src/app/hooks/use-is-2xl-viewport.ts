import { useSyncExternalStore } from 'react';
import { MEDIA_QUERY_2XL } from '../lib/desktop-rail-layout';

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(MEDIA_QUERY_2XL);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(MEDIA_QUERY_2XL).matches;
}

function getServerSnapshot() {
  return false;
}

/** True when viewport is at least Tailwind `2xl` (1536px). */
export function useIs2xlViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
