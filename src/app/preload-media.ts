/**
 * Preloads images and videos for the given project IDs. Records image aspect ratios and,
 * for videos, extracts the first frame plus aspect ratio for poster / stable layout.
 * Individual failures are ignored so one bad asset does not block the rest.
 */

export type ProjectMediaEntry = {
  mediaType: 'image' | 'video';
  url: string;
  /** Optional mobile-only image; desktop uses `url`. */
  mobileUrl?: string;
};
export type ProjectMediaJson = {
  _generatedAt?: number;
  [projectId: string]: ProjectMediaEntry[] | number | undefined;
};
export type ProjectLogosJson = { [projectId: string]: string };

/** Load image and record natural aspect ratio (keyed by full `src` including cache buster). */
function preloadImageWithAspect(src: string, aspectRatios: Map<string, number>): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        aspectRatios.set(src, img.naturalWidth / img.naturalHeight);
      }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

const VIDEO_PRELOAD_TIMEOUT_MS = 10000;

function preloadVideoAndCaptureFirstFrame(
  src: string,
  firstFrames: Map<string, string>,
  aspectRatios: Map<string, number>
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timeoutId = setTimeout(finish, VIDEO_PRELOAD_TIMEOUT_MS);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const onSeeked = () => {
      clearTimeout(timeoutId);
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        aspectRatios.set(src, video.videoWidth / video.videoHeight);
      }
      if (!ctx || video.videoWidth === 0) {
        finish();
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        firstFrames.set(src, dataUrl);
      } catch {
        // crossOrigin or tainted canvas – continue without first frame
      }
      finish();
    };

    const onError = () => {
      clearTimeout(timeoutId);
      if (settled) return;
      settled = true;
      reject(new Error(`Failed to load video: ${src}`));
    };
    // Use loadeddata so we can seek to 0.1 and get first frame without waiting for full buffer (faster than canplaythrough)
    const onLoadedData = () => {
      video.currentTime = 0.1;
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('loadeddata', onLoadedData, { once: true });
    video.src = src;
  });
}

/** Preloads all images and videos for the given project IDs and fills the returned maps. */
export function preloadProjectMedia(
  projectIds: string[],
  projectMedia: ProjectMediaJson,
  projectLogos: ProjectLogosJson
): Promise<{
  firstFrames: Map<string, string>;
  videoAspectRatios: Map<string, number>;
  imageAspectRatios: Map<string, number>;
}> {
  const cacheBuster =
    projectMedia._generatedAt != null ? `?v=${projectMedia._generatedAt}` : '';
  const firstFrames = new Map<string, string>();
  const videoAspectRatios = new Map<string, number>();
  const imageAspectRatios = new Map<string, number>();

  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  for (const id of projectIds) {
    const logoUrl = projectLogos[id];
    if (logoUrl) {
      imageUrls.push(logoUrl + cacheBuster);
    }
    const entries = projectMedia[id];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as ProjectMediaEntry[]) {
      const url = entry.url + cacheBuster;
      if (entry.mediaType === 'image') {
        imageUrls.push(url);
        if (entry.mobileUrl) {
          imageUrls.push(entry.mobileUrl + cacheBuster);
        }
      } else if (entry.mediaType === 'video') {
        videoUrls.push(url);
      }
    }
  }

  const imagePromises = imageUrls.map((src) =>
    preloadImageWithAspect(src, imageAspectRatios).catch(() => {
      /* continue; one failed image doesn't block */
    })
  );
  const videoPromises = videoUrls.map((src) =>
    preloadVideoAndCaptureFirstFrame(src, firstFrames, videoAspectRatios).catch(() => {
      /* continue; one failed video doesn't block others */
    })
  );

  return Promise.all([...imagePromises, ...videoPromises]).then(() => ({
    firstFrames,
    videoAspectRatios,
    imageAspectRatios,
  }));
}
