export type MediaWarmMaps = {
  frames: Map<string, string>;
  ratios: Map<string, number>;
  imageRatios: Map<string, number>;
};

export function warmMediaCardProps(
  imageUrl: string | undefined,
  imageUrlMobile: string | undefined,
  videoUrl: string | undefined,
  warm: MediaWarmMaps
) {
  if (videoUrl) {
    const frame = warm.frames.get(videoUrl);
    const ratio = warm.ratios.get(videoUrl);
    return {
      preloadedFirstFrame: frame,
      preloadedVideoReady: !!frame,
      preloadedAspectRatio: ratio,
    };
  }
  if (imageUrl) {
    const ratio = warm.imageRatios.get(imageUrl);
    const ratioM = imageUrlMobile ? warm.imageRatios.get(imageUrlMobile) : undefined;
    const out: {
      preloadedAspectRatio?: number;
      preloadedMobileAspectRatio?: number;
    } = {};
    if (ratio != null && ratio > 0) out.preloadedAspectRatio = ratio;
    if (ratioM != null && ratioM > 0) out.preloadedMobileAspectRatio = ratioM;
    return Object.keys(out).length > 0 ? out : {};
  }
  return {};
}
