/**
 * Load + swap reveal tunables, shared by page content and the header (URL params, read once):
 * - `?loadblurms=` first-load reveal length, desktop and mobile (default 1000)
 * - `?loadblur=0` static desktop first paint, for comparison
 * - `?swapblurms=` Work/Writing swap length for content and header text (default 250)
 * - `?swapblurpx=` swap blur radius for content and header text (default 5)
 */
const REVEAL_PARAMS = new URLSearchParams(
  typeof window === 'undefined' ? '' : window.location.search
);

const revealNumParam = (key: string, fallback: number) => {
  const value = Number(REVEAL_PARAMS.get(key));
  return REVEAL_PARAMS.has(key) && Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const DESKTOP_FIRST_LOAD_BLUR = REVEAL_PARAMS.get('loadblur') !== '0';
export const LOAD_REVEAL_S = revealNumParam('loadblurms', 1000) / 1000;
export const LOAD_REVEAL_TRANSITION = {
  duration: LOAD_REVEAL_S,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const SWAP_BLUR_PX = revealNumParam('swapblurpx', 5);
export const SWAP_S = revealNumParam('swapblurms', 250) / 1000;
