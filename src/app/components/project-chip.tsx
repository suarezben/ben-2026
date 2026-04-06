import { motion } from 'motion/react';
import { forwardRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getSvgPath } from 'figma-squircle';

interface ProjectChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClickCapture?: (e: React.MouseEvent | React.TouchEvent) => void;
}

function assignRef<T>(r: React.ForwardedRef<T>, value: T | null) {
  if (typeof r === 'function') r(value);
  else if (r) r.current = value;
}

/** Hover scale only when a real hover-capable fine pointer exists (not touch). */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return fine;
}

export const ProjectChip = forwardRef<HTMLButtonElement, ProjectChipProps>(
  ({ label, isActive, onClick, onClickCapture }, ref) => {
    const finePointer = useFinePointer();
    const localRef = useRef<HTMLButtonElement>(null);
    const [size, setSize] = useState({ w: 0, h: 0 });

    const setRefs = useCallback(
      (el: HTMLButtonElement | null) => {
        localRef.current = el;
        assignRef(ref, el);
      },
      [ref]
    );

    useLayoutEffect(() => {
      const el = localRef.current;
      if (!el) return;
      const update = () => {
        const r = el.getBoundingClientRect();
        // Integer px for stable mask SVG; avoids subpixel drift vs layout on WebKit.
        const w = Math.max(1, Math.round(r.width));
        const h = Math.max(1, Math.round(r.height));
        if (w > 0 && h > 0) setSize({ w, h });
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, [label]);

    const squircleMask = useMemo(() => {
      const { w, h } = size;
      if (w < 4 || h < 4) return undefined;
      const cornerRadius = Math.min(h / 2, w / 2);
      const path = getSvgPath({
        width: w,
        height: h,
        cornerRadius,
        cornerSmoothing: 1,
        preserveSmoothing: true,
      });
      const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><path d="${path}" fill="black"/></svg>`;
      const encoded = encodeURIComponent(svg);
      return {
        WebkitMaskImage: `url("data:image/svg+xml,${encoded}")`,
        WebkitMaskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: `url("data:image/svg+xml,${encoded}")`,
        maskSize: '100% 100%' as const,
        maskRepeat: 'no-repeat' as const,
        maskPosition: 'center',
      };
    }, [size.w, size.h]);

    const tapTransition = { type: 'spring' as const, stiffness: 520, damping: 32, mass: 0.35 };

    return (
      <motion.button
        ref={setRefs}
        onClick={onClick}
        onClickCapture={onClickCapture}
        style={
          squircleMask
            ? {
                ...squircleMask,
                transformOrigin: 'center',
                isolation: 'isolate',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }
            : { transformOrigin: 'center' }
        }
        whileHover={finePointer ? { scale: 1.02 } : undefined}
        whileTap={
          finePointer
            ? { scale: 0.96, opacity: 0.92 }
            : {
                // ~15% stronger press than desktop: (1 − 0.96) × 1.15 → scale 0.954
                scale: 0.954,
                opacity: 0.92,
              }
        }
        transition={tapTransition}
        className={`min-w-[88px] md:min-w-[70px] lg:min-w-[75px] xl:min-w-[80px] md:cursor-none px-[14px] py-[10px] md:px-[10px] lg:px-[10px] xl:px-[11px] md:py-[7px] lg:py-[8px] xl:py-[8px] shrink-0 transition-colors ${
          squircleMask
            ? 'overflow-visible rounded-none [transform:translateZ(0)]'
            : 'overflow-hidden rounded-[88px] md:rounded-[60px] lg:rounded-[64px] xl:rounded-[68px]'
        } ${
          isActive
            ? 'bg-[#121111] text-white md:bg-black'
            : 'bg-[#f2f2f2] text-black md:bg-[rgb(0_0_0/0.05)] md:hover:bg-[rgb(0_0_0/0.08)]'
        }`}
      >
        <p className="antialiased font-['Inter',sans-serif] font-medium md:font-normal leading-[normal] not-italic text-[14px] md:text-[13.6px] lg:text-[14.8px] xl:text-[16.6px] text-center tracking-[-0.7px] md:tracking-[-0.61px] lg:tracking-[-0.67px] xl:tracking-[-0.75px]">
          {label}
        </p>
      </motion.button>
    );
  }
);

ProjectChip.displayName = 'ProjectChip';
