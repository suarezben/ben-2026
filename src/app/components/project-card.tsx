import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TVStaticCanvas } from "./tv-static-canvas";
import { getSvgPath } from 'figma-squircle';
import { useId, useMemo, useRef, useEffect, useState, type SyntheticEvent } from 'react';
import { useIs2xlViewport } from '../hooks/use-is-2xl-viewport';
import { markMediaFetched } from '../lib/prefetch-media';
import {
  DESKTOP_RAIL_HEIGHT_2XL,
  DESKTOP_RAIL_HEIGHT_MD,
} from '../lib/desktop-rail-layout';

function squircleMaskStyles(width: number, height: number, pathD: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path fill="#121111" d="${pathD}"/></svg>`;
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
  /** Build-time first-frame poster (videos) — real URL, cached alongside the video. */
  posterUrl?: string;
  /** Build-time tiny blurred placeholder (data URI) — paints instantly with zero network. */
  lqip?: string;
  /** LQIP for `imageUrlMobile` when it differs from desktop art. */
  lqipMobile?: string;
  /** Aspect ratio from the build manifest so layout is correct on first paint. */
  preloadedAspectRatio?: number;
  /** Manifest aspect for `imageUrlMobile` when it differs from desktop art. */
  preloadedMobileAspectRatio?: number;
  /** Desktop rail width multiplier (e.g. 0.85 for Lyft). */
  desktopRailWidthScale?: number;
}

/** md breakpoint, synchronous initial value — gates which of the two <video> elements gets a src. */
function useIsMdUp(): boolean {
  const [isMdUp, setIsMdUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsMdUp(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isMdUp;
}

export function ProjectCard({
  imageUrl,
  imageUrlMobile,
  videoUrl,
  mediaType,
  alt = 'Project media',
  posterUrl,
  lqip,
  lqipMobile,
  preloadedAspectRatio,
  preloadedMobileAspectRatio,
  desktopRailWidthScale = 1,
}: ProjectCardProps) {
  const is2xl = useIs2xlViewport();
  const isMdUp = useIsMdUp();
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
  const [hasBeenInView, setHasBeenInView] = useState(false);
  /** False until decoded frames are ready — the poster keeps covering the video until real frames exist. */
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
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

  // Poster / image elements fetch natively as soon as the card mounts — tell the
  // background prefetcher so it never downloads the same URL in parallel.
  useEffect(() => {
    markMediaFetched([imageUrl, imageUrlMobile, posterUrl]);
  }, [imageUrl, imageUrlMobile, posterUrl]);

  // Attach file URL after first viewport entry; keep it attached to avoid reload flashes.
  useEffect(() => {
    if (mediaType !== 'video' || !videoUrl) return;
    if (isInView || hasBeenInView) {
      setVideoSrc(videoUrl);
      markMediaFetched([videoUrl]);
    } else {
      setVideoSrc('');
    }
  }, [mediaType, videoUrl, isInView, hasBeenInView]);

  // New clip: hide video until real frames land (LQIP/poster stay visible meanwhile).
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

  const posterFadeClass = 'transition-opacity duration-250 ease-out';
  /** Blurred inline placeholder — paints on first frame, no network. */
  const lqipImgClass =
    'absolute inset-0 z-[1] h-full w-full origin-center scale-[1.06] pointer-events-none';
  const lqipImgStyle = { filter: 'blur(18px)' } as const;
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
            <path d={squirclePathMobile} fill="#121111" />
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
            <path d={squirclePathDesktop} fill="#121111" />
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
            {lqip ? (
              <img
                src={lqip}
                alt=""
                aria-hidden
                className={`${lqipImgClass} object-contain ${posterFadeClass} ${
                  videoStarted ? 'opacity-0' : 'opacity-100'
                }`}
                style={lqipImgStyle}
              />
            ) : (
              !videoStarted && (
                <div
                  aria-hidden
                  className="absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none"
                />
              )
            )}
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                aria-hidden
                loading="eager"
                className={`absolute inset-0 z-[3] h-full w-full origin-center scale-[1.02] object-contain pointer-events-none ${
                  videoStarted ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            <video
              ref={mobileVideoRef}
              src={(!isMdUp ? videoSrc : '') || undefined}
              poster={posterUrl}
              preload="auto"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) {
                  setAspectRatio(v.videoWidth / v.videoHeight);
                }
              }}
              onLoadedData={onVideoDecodedFrame}
              className="absolute inset-0 z-[2] h-full w-full origin-center scale-[1.02] object-contain cursor-default opacity-100"
              autoPlay
              loop
              muted
              playsInline
            />
          </>
        )}
        {mediaType === 'image' && imageUrl && mobileImgSrc && (
          <>
            {(imageUrlMobile ? lqipMobile ?? lqip : lqip) ? (
              <img
                src={imageUrlMobile ? lqipMobile ?? lqip : lqip}
                alt=""
                aria-hidden
                className={`${lqipImgClass} object-contain ${posterFadeClass} ${
                  mobileImgReady ? 'opacity-0' : 'opacity-100'
                }`}
                style={lqipImgStyle}
              />
            ) : (
              <div
                aria-hidden
                className={`absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none ${posterFadeClass} ${
                  mobileImgReady ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            <ImageWithFallback
              src={mobileImgSrc}
              alt={alt}
              onLoad={() =>
                splitImageArt ? setMobileImageReady(true) : setImageReady(true)
              }
              className={`absolute inset-0 z-[2] h-full w-full object-contain pointer-events-none ${posterFadeClass} ${
                mobileImgReady ? 'opacity-100' : 'opacity-0'
              }`}
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
            {lqip ? (
              <img
                src={lqip}
                alt=""
                aria-hidden
                className={`${lqipImgClass} object-cover ${posterFadeClass} ${
                  videoStarted ? 'opacity-0' : 'opacity-100'
                }`}
                style={lqipImgStyle}
              />
            ) : (
              !videoStarted && (
                <div
                  aria-hidden
                  className="absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none"
                />
              )
            )}
            {posterUrl && (
              <img
                src={posterUrl}
                alt=""
                aria-hidden
                loading="eager"
                className={`absolute inset-0 z-[3] h-full w-full origin-center scale-[1.02] object-cover pointer-events-none ${
                  videoStarted ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            <video
              ref={desktopVideoRef}
              src={(isMdUp ? videoSrc : '') || undefined}
              poster={posterUrl}
              preload="auto"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) {
                  setAspectRatio(v.videoWidth / v.videoHeight);
                }
              }}
              onLoadedData={onVideoDecodedFrame}
              className="absolute inset-0 z-[2] h-full w-full origin-center scale-[1.02] object-cover cursor-none opacity-100"
              autoPlay
              loop
              muted
              playsInline
            />
          </>
        )}
        {mediaType === 'image' && imageUrl && (
          <>
            {lqip ? (
              <img
                src={lqip}
                alt=""
                aria-hidden
                className={`${lqipImgClass} object-cover ${posterFadeClass} ${
                  desktopImgReady ? 'opacity-0' : 'opacity-100'
                }`}
                style={lqipImgStyle}
              />
            ) : (
              <div
                aria-hidden
                className={`absolute inset-0 z-[1] bg-gradient-to-br from-[#dcdcdc] via-[#ececec] to-[#d4d4d4] pointer-events-none ${posterFadeClass} ${
                  desktopImgReady ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}
            <ImageWithFallback
              src={imageUrl}
              alt={alt}
              onLoad={() =>
                splitImageArt ? setDesktopImageReady(true) : setImageReady(true)
              }
              className={`absolute inset-0 z-[2] h-full w-full object-cover pointer-events-none ${posterFadeClass} ${
                desktopImgReady ? 'opacity-100' : 'opacity-0'
              }`}
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
