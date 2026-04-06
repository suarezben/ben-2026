import React, { type ReactNode } from 'react';
import {
  LYFT_DESKTOP_RAIL_WIDTH_SCALE,
  LYFT_INTRO_CARD_OUTER_WIDTH_CLASSES,
} from '../lib/desktop-rail-layout';

interface IntroCardProps {
  projectName: string;
  /** Shown upper-left in the eyebrow row (e.g. role: “Design Lead” → “DESIGN LEAD”). */
  subtitle: string;
  year: string;
  description: string;
  logo: ReactNode;
  logoWide?: boolean;
  /** 15% larger logo container (e.g. Sutter Hill) */
  logoLarger?: boolean;
  /** Pairs with `<img>` classes in App.tsx `projectsWithMedia`. */
  logoLayout?: 'horizontal-large' | 'compact' | 'sutter-hill';
  /** When true, keep `projectName` on one line (skip ` & ` two-line split). */
  titleSingleLine?: boolean;
  /** Desktop rail only: pass `LYFT_DESKTOP_RAIL_WIDTH_SCALE` from App for Lyft. */
  railWidthScale?: number;
}

/**
 * Year-range arrow from Figma node `4174:13185` (filled path from exported SVG).
 * Path opacity in file was 0.4; eyebrow row already uses `opacity-40`, so fill is `currentColor` only.
 */
function ThinYearArrow({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 origin-center scale-[1.1] translate-y-[0.5px] pb-[2px] ${className}`.trim()}
      width={9}
      height={8}
      viewBox="0 0 8.76989 8.26705"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M4.63636 8.26705L3.75852 7.39773L6.38778 4.76847H0V3.49858H6.38778L3.75852 0.87358L4.63636 0L8.76989 4.13352L4.63636 8.26705Z"
      />
    </svg>
  );
}

/** Renders `2023-2025` / `2025-Present` with thin SVG arrow; passthrough if no range pattern. */
function YearEyebrow({ year }: { year: string }) {
  const m = year.match(/^(\d{4})-(.+)$/);
  if (!m) {
    return <span>{year}</span>;
  }
  return (
    <span className="inline-flex items-center justify-end gap-[3px]">
      <span>{m[1]}</span>
      <ThinYearArrow />
      <span>{m[2]}</span>
    </span>
  );
}

/** Split titles like `Aiden & Espresso Series 1` into two lines like Figma. */
function projectNameLines(projectName: string): string[] | null {
  const idx = projectName.indexOf(' & ');
  if (idx === -1) return null;
  const a = projectName.slice(0, idx + 3).trimEnd();
  const b = projectName.slice(idx + 3).trimStart();
  if (!b) return null;
  return [a, b];
}

/**
 * Intro / title card — layout from Figma node `4170:9869` (MCP `get_design_context`).
 * Desktop `md` / `2xl` widths & heights match `src/app/lib/desktop-rail-layout.ts` (ProjectCard rail;
 * Lyft uses `LYFT_INTRO_CARD_OUTER_WIDTH_CLASSES` there).
 */
export function IntroCard({
  projectName,
  subtitle,
  year,
  description,
  logo,
  titleSingleLine,
  railWidthScale,
}: IntroCardProps) {
  const titleLines = titleSingleLine ? null : projectNameLines(projectName);
  const eyebrowLeft = subtitle.toUpperCase();

  const hasLogo = Boolean(logo);
  const outerWidthClass =
    railWidthScale === LYFT_DESKTOP_RAIL_WIDTH_SCALE
      ? LYFT_INTRO_CARD_OUTER_WIDTH_CLASSES
      : 'md:w-[407px] 2xl:w-[440px]';

  return (
    <div className={`flex-shrink-0 w-full select-none ${outerWidthClass}`}>
      <div
        className={`bg-[#f7f7f7] border border-[rgba(0,0,0,0.03)] border-solid flex flex-col items-stretch relative rounded-[32px] overflow-visible
        min-h-[300px] h-auto
        md:h-[499px] md:justify-between 2xl:h-[568px]
        px-[18px] pt-[18px] ${hasLogo ? 'pb-0 md:pb-[18px]' : 'pb-[18px]'}`}
      >
        <div className="content-stretch flex flex-col gap-[12px] items-start not-italic relative shrink-0 w-full">
          {/* Figma: Inter 600, 12px, line-height 22px, letter-spacing 0%, black @ 40% opacity, vertical align bottom */}
          <div className="content-stretch flex font-['Inter',sans-serif] font-semibold items-end justify-between relative shrink-0 text-[12px] text-black w-full gap-3">
            <div className="flex flex-col justify-end opacity-40 relative shrink-0 min-w-0">
              <p className="leading-[22px] tracking-normal">{eyebrowLeft}</p>
            </div>
            <div className="flex flex-col justify-end opacity-40 relative shrink-0 text-right min-w-0">
              <p className="leading-[22px] tracking-normal">
                <YearEyebrow year={year} />
              </p>
            </div>
          </div>

          <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
            <div className="font-['Alliance_No.1',sans-serif] font-normal leading-[0] relative shrink-0 text-[24px] text-black tracking-[-1.2px] md:tracking-[-1.08px] w-full">
              {titleLines ? (
                <>
                  <p className="leading-[normal] mb-0">{titleLines[0]}</p>
                  <p className="leading-[normal]">{titleLines[1]}</p>
                </>
              ) : (
                <p className="leading-[normal] whitespace-pre-wrap">{projectName}</p>
              )}
            </div>
            <p className="font-['Inter',sans-serif] font-normal leading-[normal] relative shrink-0 text-[14px] text-[rgb(0_0_0/0.4)] w-full whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>

        {logo ? (
          <>
            {/* Mobile: flex-1 eats extra height (min 23px) so logo sits on bottom like Figma space-between; hidden on md. */}
            <div className="min-h-[23px] w-full flex-1 basis-0 md:hidden" aria-hidden />
            <div className="hidden h-[68px] w-full shrink-0 md:block 2xl:h-[77px]" aria-hidden />
            <div
              className="flex w-auto max-w-full shrink-0 flex-col items-start self-start justify-start gap-0 overflow-visible leading-none pb-[18px] md:pb-0 [&_img]:block [&_img]:object-contain [&_img]:object-left [&_img]:overflow-visible md:[&_img]:max-h-[34px] md:[&_img]:w-auto md:[&_img]:max-w-[200px] [&_svg]:block [&_svg]:max-h-[28px] [&_svg]:w-auto [&_svg]:max-w-[min(100%,240px)] [&_svg]:object-contain [&_svg]:shrink-0 md:[&_svg]:max-h-[32px]"
            >
              {logo}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
