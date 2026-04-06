import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TVStaticCanvas } from './tv-static-canvas';
import sutterHillPortfolioLogos from '@/content/sutter-hill-portfolio-logos.json';

function publicAssetUrl(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}

type LogoEntry = { src: string; alt: string };

const { logos } = sutterHillPortfolioLogos as { logos: LogoEntry[] };

const STATIC_SLOT_KEYS = ['sh-static-a', 'sh-static-b', 'sh-static-c', 'sh-static-d'] as const;

/** Desktop: cols 1–3 = two logos stacked per column; cols 4–5 = 2×2 TV static (matches visual order). */
const LOGO_DESKTOP_PLACEMENT = [
  'md:col-start-1 md:row-start-1',
  'md:col-start-1 md:row-start-2',
  'md:col-start-2 md:row-start-1',
  'md:col-start-2 md:row-start-2',
  'md:col-start-3 md:row-start-1',
  'md:col-start-3 md:row-start-2',
] as const;

const STATIC_DESKTOP_PLACEMENT = [
  'md:col-start-4 md:row-start-1',
  'md:col-start-5 md:row-start-1',
  'md:col-start-4 md:row-start-2',
  'md:col-start-5 md:row-start-2',
] as const;

/** Single 1px hairline — avoid stacking border + inset shadow (reads as ~2px). */
const CELL_FRAME =
  'rounded-[32px] border border-solid border-[rgb(0_0_0/0.08)] box-border';

/** 5×2 desktop: same ~233px cells as the original 3×2 × 759px block; width = 5×233 + 4×30. */
const GRID_WIDTH_MD = 5 * 233 + 4 * 30;
const GRID_WIDTH_2XL = Math.round((GRID_WIDTH_MD * 568) / 499);

/**
 * TV static / pixel grid — matches `ProjectCard` placeholder shader (`DEFAULT_TV_SHADER_PARAMS`).
 * Canvas backing store tracks layout × DPR so it stays sharp in each cell.
 */
function SutterHillStaticTile() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 320, h: 320 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
      const w = Math.max(48, Math.round(r.width * dpr));
      const h = Math.max(48, Math.round(r.height * dpr));
      setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="h-full min-h-[120px] w-full md:min-h-0">
      <TVStaticCanvas width={dims.w} height={dims.h} className="h-full w-full" />
    </div>
  );
}

/**
 * Portfolio company marks + TV-static tiles — same 32px radius and hairline border as intro cards.
 * Desktop: three columns of two stacked logos, then four static tiles in a 2×2 on the right.
 * Mobile: two columns, auto row flow (logos then static).
 */
/** No text/image selection or native img drag while horizontal carousel drag-scroll runs over marks. */
const GRID_INTERACTION =
  'select-none [&_img]:[-webkit-user-drag:none] [&_canvas]:[-webkit-user-drag:none]';

export function SutterHillLogoGrid() {
  return (
    <div
      className={`w-full shrink-0 md:h-[499px] md:w-[var(--sh-grid-w-md)] 2xl:h-[568px] 2xl:w-[var(--sh-grid-w-2xl)] ${GRID_INTERACTION}`}
      style={
        {
          '--sh-grid-w-md': `${GRID_WIDTH_MD}px`,
          '--sh-grid-w-2xl': `${GRID_WIDTH_2XL}px`,
        } as CSSProperties
      }
    >
      <div className="grid h-full w-full grid-cols-2 gap-[24px] md:grid-cols-5 md:grid-rows-[1fr_1fr] md:gap-[30px]">
        {logos.map((logo, i) => (
          <div
            key={logo.src}
            className={`flex max-md:min-h-[148px] items-center justify-center bg-white p-[10px] md:min-h-0 md:h-full ${CELL_FRAME} ${LOGO_DESKTOP_PLACEMENT[i] ?? ''}`}
          >
            <ImageWithFallback
              src={publicAssetUrl(logo.src)}
              alt={logo.alt}
              className="h-auto w-auto max-h-[64px] max-w-[min(100%,84px)] object-contain object-center md:max-h-[min(102px,38%)] md:max-w-[min(116px,45%)]"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
        {STATIC_SLOT_KEYS.map((key, j) => (
          <div
            key={key}
            className={`overflow-hidden bg-[#f7f7f7] max-md:min-h-[148px] md:min-h-0 md:h-full ${CELL_FRAME} ${STATIC_DESKTOP_PLACEMENT[j] ?? ''}`}
          >
            <SutterHillStaticTile />
          </div>
        ))}
      </div>
    </div>
  );
}
