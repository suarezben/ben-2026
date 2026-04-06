/**
 * Desktop horizontal rail sizing. `2xl` matches Tailwind’s 1536px breakpoint.
 * Keep IntroCard `2xl:*` classes in sync with these numbers.
 */
export const DESKTOP_RAIL_HEIGHT_MD = 499;
export const DESKTOP_RAIL_HEIGHT_2XL = 568;
export const DESKTOP_INTRO_WIDTH_MD = 407;
export const DESKTOP_INTRO_WIDTH_2XL = 440;

/** Lyft: desktop intro + media cards ~15% narrower; keep IntroCard outer classes in sync. */
export const LYFT_DESKTOP_RAIL_WIDTH_SCALE = 0.85;
/** Mobile: `min-w-full` keeps full column width when the title is short; desktop: fixed Lyft rail widths. */
export const LYFT_INTRO_CARD_OUTER_WIDTH_CLASSES =
  'max-md:min-w-full md:w-[346px] md:min-w-[346px] 2xl:w-[374px] 2xl:min-w-[374px]';

export const MEDIA_QUERY_2XL = '(min-width: 1536px)';
