import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TVStaticCanvas } from "./tv-static-canvas";
import { getSvgPath } from 'figma-squircle';
import { useId, useMemo, useRef, useEffect, useState, type SyntheticEvent } from 'react';
import { useIs2xlViewport } from '../hooks/use-is-2xl-viewport';
import {
  DESKTOP_RAIL_HEIGHT_2XL,
  DESKTOP_RAIL_HEIGHT_MD,
} from '../lib/desktop-rail-layout';

function squircleMaskStyles(width: number, height: number, pathD: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path fill="#000" d="${pathD}"/></svg>`;
  const url = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  return {
    WebkitMaskImage: url,
    WebkitMaskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat' as const,
    WebkitMaskPosition: 'center',
    maskImage: url,
    maskSize: '100% 100%',
    maskRepeat: 'no-repeat' as const,
    maskPosition: 'center',
  };
}

/** Stroke from filename: -w → white, -b → black, else no stroke. */
function strokeFromUrl(url: string | undefined): 'white' | 'black' | 'none' {
  if (!url) return 'none';
  const name = decodeURIComponent(url.split('/').pop() ?? '');
  const base = name.replace(/\.[^.]+$/, '');
  if (base.endsWith('-w')) return 'white';
  if (base.endsWith('-b')) return 'black';
  return 'none';
}

interface ProjectCardProps {
  imageUrl?: string;
  /** Mobile-only asset (`md:hidden`); desktop uses `imageUrl`. */
  imageUrlMobile?: string;
  videoUrl?: string;
  mediaType: 'image' | 'video' | 'placeholder';
  alt?: string;
  /** When set, this card's video was preloaded; use this as poster and show video immediately (no loading/blur). */
  preloadedFirstFrame?: string;
  preloadedVideoReady?: boolean;
  /** Aspect ratio from preload so layout is correct without waiting for video metadata or image decode. */
  preloadedAspectRatio?: number;
  /** Preload aspect for `imageUrlMobile` when it differs from desktop art. */
  preloadedMobileAspectRatio?: number;
  /** Desktop rail width multiplier (e.g. 0.85 for Lyft). */
  desktopRailWidthScale?: number;
}

export function ProjectCard({
  imageUrl,
  imageUrlMobile,
  videoUrl,
  mediaType,
  alt = 'Project media',
  preloadedFirstFrame,
  preloadedVideoReady = false,
  preloadedAspectRatio,
  preloadedMobileAspectRatio,
  desktopRailWidthScale = 1,
}: ProjectCardProps) {
  const is2xl = useIs2xlViewport();
  const id = useId().replace(/:/g, '');
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  /** Video: start at 16/9 so mobile frame isn’t a square flash; images stay null until natural size. */
  const [aspectRatio, setAspectRatio] = useState<number | null>(() => {
    if (preloadedAspectRatio != null) return preloadedAspectRatio;
    if (mediaType === 'video') return 16 / 9;
    return null;
  });
  /** Mobile: measured width and computed height (full-width fit; landscape cropped to square). */
  const [mobileSize, setMobileSize] = useState<{ w: number; h: number } | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(!!preloadedVideoReady);
  /** False until decoded frames are ready — do not tie to `preloadedVideoReady` or the poster flashes away too early. */
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoSrc, setVideoSrc] = useState(preloadedVideoReady && videoUrl ? videoUrl : '');
  /** Image: blur placeholder until decode (shared URL on both breakpoints). */
  const [imageReady, setImageReady] = useState(false);
  /** When `imageUrlMobile` is set, separate decode state per breakpoint. */
  const [mobileImageReady, setMobileImageReady] = useState(false);
  const [desktopImageReady, setDesktopImageReady] = useState(false);
  const splitImageArt = !!(mediaType === 'image' && imageUrl && imageUrlMobile);
  /** Mobile frame height uses this when a dedicated mobile image exists. */
  const [mobileAspectRatio, setMobileAspectRatio] = useState<number | null>(() => {
    if (!imageUrlMobile) return null;
    if (preloadedMobileAspectRatio != null) return preloadedMobileAspectRatio;
    if (preloadedAspectRatio != null) return preloadedAspectRatio;
    return null;
  });

  // In-view observer: gate video loading and first-frame extraction
  useEffect(() => {
    const el = cardContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;
          setIsInView(visible);
          if (visible) setHasBeenInView(true);
        });
      },
      { threshold: 0.01, rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mobile: measure container width and compute height so card keeps content aspect ratio (fit to width, no crop)
  useEffect(() => {
    const el = cardContainerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w <= 0) return;
      const isPlaceholder = mediaType === 'placeholder';
      const ar =
        mediaType === 'placeholder'
          ? 1
          : imageUrlMobile
            ? mobileAspectRatio ?? aspectRatio ?? (mediaType === 'video' ? 16 / 9 : 1)
            : aspectRatio ?? (mediaType === 'video' ? 16 / 9 : 1);
      // Height = width / aspectRatio so the card frame matches content aspect ratio (full width, no cropping)
      const h = isPlaceholder ? w : w / ar;
      setMobileSize({ w: Math.round(w), h: Math.round(h) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspectRatio, mobileAspectRatio, mediaType, imageUrlMobile]);

  // Warmup (or parent) can supply aspect after first paint — keep layout stable for images and video.
  useEffect(() => {
    if (preloadedAspectRatio != null && preloadedAspectRatio > 0) {
      setAspectRatio(preloadedAspectRatio);
    }
  }, [preloadedAspectRatio]);

  useEffect(() => {
    if (preloadedMobileAspectRatio != null && preloadedMobileAspectRatio > 0) {
      setMobileAspectRatio(preloadedMobileAspectRatio);
    }
  }, [preloadedMobileAspectRatio]);

  // Image: only probe natural size if preload didn’t already give us an aspect ratio.
  useEffect(() => {
    if (mediaType !== 'image' || !imageUrl || preloadedAspectRatio != null) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = imageUrl;
  }, [mediaType, imageUrl, preloadedAspectRatio]);

  useEffect(() => {
    if (mediaType !== 'image' || !imageUrlMobile || preloadedMobileAspectRatio != null) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setMobileAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = imageUrlMobile;
  }, [mediaType, imageUrlMobile, preloadedMobileAspectRatio]);

  useEffect(() => {
    if (mediaType !== 'image' || !imageUrl) return;
    setImageReady(false);
    setMobileImageReady(false);
    setDesktopImageReady(false);
  }, [mediaType, imageUrl, imageUrlMobile]);

  // New video URL without preload: fall back to 16:9 until metadata arrives.
  useEffect(() => {
    if (mediaType !== 'video' || !videoUrl) return;
    if (preloadedAspectRatio != null) return;
    setAspectRatio(16 / 9);
  }, [mediaType, videoUrl, preloadedAspectRatio]);

  // Attach file URL when pre-warmed or after first viewport entry; keep it attached to avoid reload flashes.
  useEffect(() => {
    if (mediaType !== 'video' || !videoUrl) return;
    if (preloadedVideoReady) {
      setVideoSrc(videoUrl);
      return;
    }
    setVideoSrc(isInView || hasBeenInView ? videoUrl : '');
  }, [mediaType, videoUrl, isInView, hasBeenInView, preloadedVideoReady]);

  // New clip: hide video until real frames land (poster img stays visible meanwhile).
  useEffect(() => {
    if (mediaType !== 'video') return;
    setVideoStarted(false);
  }, [mediaType, videoUrl]);

  // Intersection Observer: play video in view, pause others
  useEffect(() => {
    if (mediaType !== 'video') return;
    const mobile = mobileVideoRef.current;
    const desktop = desktopVideoRef.current;
    if (!mobile && !desktop) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.5 }
    );
    if (mobile) observer.observe(mobile);
    if (desktop) observer.observe(desktop);
    return () => observer.disconnect();
  }, [mediaType, videoSrc]);

  // Calculate dynamic width based on aspect ratio
  // Desktop: height steps at 2xl (see desktop-rail-layout). Mobile: full-width, height = width/ar.
  const desktopHeight = is2xl ? DESKTOP_RAIL_HEIGHT_2XL : DESKTOP_RAIL_HEIGHT_MD;
  const defaultDesktopWidth = Math.round((705 * desktopHeight) / DESKTOP_RAIL_HEIGHT_MD);
  const isPlaceholder = mediaType === 'placeholder';

  const baseDesktopWidth = isPlaceholder
    ? desktopHeight
    : aspectRatio
      ? Math.round(desktopHeight * aspectRatio)
      : defaultDesktopWidth;
  const desktopWidth = Math.max(
    1,
    Math.round(baseDesktopWidth * desktopRailWidthScale)
  );
  const mobileDisplayWidth = mobileSize?.w ?? 400;
  const mobileDisplayHeight = mobileSize?.h ?? 400;

  const squirclePathDesktop = useMemo(
    () => getSvgPath({ width: desktopWidth, height: desktopHeight, cornerRadius: 32, cornerSmoothing: 0.75 }),
    [desktopWidth, desktopHeight]
  );
  const squirclePathMobile = useMemo(
    () => getSvgPath({ width: mobileDisplayWidth, height: mobileDisplayHeight, cornerRadius: 24, cornerSmoothing: 0.75 }),
    [mobileDisplayWidth, mobileDisplayHeight]
  );

  const maskDesktop = useMemo(
    () => squircleMaskStyles(desktopWidth, desktopHeight, squirclePathDesktop),
    [desktopWidth, desktopHeight, squirclePathDesktop]
  );
  const maskMobile = useMemo(
    () => squircleMaskStyles(mobileDisplayWidth, mobileDisplayHeight, squirclePathMobile),
    [mobileDisplayWidth, mobileDisplayHeight, squirclePathMobile]
  );

  const strokeMobile = strokeFromUrl((imageUrlMobile ?? imageUrl) ?? videoUrl);
  const strokeDesktop = strokeFromUrl(imageUrl ?? videoUrl);
  const strokeColorMobile =
    strokeMobile === 'white' ? 'rgba(255, 255, 255, 0.127)' : 'rgba(0,0,0,0.04)';
  const strokeColorDesktop =
    strokeDesktop === 'white' ? 'rgba(255, 255, 255, 0.127)' : 'rgba(0,0,0,0.04)';

  /** Prefer first *painted* video frame so the handoff from poster matches what the user will see. */
  const onVideoDecodedFrame = (e: SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    const rvfc = (
      v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void }
    ).requestVideoFrameCallback;
    if (typeof rvfc === 'function') {
      rvfc.call(v, () => setVideoStarted(true));
    } else {
      setVideoStarted(true);
    }
  };

  const posterFadeClass = preloadedVideoReady
    ? 'transition-opacity duration-200 ease-out'
    : 'transition-opacity duration-300 ease-out';
  const strokeOverlayMobile =
    strokeMobile !== 'none' ? (
      <svg
        aria-hidden
        className="absolute inset-0 z-[3] pointer-events-none h-full w-full"
        viewBox={`0 0 ${mobileDisplayWidth} ${mobileDisplayHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={`squircle-stroke-m-${id}`}>
            <path d={squirclePathMobile} fill="black" />
          </clipPath>
        </defs>
        <path
          d={squirclePathMobile}
          fill="none"
          stroke={strokeColorMobile}
          strokeWidth={2}
          clipPath={`url(#squircle-stroke-m-${id})`}
        />
      </svg>
    ) : null;
  const strokeOverlayDesktop =
    strokeDesktop !== 'none' ? (
      <svg
        aria-hidden
        className="absolute inset-0 z-[3] pointer-events-none h-full w-full"
        viewBox={`0 0 ${desktopWidth} ${desktopHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={`squircle-stroke-d-${id}`}>
            <path d={squirclePathDesktop} fill="black" />
          </clipPath>
        </defs>
        <path
          d={squirclePathDesktop}
          fill="none"
          stroke={strokeColorDesktop}
          strokeWidth={2}
          clipPath={`url(#squircle-stroke-d-${id})`}
        />
      </svg>
    ) : null;

  const mobileImgReady = splitImageArt ? mobileImageReady : imageReady;
  const desktopImgReady = splitImageArt ? desktopImageReady : imageReady;
  const mobileImgSrc = imageUrlMobile ?? imageUrl;

  return (
    <div ref={cardContainerRef} className="flex-shrink-0 w-full md:w-auto select-none" style={{ maxWidth: '100%' }}>
      {/* Mobile: full-width, height = width (landscape) or width/ar (portrait); media object-fit cover (landscape) / contain (portrait) */}
      {/* Outer clip + layer promote: iOS WebKit can show a 1px mask/compositing seam under squircle-masked media without this. */}
      <div className="md:hidden isolate w-full overflow-hidden rounded-[24px] [transform:translateZ(0)]">
        <div
          className="relative overflow-hidden bg-[#f7f7f7]"
          style={{
            width: '100%',
            height: `${mobileDisplayHeight}px`,
            ...maskMobile,
          }}
        >
        {mediaType === 'video' && videoUrl && (
          <>
            {preloadedFirstFrame ? (
              <img
                src={preloadedFirstFrame}
                alt=""
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                className={`absolute inset-0 z-[1] h-full w-full origin-center scale-[1.02] object-contain pointer-events-none ${posterFadeClass} ${
                  videoStarted ? 'opacity-0' : 'opacity-100'
                }`}
                aria-hidden
              />
            ) : (
              !videoStarted && (
                <div
                  aria-hidden
                  className="absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none"
                />
              )
            )}
            <video
              ref={mobileVideoRef}
              src={videoSrc}
              poster={preloadedFirstFrame}
              preload="auto"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) {
                  setAspectRatio(v.videoWidth / v.videoHeight);
                }
              }}
              onLoadedData={onVideoDecodedFrame}
              onCanPlay={() => {
                setVideoStarted(true);
              }}
              onPlaying={() => {
                setVideoStarted(true);
              }}
              className={`absolute inset-0 z-[2] h-full w-full origin-center scale-[1.02] object-contain cursor-default ${posterFadeClass} ${
                videoStarted ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              loop
              muted
              playsInline
            />
          </>
        )}
        {mediaType === 'image' && imageUrl && mobileImgSrc && (
          <>
            {!mobileImgReady && (
              <div
                aria-hidden
                className="absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none"
              />
            )}
            <ImageWithFallback
              src={mobileImgSrc}
              alt={alt}
              onLoad={() =>
                splitImageArt ? setMobileImageReady(true) : setImageReady(true)
              }
              className={`absolute inset-0 z-[2] h-full w-full object-contain pointer-events-none transition-[filter,opacity] duration-300 ease-out ${
                mobileImgReady ? 'opacity-100' : 'opacity-90'
              }`}
              style={mobileImgReady ? undefined : { filter: 'blur(16px)', transform: 'scale(1.03)' }}
              loading="eager"
              decoding="async"
            />
          </>
        )}
        {mediaType === 'placeholder' && (
          <TVStaticCanvas width={mobileDisplayWidth} height={mobileDisplayHeight} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {strokeOverlayMobile}
        </div>
      </div>

      {/* Desktop */}
      <div
        className={`relative hidden overflow-hidden md:block isolate [transform:translateZ(0)] bg-[#f7f7f7]`}
        style={{
          height: `${desktopHeight}px`,
          width: `${desktopWidth}px`,
          ...maskDesktop,
        }}
      >
        {mediaType === 'video' && videoUrl && (
          <>
            {preloadedFirstFrame ? (
              <img
                src={preloadedFirstFrame}
                alt=""
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                className={`absolute inset-0 z-[1] h-full w-full origin-center scale-[1.02] object-cover pointer-events-none ${posterFadeClass} ${
                  videoStarted ? 'opacity-0' : 'opacity-100'
                }`}
                aria-hidden
              />
            ) : (
              !videoStarted && (
                <div
                  aria-hidden
                  className="absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none"
                />
              )
            )}
            <video
              ref={desktopVideoRef}
              src={videoSrc}
              poster={preloadedFirstFrame}
              preload="auto"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) {
                  setAspectRatio(v.videoWidth / v.videoHeight);
                }
              }}
              onLoadedData={onVideoDecodedFrame}
              onCanPlay={() => {
                setVideoStarted(true);
              }}
              onPlaying={() => {
                setVideoStarted(true);
              }}
              className={`absolute inset-0 z-[2] h-full w-full origin-center scale-[1.02] object-cover cursor-none ${posterFadeClass} ${
                videoStarted ? 'opacity-100' : 'opacity-0'
              }`}
              autoPlay
              loop
              muted
              playsInline
            />
          </>
        )}
        {mediaType === 'image' && imageUrl && (
          <>
            {!desktopImgReady && (
              <div
                aria-hidden
                className="absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none"
              />
            )}
            <ImageWithFallback
              src={imageUrl}
              alt={alt}
              onLoad={() =>
                splitImageArt ? setDesktopImageReady(true) : setImageReady(true)
              }
              className={`absolute inset-0 z-[2] h-full w-full object-cover pointer-events-none transition-[filter,opacity] duration-300 ease-out ${
                desktopImgReady ? 'opacity-100' : 'opacity-90'
              }`}
              style={desktopImgReady ? undefined : { filter: 'blur(16px)', transform: 'scale(1.03)' }}
              loading="eager"
              decoding="async"
            />
          </>
        )}
        {mediaType === 'placeholder' && (
          <TVStaticCanvas width={desktopWidth} height={desktopHeight} className="absolute inset-0 w-full h-full" />
        )}
        {strokeOverlayDesktop}
      </div>
    </div>
  );
}