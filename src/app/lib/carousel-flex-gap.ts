/** Extra flex gap while rubber-banding (added to base 30px). */
function carouselRubberSpreadStepPx(rubberBandOffset: number): number {
  return Math.min(80, Math.abs(rubberBandOffset) * 0.55);
}

export const CAROUSEL_MEDIA_GAP_BASE_PX = 30;

export function carouselFlexGapPx(rubberBandOffset: number): number {
  return CAROUSEL_MEDIA_GAP_BASE_PX + carouselRubberSpreadStepPx(rubberBandOffset);
}

/**
 * Origami-style row anchor: pull past the **left** → pack start, extra gap grows to the **right**.
 * Pull past the **right** → pack end, extra gap grows to the **left** (viewport parent unchanged).
 */
export function carouselRowJustifyContent(
  rubberBandOffset: number
): 'flex-start' | 'flex-end' {
  return rubberBandOffset < 0 ? 'flex-end' : 'flex-start';
}
