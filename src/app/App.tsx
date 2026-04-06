import { useState, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { IntroNameHeading } from './components/intro-name-heading';
import { ProjectChip } from './components/project-chip';
import { IntroCard } from './components/intro-card';
import { ProjectCard } from './components/project-card';
import { DesktopCarouselRail } from './components/desktop-carousel-rail';
import { SutterHillLogoGrid } from './components/sutter-hill-logo-grid';
import { CustomCursor } from './components/custom-cursor';
import { MetaLogo } from './components/logos/meta-logo';
import { FellowLogo } from './components/logos/fellow-logo';
import { SutterHillLogo } from './components/logos/sutter-hill-logo';
import { LyftLogo } from './components/logos/lyft-logo';
import { TwitterLogo } from './components/logos/twitter-logo';
import { PeriscopeLogo } from './components/logos/periscope-logo';
import projectMedia from '@/content/project-media.json';
import projectLogos from '@/content/project-logos.json';
import {
  preloadProjectMedia,
  type ProjectMediaJson,
  type ProjectLogosJson,
} from './preload-media';
import { LYFT_DESKTOP_RAIL_WIDTH_SCALE } from './lib/desktop-rail-layout';
import { warmMediaCardProps } from './lib/warm-media-card-props';

/**
 * HOW TO ADD YOUR REAL CONTENT:
 * 
 * TWO TYPES OF CARDS:
 * 
 * 1. INTRO CARD (Title Card):
 *    Shows at the start of each project with:
 *    - Project name, subtitle, year, description, and logo (see `projects` below)
 * 
 * 2. MEDIA CARDS (ProjectCard):
 *    Shows ONLY images or videos - no text overlay
 *    
 *    VIDEO:
 *    { mediaType: 'video', videoUrl: 'https://your-video.mp4' }
 *    (Autoplays when scrolled into view, loops forever, no controls)
 *    
 *    IMAGE:
 *    { mediaType: 'image', imageUrl: 'https://your-image.jpg' }
 * 
 * Cards automatically adjust width based on content aspect ratio!
 */

interface Project {
  id: string;
  name: string;
  company: string;
  role: string;
  year: string;
  introCard: {
    projectName: string;
    /** Gray line under title; falls back to `role` when omitted (see projectsWithMedia). */
    subtitle?: string;
    year: string;
    description: string;
    logo: ReactNode;
    /** Per-intro-card logo slot sizing (see IntroCard + img classes below). */
    logoLayout?: 'horizontal-large' | 'compact' | 'sutter-hill';
    titleSingleLine?: boolean;
  };
  cards: {
    imageUrl?: string;
    /** When set, `md:hidden` art uses this URL; desktop keeps `imageUrl`. */
    imageUrlMobile?: string;
    videoUrl?: string;
    mediaType: 'image' | 'video' | 'placeholder';
    alt?: string;
  }[];
}

/** After `projectsWithMedia` merge, intro card always has a resolved `subtitle` (from `role` if omitted). */
type ProjectForView = Omit<Project, 'introCard'> & {
  introCard: Omit<Project['introCard'], 'subtitle'> & { subtitle: string };
};

const projects: Project[] = [
  {
    id: 'meta',
    name: 'Meta Reality Labs',
    company: 'Meta Reality Labs',
    role: 'Product Designer',
    year: '2025-Present',
    introCard: {
      projectName: 'Wearable Prototyping',
      year: '2025-Present',
      description:
        'Exploring new interaction models for wearables through high-fidelity prototypes. Building Origami tooling and hardware integrations to enable fast, on-device testing across shipped and upcoming devices. Most work is confidential.',
      logo: <MetaLogo />,
    },
    cards: [],
  },
  {
    id: 'fellow',
    name: 'Fellow Products',
    company: 'Fellow Products',
    role: 'Design Lead',
    year: '2023-2025',
    introCard: {
      projectName: 'Aiden Coffee Maker & Espresso Series 1',
      year: '2023-2025',
      description:
        'Led design for Aiden, shaping its interaction model, UI, and overall experience. Defined system behavior, control schemes, and physical inputs. Established a design language later adopted across Espresso Series 1 and future products.',
      logo: <FellowLogo />,
      logoLayout: 'horizontal-large',
    },
    cards: [],
  },
  {
    id: 'general-collaboration',
    name: 'General Collaboration',
    company: 'General Collaboration',
    role: 'Founding Designer',
    year: '2022-2025',
    introCard: {
      projectName: 'Cross-app Collaboration',
      year: '2022-2025',
      description:
        'Founding designer on a cross-tool collaboration platform syncing comments and workflows across tools. Explored and prototyped multiple product directions, defining the interaction model and early architecture.',
      logo: null,
    },
    cards: [],
  },
  {
    id: 'ghost',
    name: 'Ghost Autonomy',
    company: 'Ghost Autonomy',
    role: 'Designer',
    year: '2021-2022',
    introCard: {
      projectName: 'Self-Driving HMI',
      year: '2021-2022',
      description:
        'Designed the driver experience for a self-driving car, centered around an implicit "just let go" handoff where the car takes control. Prototyped interactions across display, audio, haptics, and LED indicators in-car, and built tools to support test track workflows.',
      logo: null,
    },
    cards: [],
  },
  {
    id: 'sutter-hill',
    name: 'Sutter Hill Ventures',
    company: 'Sutter Hill Ventures',
    role: 'Designer in Residence',
    year: '2020-2021',
    introCard: {
      projectName: 'Product Incubator',
      year: '2020-2021',
      description:
        'Worked across early-stage companies and internal incubations. Explored and prototyped new products, helping validate and pitch ideas for funding. Most work is confidential.',
      logo: <SutterHillLogo />,
      logoLayout: 'sutter-hill',
    },
    cards: [],
  },
  {
    id: 'lyft',
    name: 'Lyft',
    company: 'Lyft',
    role: 'Designer',
    year: '2018-2020',
    introCard: {
      projectName: 'Driver App',
      titleSingleLine: true,
      year: '2018-2020',
      description:
        'On the driver app team, designed new ways for drivers to work in response to potential regulations shifting the model from on-demand to employment, including incentive tiers and scheduled, shift-based driving slots.',
      logo: <LyftLogo />,
    },
    cards: [],
  },
  {
    id: 'twitter',
    name: 'Twitter',
    company: 'Twitter',
    role: 'Designer',
    year: '2016-2018',
    introCard: {
      projectName: 'Media & Live Video',
      titleSingleLine: true,
      year: '2016-2018',
      description:
        'Worked on video and live media experiences, including Video Home, a dedicated surface for video viewing that later evolved into Twitter’s Video Tab. Also designed creation and consumption experiences across the app.',
      logo: <TwitterLogo />,
    },
    cards: [],
  },
  {
    id: 'periscope',
    name: 'Periscope',
    company: 'Periscope',
    role: 'Designer',
    year: '2016-2018',
    introCard: {
      projectName: 'Live Broadcasting & Viewing',
      titleSingleLine: true,
      year: '2016-2018',
      description:
        'Designed core live streaming experiences across creation and consumption. Led the redesign of the web experience, with a focus on improving commenting and live reactions.',
      logo: <PeriscopeLogo />,
    },
    cards: [],
  },
];

/** Prefix root-relative public paths with Vite `base` (subpath deploys, preview). */
function publicAssetUrl(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${import.meta.env.BASE_URL}${path.slice(1)}`;
}

/**
 * Intro logos from `<img src=…>` — cap **height** on md+ so intrinsically huge SVGs (e.g. full brand
 * marks) don’t read oversized vs inline components (~25px row). Width follows aspect via `w-auto`.
 */
const INTRO_LOGO_IMG_CLASS_DEFAULT =
  'max-w-full h-auto w-[42px] object-contain object-left md:h-[25px] md:w-auto md:max-w-[130px]';
const INTRO_LOGO_IMG_CLASS_COMPACT =
  'max-w-full h-auto w-[29px] object-contain object-left md:h-[20px] md:w-auto md:max-w-[90px]';
/** Ghost: same as compact, +30% (narrow mark reads small at compact caps). */
const INTRO_LOGO_IMG_CLASS_GHOST =
  'max-w-full h-auto w-[38px] object-contain object-left md:h-[26px] md:w-auto md:max-w-[117px]';
const INTRO_LOGO_IMG_CLASS_HORIZONTAL_LARGE =
  'max-w-full h-auto w-[59px] object-contain object-left md:h-[26px] md:w-auto md:max-w-[150px]';
const INTRO_LOGO_IMG_CLASS_SUTTER_HILL =
  'max-w-full h-auto w-[50px] object-contain object-left md:h-[36px] md:w-auto md:max-w-[120px]';

/** Projects with cards and optional logo from public/projects/<id>/ when present. */
const projectsWithMedia: ProjectForView[] = projects.map((project) => {
  const folderCards = projectMedia[project.id as keyof typeof projectMedia];
  const cards =
    folderCards && folderCards.length > 0
      ? folderCards.map(
          (entry: { mediaType: 'image' | 'video'; url: string; mobileUrl?: string }) => ({
            mediaType: entry.mediaType,
            imageUrl: entry.mediaType === 'image' ? publicAssetUrl(entry.url) : undefined,
            imageUrlMobile:
              entry.mediaType === 'image' && entry.mobileUrl
                ? publicAssetUrl(entry.mobileUrl)
                : undefined,
            videoUrl: entry.mediaType === 'video' ? publicAssetUrl(entry.url) : undefined,
          })
        )
      : project.cards;
  const rawLogo = projectLogos[project.id as keyof typeof projectLogos];
  const logoUrl = typeof rawLogo === 'string' ? publicAssetUrl(rawLogo) : rawLogo;
  const layout = project.introCard.logoLayout;
  const imgClass =
    project.id === 'ghost'
      ? INTRO_LOGO_IMG_CLASS_GHOST
      : layout === 'sutter-hill'
        ? INTRO_LOGO_IMG_CLASS_SUTTER_HILL
        : layout === 'horizontal-large'
          ? INTRO_LOGO_IMG_CLASS_HORIZONTAL_LARGE
          : layout === 'compact'
            ? INTRO_LOGO_IMG_CLASS_COMPACT
            : INTRO_LOGO_IMG_CLASS_DEFAULT;
  const { subtitle: introSubtitle, ...introRest } = project.introCard;
  const introCard = {
    ...introRest,
    subtitle: introSubtitle ?? project.role,
    logo:
      typeof logoUrl === 'string'
        ? (
            <img
              src={logoUrl}
              alt=""
              className={imgClass}
            />
          )
        : project.introCard.logo,
  };
  return { ...project, cards, introCard };
});

/** Desktop carousel: softer shallow overscroll while dragging past the edge. */
function desktopRubberResistance(overscrollPx: number): number {
  return Math.pow(Math.abs(overscrollPx), 0.62) * 1.68;
}

/**
 * With EMA release velocity: start in-bounds inertia when `|v| > stopThreshold × this`.
 */
const CAROUSEL_INERTIA_START_FACTOR = 1.2;

/** Spring used when releasing overscroll — softer / more fluid settle than a snappy snap. */
const CAROUSEL_RUBBER_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 36,
  mass: 0.58,
};

/** Same px as `mobileChipsPinned` — site intro bottom in doc space minus this = minimum scroll Y while pinned. */
const MOBILE_SITE_INTRO_PIN_PX = 2;

/** Mobile first paint: blur + opacity stagger on header, chip row, then stack (hides font/mask settling; no scale). */
const MOBILE_SHELL_STAGGER_PARENT = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
} as const;

const MOBILE_SHELL_STAGGER_CHILD = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
    pointerEvents: 'none' as const,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    pointerEvents: 'auto' as const,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

/** Mobile chip rail: spring `scrollLeft` when snapping to the active tab (cancelled on user drag). */
const CHIP_RAIL_SPRING = {
  type: 'spring' as const,
  stiffness: 440,
  damping: 28,
  mass: 0.62,
};

/**
 * Desktop: if intro + media row is taller than the space below the header inside the shell,
 * shrink that block with CSS `zoom` so the full cards stay visible on short viewports (e.g. ~1280×682).
 * The shell uses `min-h-screen` with `max-h-screen` so its box stays viewport-tall; otherwise height can
 * track the zoomed carousel and `shellRect.bottom` collapses (bad `available`). Fit uses
 * `available = shell.bottom − row.top − pad` and `natural = rowHeight / currentZoom` (ref-based, not
 * `getComputedStyle(zoom)`, which varies by engine).
 * Chips / site header stay 1:1; horizontal drag scroll is unchanged. Conservative floor avoids tiny UI.
 */
const DESKTOP_CAROUSEL_CONTENT_SCALE_MIN = 0.7;
/** Breathing room below the carousel row vs shell bottom (viewport clip). */
const DESKTOP_CAROUSEL_CONTENT_BOTTOM_PAD_PX = 24;

/** Maps public media URLs (as on `ProjectCard`) → preloaded video first frame / aspect ratios for video + images. */
function useMediaWarmupMaps() {
  const [warm, setWarm] = useState<{
    frames: Map<string, string>;
    ratios: Map<string, number>;
    imageRatios: Map<string, number>;
  }>(() => ({
    frames: new Map(),
    ratios: new Map(),
    imageRatios: new Map(),
  }));

  useEffect(() => {
    let cancelled = false;
    const ids = projects.map((p) => p.id);
    preloadProjectMedia(ids, projectMedia as ProjectMediaJson, projectLogos as ProjectLogosJson).then(
      ({ firstFrames, videoAspectRatios, imageAspectRatios }) => {
        if (cancelled) return;
        const frames = new Map<string, string>();
        const ratios = new Map<string, number>();
        const imageRatios = new Map<string, number>();
        const bust =
          typeof (projectMedia as ProjectMediaJson)._generatedAt === 'number'
            ? `?v=${(projectMedia as ProjectMediaJson)._generatedAt}`
            : '';
        for (const id of ids) {
          const entries = projectMedia[id as keyof typeof projectMedia];
          if (!Array.isArray(entries)) continue;
          for (const e of entries as {
            mediaType: string;
            url: string;
            mobileUrl?: string;
          }[]) {
            const preloadKey = e.url + bust;
            const publicUrl = publicAssetUrl(e.url);
            if (e.mediaType === 'video') {
              const frame = firstFrames.get(preloadKey);
              const r = videoAspectRatios.get(preloadKey);
              if (frame) frames.set(publicUrl, frame);
              if (r != null && r > 0) ratios.set(publicUrl, r);
            } else if (e.mediaType === 'image') {
              const r = imageAspectRatios.get(preloadKey);
              if (r != null && r > 0) imageRatios.set(publicUrl, r);
              if (e.mobileUrl) {
                const mk = e.mobileUrl + bust;
                const mobilePublic = publicAssetUrl(e.mobileUrl);
                const rm = imageAspectRatios.get(mk);
                if (rm != null && rm > 0) imageRatios.set(mobilePublic, rm);
              }
            }
          }
        }
        setWarm({ frames, ratios, imageRatios });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return warm;
}

export default function App() {
  const [activeProject, setActiveProject] = useState('meta');
  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  /** Mobile: after staggered shell reveal, enable per-project opacity enter/exit (avoids double-fade on load). */
  const [mobileProjectOpacitySwapEnabled, setMobileProjectOpacitySwapEnabled] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768
  );
  /** Mobile: fonts + layout settled; drives stagger from hidden → visible. */
  const [mobileShellRevealOpen, setMobileShellRevealOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768
  );
  const mobileShellRevealCompleteRef = useRef(false);
  const mediaWarm = useMediaWarmupMaps();
  const [isPressed, setIsPressed] = useState(false);
  const [rubberBandOffset, setRubberBandOffset] = useState(0);
  const rubberBandOffsetRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  /** Desktop carousel inner row (intro + cards) — observed to pin scroll end on Safari when gap widens. */
  const desktopCarouselRowRef = useRef<HTMLDivElement>(null);
  /** Desktop `min-h-screen max-h-screen` column — viewport budget for vertical fit of carousel content. */
  const desktopShellRef = useRef<HTMLDivElement>(null);
  /** Desktop: `zoom` wrapper around the carousel — `clientHeight` avoids WebKit `getBoundingClientRect` quirks on nested rows. */
  const desktopCarouselZoomRef = useRef<HTMLDivElement>(null);
  /** Desktop intro + chips (excluded from zoom; used only for resize observation). */
  const desktopHeaderBlockRef = useRef<HTMLDivElement>(null);
  /** Desktop-only: `zoom` on carousel strip so card stack fits without bottom clip (see constants above). */
  const [desktopCarouselContentScale, setDesktopCarouselContentScale] = useState(1);
  const desktopCarouselContentScaleRef = useRef(1);
  /** Single vertical-fit sample (reads refs fresh — avoids stale `row` after tab swaps). */
  const desktopCarouselRemeasureRef = useRef<(() => void) | null>(null);
  /** Several passes in rAF; WebKit often reports wrong rects until layout is flushed (horizontal scroll “fixed” it). */
  const desktopCarouselBurstRemeasureRef = useRef<(() => void) | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  
  const chipScrollRef = useRef<HTMLDivElement>(null);
  /** Latest `scrollChipToLeft` for async callbacks (e.g. `document.fonts.ready`). */
  const scrollChipToLeftRef = useRef<
    (projectId: string, opts?: { behavior?: 'spring' | 'instant' }) => void
  >(() => {});
  const chipRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const chipDragging = useRef(false);
  const chipStartX = useRef(0);
  const chipScrollLeft = useRef(0);
  const chipHasMoved = useRef(false);
  const chipTouchVelocity = useRef(0);
  const chipLastTouchX = useRef(0);
  const chipLastTouchTime = useRef(0);
  const chipInertiaRaf = useRef<number | null>(null);
  /** Stops programmatic chip `scrollLeft` spring when user grabs the rail or a new target is chosen. */
  const chipScrollSpringControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  /** After a horizontal chip drag, block default touchmove so Safari doesn't steal the gesture for vertical scroll. */
  const chipLockPageScroll = useRef(false);
  const mobileIntroRef = useRef<HTMLDivElement>(null);
  const mobileChipRailRef = useRef<HTMLDivElement>(null);
  const mobileStackRef = useRef<HTMLDivElement>(null);
  /** Mobile: main vertical scroll lives here (not `window`) so overscroll feels in-app, not whole-page. */
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  /** True when intro has scrolled off and chip bar is stuck under the top (mobile). */
  const [mobileChipsPinned, setMobileChipsPinned] = useState(false);
  /** Show subtle rule only once content is actually sliding under the pinned rail. */
  const [mobilePinnedRuleVisible, setMobilePinnedRuleVisible] = useState(false);
  /** Desktop rail — in-bounds inertia only; overscroll release uses `CAROUSEL_RUBBER_SPRING`. */
  const runtimeCarouselPhysics = {
    inertiaFriction: 0.97,
    stopThreshold: 0.08,
  } as const;

  // Inertial scrolling state
  const velocity = useRef(0);
  /** EMA during drag so a fast release still has usable velocity (pairs with CAROUSEL_INERTIA_START_FACTOR). */
  const velocityReleaseEma = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrame = useRef<number | null>(null);
  /** Motion `animate` driving rubber offset back to 0 after overscroll release. */
  const rubberSpringControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  
  // Mobile inertial scrolling state
  const mobileVelocity = useRef(0);
  const mobileLastX = useRef(0);
  const mobileLastTime = useRef(0);
  const mobileAnimationFrame = useRef<number | null>(null);
  const mobileCurrentOffset = useRef(0);
  const mobileDragging = useRef(false);
  const mobileStartX = useRef(0);
  const mobileScrollLeft = useRef(0);
  const currentOffset = useRef(0);
  
  // Detect mobile on mount + resize (initial state matches `md:hidden` / 768px breakpoint).
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Mobile: keep shell invisible until `document.fonts` + two frames (chip squircle / Inter metrics),
   * then stagger fade+blur. Desktop: gate stays open. Resize to mobile resets and re-runs prep.
   */
  useEffect(() => {
    if (!isMobile) {
      setMobileShellRevealOpen(true);
      setMobileProjectOpacitySwapEnabled(true);
      mobileShellRevealCompleteRef.current = true;
      return;
    }

    mobileShellRevealCompleteRef.current = false;
    setMobileShellRevealOpen(false);
    setMobileProjectOpacitySwapEnabled(false);

    let cancelled = false;
    const run = async () => {
      const ready = document.fonts?.ready;
      if (ready) {
        try {
          await ready;
        } catch {
          /* ignore */
        }
      }
      if (cancelled) return;
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      );
      if (cancelled) return;
      scrollChipToLeftRef.current(activeProjectRef.current, { behavior: 'instant' });
      if (cancelled) return;
      setMobileShellRevealOpen(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isMobile]);

  /**
   * After the shell stagger finishes, enable project enter/exit opacity (avoids stacking two fades on load).
   * Timing matches `MOBILE_SHELL_STAGGER_*` (delayChildren + 2×stagger + child duration + small buffer).
   */
  useEffect(() => {
    if (!isMobile || !mobileShellRevealOpen || mobileShellRevealCompleteRef.current) return;
    const totalMs = Math.ceil((0.02 + 2 * 0.05 + 0.42 + 0.08) * 1000);
    const id = window.setTimeout(() => {
      if (mobileShellRevealCompleteRef.current) return;
      mobileShellRevealCompleteRef.current = true;
      setMobileProjectOpacitySwapEnabled(true);
    }, totalMs);
    return () => clearTimeout(id);
  }, [isMobile, mobileShellRevealOpen]);

  /* Document scroll lock for mobile is global CSS (`index.css`, max-width 767px) so it applies
   * before paint and uses `100dvh`; avoids inline styles overriding `100dvh` on iOS. */

  useEffect(() => {
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    rubberBandOffsetRef.current = rubberBandOffset;
  }, [rubberBandOffset]);

  /** Right-edge rubber widens flex gap; re-pin scroll so the row stays end-anchored (Origami / Safari). */
  useLayoutEffect(() => {
    if (isMobile) return;
    const outer = scrollContainerRef.current;
    if (!outer || rubberBandOffset >= 0) return;
    const max = Math.max(0, outer.scrollWidth - outer.clientWidth);
    outer.scrollLeft = max;
  }, [rubberBandOffset, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const row = desktopCarouselRowRef.current;
    if (!row) return;
    const pin = () => {
      if (rubberBandOffsetRef.current >= 0) return;
      const outer = scrollContainerRef.current;
      if (!outer) return;
      const max = Math.max(0, outer.scrollWidth - outer.clientWidth);
      outer.scrollLeft = max;
    };
    const ro = new ResizeObserver(pin);
    ro.observe(row);
    return () => ro.disconnect();
  }, [isMobile, activeProject]);

  useEffect(() => {
    if (!isMobile) {
      setMobileChipsPinned(false);
      return;
    }
    const updatePinned = () => {
      const intro = mobileIntroRef.current;
      const sc = mobileScrollContainerRef.current;
      if (!intro || !sc) return;
      const c = sc.getBoundingClientRect();
      const introBottomContent =
        sc.scrollTop + intro.getBoundingClientRect().bottom - c.top;
      setMobileChipsPinned(sc.scrollTop >= introBottomContent - MOBILE_SITE_INTRO_PIN_PX);
    };
    updatePinned();
    mobileScrollContainerRef.current?.addEventListener('scroll', updatePinned, { passive: true });
    window.addEventListener('resize', updatePinned);
    return () => {
      mobileScrollContainerRef.current?.removeEventListener('scroll', updatePinned);
      window.removeEventListener('resize', updatePinned);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setMobilePinnedRuleVisible(false);
      return;
    }
    const updatePinnedRule = () => {
      const rail = mobileChipRailRef.current;
      const stack = mobileStackRef.current;
      if (!rail || !stack || !mobileChipsPinned) {
        setMobilePinnedRuleVisible(false);
        return;
      }
      const railBottom = rail.getBoundingClientRect().bottom;
      const stackTop = stack.getBoundingClientRect().top;
      setMobilePinnedRuleVisible(stackTop <= railBottom + 0.5);
    };
    updatePinnedRule();
    mobileScrollContainerRef.current?.addEventListener('scroll', updatePinnedRule, { passive: true });
    window.addEventListener('resize', updatePinnedRule);
    return () => {
      mobileScrollContainerRef.current?.removeEventListener('scroll', updatePinnedRule);
      window.removeEventListener('resize', updatePinnedRule);
    };
  }, [isMobile, mobileChipsPinned, activeProject]);

  const currentProject = projectsWithMedia.find((p) => p.id === activeProject) || projectsWithMedia[0];
  const desktopLyftRailScale =
    activeProject === 'lyft' ? LYFT_DESKTOP_RAIL_WIDTH_SCALE : undefined;

  /**
   * Desktop: vertically fit the horizontal carousel (intro + media) inside the visible shell without
   * clipping the bottom; chips stay unscaled. Uses `zoom` so layout width/height track the shrink.
   */
  useLayoutEffect(() => {
    if (isMobile) return;
    const shell = desktopShellRef.current;
    if (!shell) return;

    const measure = () => {
      const rowEl = desktopCarouselRowRef.current;
      const scrollEl = scrollContainerRef.current;
      const zoomWrap = desktopCarouselZoomRef.current;
      if (!rowEl || !scrollEl) return;

      void shell.offsetHeight;
      void scrollEl.offsetHeight;
      void rowEl.offsetHeight;
      if (zoomWrap) void zoomWrap.offsetHeight;

      const zCur = desktopCarouselContentScaleRef.current;
      const shellRect = shell.getBoundingClientRect();
      const rowRect = rowEl.getBoundingClientRect();
      const rowH = rowRect.height;
      if (rowH < 12) return;

      // Row is inside the zoom wrapper: rendered height ≈ layout × zoom. Undo with ref (Chrome-safe;
      // getComputedStyle(zoom) is inconsistent across engines).
      const natural = rowH / zCur;

      const available =
        shellRect.bottom - rowRect.top - DESKTOP_CAROUSEL_CONTENT_BOTTOM_PAD_PX;
      if (available < 64) return;

      let next = 1;
      if (natural > available + 0.5) {
        next = Math.max(
          DESKTOP_CAROUSEL_CONTENT_SCALE_MIN,
          Math.min(1, available / natural)
        );
      }
      if (Math.abs(next - zCur) > 0.004) {
        desktopCarouselContentScaleRef.current = next;
        setDesktopCarouselContentScale(next);
      }
    };

    const burstRemeasure = () => {
      measure();
      requestAnimationFrame(() => {
        measure();
        requestAnimationFrame(() => {
          measure();
          requestAnimationFrame(measure);
        });
      });
    };

    desktopCarouselRemeasureRef.current = measure;
    desktopCarouselBurstRemeasureRef.current = burstRemeasure;

    const rafMeasure = () => requestAnimationFrame(measure);
    const ro = new ResizeObserver(rafMeasure);
    ro.observe(shell);
    const rowNode = desktopCarouselRowRef.current;
    if (rowNode) ro.observe(rowNode);
    const zoomObs = desktopCarouselZoomRef.current;
    if (zoomObs) ro.observe(zoomObs);
    const scrollPort = scrollContainerRef.current;
    if (scrollPort) ro.observe(scrollPort);
    const header = desktopHeaderBlockRef.current;
    if (header) ro.observe(header);
    window.addEventListener('resize', rafMeasure);
    shell.addEventListener('scroll', rafMeasure, { passive: true });
    if (scrollPort) scrollPort.addEventListener('scroll', rafMeasure, { passive: true });
    burstRemeasure();
    return () => {
      desktopCarouselRemeasureRef.current = null;
      desktopCarouselBurstRemeasureRef.current = null;
      ro.disconnect();
      window.removeEventListener('resize', rafMeasure);
      shell.removeEventListener('scroll', rafMeasure);
      scrollPort?.removeEventListener('scroll', rafMeasure);
    };
  }, [isMobile, activeProject, currentProject.cards.length]);

  /** Warmup / WebKit: cards gain height after media metrics arrive — late remeasure without needing a scroll. */
  const mediaWarmResizeKey = mediaWarm.frames.size + mediaWarm.imageRatios.size + mediaWarm.ratios.size;
  useEffect(() => {
    if (isMobile) return;
    const a = window.setTimeout(() => desktopCarouselRemeasureRef.current?.(), 40);
    const b = window.setTimeout(() => desktopCarouselRemeasureRef.current?.(), 200);
    const c = window.setTimeout(() => desktopCarouselRemeasureRef.current?.(), 650);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [isMobile, activeProject, mediaWarmResizeKey]);

  /** `mousemove` / `mouseup` on `window` so drag isn’t cut short when the cursor leaves the rail (was killing velocity → snap). */
  const carouselWindowDragCleanup = useRef<(() => void) | null>(null);

  const applyCarouselDrag = (clientX: number) => {
    if (!isDragging.current || !scrollContainerRef.current) return;

    const currentTime = Date.now();
    const currentX = clientX;
    const deltaTime = currentTime - lastTime.current;
    const deltaX = currentX - lastX.current;

    if (deltaTime > 0) {
      const instant = (deltaX / deltaTime) * 16;
      velocity.current = instant;
      velocityReleaseEma.current = velocityReleaseEma.current * 0.42 + instant * 0.58;
    }

    lastX.current = currentX;
    lastTime.current = currentTime;

    const walk = clientX - startX.current;
    const targetScroll = scrollLeft.current - walk;

    const container = scrollContainerRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;

    if (targetScroll < 0) {
      const overscroll = Math.abs(targetScroll);
      const resistance = desktopRubberResistance(overscroll);
      rubberBandOffsetRef.current = resistance;
      setRubberBandOffset(resistance);
      container.scrollLeft = 0;
    } else if (targetScroll > maxScroll) {
      const overscroll = targetScroll - maxScroll;
      const resistance = desktopRubberResistance(overscroll);
      rubberBandOffsetRef.current = -resistance;
      setRubberBandOffset(-resistance);
      container.scrollLeft = maxScroll;
    } else {
      rubberBandOffsetRef.current = 0;
      setRubberBandOffset(0);
      container.scrollLeft = targetScroll;
    }
  };

  const endCarouselDrag = () => {
    carouselWindowDragCleanup.current?.();
    carouselWindowDragCleanup.current = null;
    if (!isDragging.current) return;
    if (!scrollContainerRef.current) return;
    isDragging.current = false;
    scrollContainerRef.current.style.userSelect = '';
    setIsPressed(false);
    startInertialScroll();
  };

  useEffect(() => {
    return () => {
      carouselWindowDragCleanup.current?.();
      carouselWindowDragCleanup.current = null;
      if (isDragging.current && scrollContainerRef.current) {
        isDragging.current = false;
        scrollContainerRef.current.style.userSelect = '';
      }
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    if (e.button !== 0) return;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    rubberSpringControlsRef.current?.stop();
    rubberSpringControlsRef.current = null;
    rubberBandOffsetRef.current = 0;
    setRubberBandOffset(0);
    isDragging.current = true;
    startX.current = e.clientX;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    lastX.current = e.clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
    velocityReleaseEma.current = 0;
    scrollContainerRef.current.style.userSelect = 'none';
    setIsPressed(true);

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      applyCarouselDrag(ev.clientX);
    };
    const onUp = () => {
      endCarouselDrag();
    };
    carouselWindowDragCleanup.current = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  };

  /** After overscroll, always spring `rubberBandOffset` → 0 with a visible curve (no sub-pixel instant snap). */
  const springRubberToZero = () => {
    rubberSpringControlsRef.current?.stop();
    rubberSpringControlsRef.current = null;

    const from = rubberBandOffsetRef.current;
    if (Math.abs(from) < 0.001) {
      rubberBandOffsetRef.current = 0;
      setRubberBandOffset(0);
      return;
    }

    const controls = animate(from, 0, {
      ...CAROUSEL_RUBBER_SPRING,
      onUpdate: (latest: number) => {
        rubberBandOffsetRef.current = latest;
        setRubberBandOffset(latest);
      },
    });
    rubberSpringControlsRef.current = controls;
    void controls.then(
      () => {
        rubberBandOffsetRef.current = 0;
        setRubberBandOffset(0);
        if (rubberSpringControlsRef.current === controls) {
          rubberSpringControlsRef.current = null;
        }
      },
      () => {
        if (rubberSpringControlsRef.current === controls) {
          rubberSpringControlsRef.current = null;
        }
      }
    );
  };

  const startInertialScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Releasing while stretched past the edge: spring home first (speed of release doesn’t skip this).
    if (Math.abs(rubberBandOffsetRef.current) > 0.001) {
      springRubberToZero();
      return;
    }

    const vEma = velocityReleaseEma.current;
    const vLast = velocity.current;
    const mag = Math.max(Math.abs(vEma), Math.abs(vLast));
    const sign =
      (Math.abs(vLast) >= Math.abs(vEma) ? Math.sign(vLast) : Math.sign(vEma)) || 0;
    let currentVelocity = mag * sign;

    const tick = () => {
      currentVelocity *= runtimeCarouselPhysics.inertiaFriction;
      const newScrollLeft = container.scrollLeft - currentVelocity;

      // Hard-clamp at edges and stop — do not run rubber-band + damped velocity frames here.
      // Safari’s subpixel scrollLeft / maxScroll makes that loop fight the compositor (visible jitter).
      if (newScrollLeft <= 0) {
        container.scrollLeft = 0;
        rubberBandOffsetRef.current = 0;
        setRubberBandOffset(0);
        animationFrame.current = null;
        return;
      }
      if (newScrollLeft >= maxScroll) {
        container.scrollLeft = maxScroll;
        rubberBandOffsetRef.current = 0;
        setRubberBandOffset(0);
        animationFrame.current = null;
        return;
      }

      container.scrollLeft = newScrollLeft;
      rubberBandOffsetRef.current = 0;
      setRubberBandOffset(0);
      if (Math.abs(currentVelocity) < runtimeCarouselPhysics.stopThreshold) {
        animationFrame.current = null;
        return;
      }
      animationFrame.current = requestAnimationFrame(tick);
    };

    if (
      Math.abs(currentVelocity) >
      runtimeCarouselPhysics.stopThreshold * CAROUSEL_INERTIA_START_FACTOR
    ) {
      animationFrame.current = requestAnimationFrame(tick);
    } else {
      springRubberToZero();
    }
  };

  /** Trackpad / wheel uses native scrollLeft; clear transform stretch so it doesn’t stack with drag overscroll. */
  const handleCarouselWheel = () => {
    if (isDragging.current) return;
    if (Math.abs(rubberBandOffsetRef.current) < 0.001) return;
    rubberSpringControlsRef.current?.stop();
    rubberSpringControlsRef.current = null;
    rubberBandOffsetRef.current = 0;
    setRubberBandOffset(0);
  };

  const handleChipWheel = (e: React.WheelEvent) => {
    if (!chipScrollRef.current) return;
    e.preventDefault();
    stopChipScrollSpring();
    chipScrollRef.current.scrollLeft += e.deltaY;
  };

  const stopChipInertia = () => {
    if (chipInertiaRaf.current != null) {
      cancelAnimationFrame(chipInertiaRaf.current);
      chipInertiaRaf.current = null;
    }
  };

  const stopChipScrollSpring = () => {
    chipScrollSpringControlsRef.current?.stop();
    chipScrollSpringControlsRef.current = null;
  };

  /** Subtle horizontal momentum after finger lift (mobile chip rail only). */
  const startChipInertialScroll = () => {
    const container = chipScrollRef.current;
    if (!container) return;
    stopChipInertia();
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    let v = chipTouchVelocity.current * 0.78;

    const animate = () => {
      if (Math.abs(v) < 0.035) {
        chipInertiaRaf.current = null;
        return;
      }
      const next = container.scrollLeft - v;
      if (next <= 0) {
        container.scrollLeft = 0;
        chipInertiaRaf.current = null;
        return;
      }
      if (next >= maxScroll) {
        container.scrollLeft = maxScroll;
        chipInertiaRaf.current = null;
        return;
      }
      container.scrollLeft = next;
      v *= 0.94;
      chipInertiaRaf.current = requestAnimationFrame(animate);
    };

    if (Math.abs(v) > 0.055) {
      chipInertiaRaf.current = requestAnimationFrame(animate);
    }
  };

  // Touch handlers for mobile swipe
  const handleChipTouchStart = (e: React.TouchEvent) => {
    if (!chipScrollRef.current) return;
    stopChipScrollSpring();
    stopChipInertia();
    chipLockPageScroll.current = false;
    chipDragging.current = true;
    chipHasMoved.current = false;
    chipTouchVelocity.current = 0;
    chipStartX.current = e.touches[0].pageX;
    chipScrollLeft.current = chipScrollRef.current.scrollLeft;
    chipLastTouchX.current = e.touches[0].pageX;
    chipLastTouchTime.current = Date.now();
  };

  const handleChipTouchMove = (e: React.TouchEvent) => {
    if (!chipDragging.current || !chipScrollRef.current) return;
    const x = e.touches[0].pageX;
    const now = Date.now();
    const dt = now - chipLastTouchTime.current;
    if (dt > 0 && dt < 100) {
      const instant = ((x - chipLastTouchX.current) / dt) * 24;
      const prev = chipTouchVelocity.current;
      chipTouchVelocity.current = prev * 0.25 + instant * 0.75;
    }
    chipLastTouchX.current = x;
    chipLastTouchTime.current = now;

    const walk = chipStartX.current - x;

    // Mark as moved if dragged more than 5px
    if (Math.abs(walk) > 5) {
      chipHasMoved.current = true;
    }
    if (Math.abs(walk) > 6) {
      chipLockPageScroll.current = true;
    }

    chipScrollRef.current.scrollLeft = chipScrollLeft.current + walk;
  };

  const handleChipTouchEnd = () => {
    chipLockPageScroll.current = false;
    chipDragging.current = false;
    startChipInertialScroll();
    // Reset after a short delay to allow click event to fire
    setTimeout(() => {
      chipHasMoved.current = false;
    }, 50);
  };

  // Mouse drag handlers for desktop
  const handleChipMouseDown = (e: React.MouseEvent) => {
    if (!chipScrollRef.current) return;
    stopChipScrollSpring();
    chipLockPageScroll.current = false;
    chipDragging.current = true;
    chipHasMoved.current = false;
    chipStartX.current = e.pageX;
    chipScrollLeft.current = chipScrollRef.current.scrollLeft;
    chipScrollRef.current.style.cursor = 'grabbing';
    chipScrollRef.current.style.userSelect = 'none';
  };

  const handleChipMouseMove = (e: React.MouseEvent) => {
    if (!chipDragging.current || !chipScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = chipStartX.current - x;
    
    // Mark as moved if dragged more than 5px
    if (Math.abs(walk) > 5) {
      chipHasMoved.current = true;
    }
    
    chipScrollRef.current.scrollLeft = chipScrollLeft.current + walk;
  };

  const handleChipMouseUp = () => {
    if (!chipScrollRef.current) return;
    chipDragging.current = false;
    chipScrollRef.current.style.cursor = 'grab';
    chipScrollRef.current.style.userSelect = 'auto';
    // Reset after a short delay to allow click event to fire
    setTimeout(() => {
      chipHasMoved.current = false;
    }, 50);
  };

  const handleChipMouseLeave = () => {
    if (!chipScrollRef.current || !chipDragging.current) return;
    chipDragging.current = false;
    chipScrollRef.current.style.cursor = 'grab';
    chipScrollRef.current.style.userSelect = 'auto';
    chipHasMoved.current = false;
  };

  // Auto-scroll selected chip to left
  const scrollChipToLeft = (
    projectId: string,
    opts?: { behavior?: 'spring' | 'instant' }
  ) => {
    const chipElement = chipRefs.current[projectId];
    const container = chipScrollRef.current;
    
    if (!chipElement || !container) return;

    // `offsetLeft` is relative to `offsetParent` (often the sticky rail), not the scrollport — it
    // double-counted horizontal inset and scrolled the first chip flush to the screen on mobile.
    const chipRect = chipElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const chipLeftInContent =
      chipRect.left - containerRect.left + container.scrollLeft;
    const containerPadding = isMobile ? 24 : 0;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    /** First chip must stay at scroll 0 so inner `px-[24px]` shows — avoids flush-to-screen on load. */
    const isLeadChip =
      isMobile &&
      projectsWithMedia.length > 0 &&
      projectsWithMedia[0].id === projectId;
    const targetLeft = isLeadChip
      ? 0
      : Math.min(
          Math.max(0, chipLeftInContent - containerPadding),
          maxScroll
        );

    if (isMobile) {
      stopChipScrollSpring();
      const from = container.scrollLeft;
      const behavior = opts?.behavior ?? 'spring';
      if (behavior === 'instant') {
        container.scrollLeft = targetLeft;
        return;
      }
      if (Math.abs(from - targetLeft) < 0.5) return;
      const controls = animate(from, targetLeft, {
        ...CHIP_RAIL_SPRING,
        onUpdate: (latest) => {
          const el = chipScrollRef.current;
          if (el) el.scrollLeft = latest;
        },
      });
      chipScrollSpringControlsRef.current = controls;
      return;
    }

    container.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });
  };
  scrollChipToLeftRef.current = scrollChipToLeft;

  // Handle chip click
  const handleChipClick = (projectId: string) => {
    // Only change project and snap if user didn't drag
    if (chipHasMoved.current) {
      return;
    }
    setActiveProject(projectId);
    // Chip scroll runs once in useEffect(activeProject) — avoids double smooth-scroll on mobile.
  };

  // Prevent click events during drag
  const handleChipClickCapture = (e: React.MouseEvent | React.TouchEvent) => {
    if (chipHasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    return () => {
      chipScrollSpringControlsRef.current?.stop();
      chipScrollSpringControlsRef.current = null;
      rubberSpringControlsRef.current?.stop();
      rubberSpringControlsRef.current = null;
    };
  }, []);

  /** iOS: once user is dragging chips horizontally, preventDefault on touchmove (must be non-passive). */
  useLayoutEffect(() => {
    if (!isMobile) return;
    const el = chipScrollRef.current;
    if (!el) return;

    const onTouchMoveNative = (e: TouchEvent) => {
      if (!chipDragging.current || !chipLockPageScroll.current) return;
      e.preventDefault();
    };

    el.addEventListener('touchmove', onTouchMoveNative, { passive: false, capture: true });
    return () => el.removeEventListener('touchmove', onTouchMoveNative, { capture: true });
  }, [isMobile]);

  // Keep the active chip in view whenever the project changes (mobile + desktop).
  useEffect(() => {
    scrollChipToLeft(activeProject);
  }, [activeProject, isMobile]);

  /** Desktop horizontal rail only — do not share with mobile (hidden desktop branch still runs exit → double fire). */
  const handleDesktopContentExitComplete = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    requestAnimationFrame(() => desktopCarouselBurstRemeasureRef.current?.());
  };

  /**
   * Mobile stack — after project swap (Figma `4202:13577` “scrolled chip change behavior”):
   * - Not past site intro yet → keep scroll Y.
   * - Pinned → scroll so the top of the card stack sits on the bottom of the sticky rail (~1px gap,
   *   like frame “default pos after tapping chip…”) so the intro card is not under the white panel
   *   and the hairline rule stays hidden until the user scrolls further. Still clamped to
   *   `pinMinY` so we never land in an unpinned state.
   */
  const handleMobileContentExitComplete = () => {
    if (!isMobile) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const intro = mobileIntroRef.current;
        const stack = mobileStackRef.current;
        const rail = mobileChipRailRef.current;
        if (!stack || !rail) return;

        const sc = mobileScrollContainerRef.current;
        if (!sc) return;

        if (!intro) {
          if (!mobileChipsPinned) return;
          sc.scrollTo({ top: 0, behavior: 'instant' });
          return;
        }

        const cRect = sc.getBoundingClientRect();
        const introBottomContent =
          sc.scrollTop + intro.getBoundingClientRect().bottom - cRect.top;
        const pinMinY = introBottomContent - MOBILE_SITE_INTRO_PIN_PX;
        const pinnedNow = sc.scrollTop >= pinMinY;
        if (!pinnedNow) return;

        const gapPx = 1;
        const stackRect = stack.getBoundingClientRect();
        const railRect = rail.getBoundingClientRect();
        const yAlignStackToRail = sc.scrollTop + stackRect.top - railRect.bottom - gapPx;
        const yTarget = Math.max(0, Math.max(pinMinY, yAlignStackToRail));
        const currentY = sc.scrollTop;
        // Remeasuring every tab gives 1–3px drift; scrollTo then fights itself when the user didn’t
        // move the page — skip so the chip rail / viewport stay stable across chip-only changes.
        const SNAP_EPSILON_PX = 8;
        if (Math.abs(currentY - yTarget) <= SNAP_EPSILON_PX) {
          return;
        }
        sc.scrollTo({ top: yTarget, behavior: 'instant' });
      });
    });
  };

  return (
    <div className="bg-white h-full min-h-0 md:min-h-screen md:h-auto">
      {/* Custom Cursor - Desktop only */}
      <div className="hidden md:block">
        <CustomCursor isPressed={isPressed} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div
          ref={desktopShellRef}
          className="px-[17.5px] lg:px-[24.5px] xl:px-[31.5px] pt-[14px] lg:pt-[20px] xl:pt-[33px] 2xl:pt-[46px] pb-[60px] lg:pb-[80px] min-h-screen max-h-screen overflow-y-auto"
        >
          {/* Header — tighter top inset + type for laptop (~md–xl); large desktop unchanged feel at 2xl. */}
          <div ref={desktopHeaderBlockRef} className="mb-[16px] lg:mb-[20px]">
            <div className="font-['Alliance_No.1',sans-serif] font-light leading-[normal] not-italic text-[20px] lg:text-[25px] xl:text-[30px] text-black tracking-[-1px] lg:tracking-[-1.21px] xl:tracking-[-1.46px] mb-[16px] lg:mb-[20px]">
              <IntroNameHeading variant="desktop" />
            </div>

            {/* Desktop chips: one row until the content edge, then natural wrap (mobile stays horizontal scroll). */}
            <div className="flex w-full min-w-0 flex-wrap gap-[4px] lg:gap-[4px] xl:gap-[5px]">
              {projectsWithMedia.map((project) => (
                <ProjectChip
                  key={project.id}
                  label={project.name}
                  isActive={activeProject === project.id}
                  onClick={() => setActiveProject(project.id)}
                />
              ))}
            </div>
          </div>

          {/* Horizontal Scrolling Projects — markup lives in `desktop-carousel-rail.tsx` so JSX can’t break the whole app. */}
          <DesktopCarouselRail
            scrollContainerRef={scrollContainerRef}
            desktopCarouselZoomRef={desktopCarouselZoomRef}
            desktopCarouselRowRef={desktopCarouselRowRef}
            onMouseDown={handleMouseDown}
            onWheel={handleCarouselWheel}
            desktopCarouselContentScale={desktopCarouselContentScale}
            onExitComplete={handleDesktopContentExitComplete}
            onEnterAnimationComplete={() => {
              requestAnimationFrame(() => desktopCarouselBurstRemeasureRef.current?.());
            }}
            activeProject={activeProject}
            rubberBandOffset={rubberBandOffset}
            currentProject={currentProject}
            desktopLyftRailScale={desktopLyftRailScale}
            mediaWarm={mediaWarm}
          />
        </div>
      </div>

      {/* Mobile Layout — `100dvh` shell + inner scroll: rubber-band on content, not the whole document. */}
      <div className="md:hidden flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top,0px)]">
        <div
          ref={mobileScrollContainerRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-behavior-y-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          <div className="touch-pan-y min-w-0 w-full max-w-full px-[24px] pb-[60px] pt-[32px]">
          <motion.div
            className="contents"
            variants={MOBILE_SHELL_STAGGER_PARENT}
            initial="hidden"
            animate={mobileShellRevealOpen ? 'visible' : 'hidden'}
          >
          {/* Intro scrolls away inside the main scroll region (no scroll-linked fade or scale). */}
          <motion.div
            ref={mobileIntroRef}
            variants={MOBILE_SHELL_STAGGER_CHILD}
            className="font-['Alliance_No.1',sans-serif] font-light leading-[1.08] not-italic text-[22px] text-black tracking-[-0.99px] mb-[24px]"
          >
            <IntroNameHeading variant="mobile" />
          </motion.div>

          {/* Chip rail: sticky to this scrollport (below safe-area inset on the shell). */}
          <motion.div
            ref={mobileChipRailRef}
            variants={MOBILE_SHELL_STAGGER_CHILD}
            className="sticky z-10 -mx-[24px] bg-white px-[24px]"
            style={{
              top: 0,
              // Fixed top padding avoids a 0↔8px jump when swapping chips while pinned (was tied to
              // `mobileChipsPinned`, which could disagree with scroll for a frame).
              paddingTop: 8,
            }}
          >
            <div
              ref={chipScrollRef}
              className="overflow-x-auto -mx-[24px] hide-scrollbar pb-[12px]"
              onMouseDown={handleChipMouseDown}
              onMouseMove={handleChipMouseMove}
              onMouseUp={handleChipMouseUp}
              onMouseLeave={handleChipMouseLeave}
              onWheel={handleChipWheel}
              onTouchStartCapture={handleChipTouchStart}
              onTouchMoveCapture={handleChipTouchMove}
              onTouchEndCapture={handleChipTouchEnd}
              onTouchCancelCapture={handleChipTouchEnd}
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain',
                // Keeps capsule ends off the scroll clip rect so squircles aren’t sheared flat on screen edges.
                scrollPaddingInline: '10px',
              }}
            >
              <div className="flex w-max gap-[6px] px-[24px]">
                {projectsWithMedia.map((project) => (
                  <ProjectChip
                    key={project.id}
                    label={project.name}
                    isActive={activeProject === project.id}
                    onClick={() => handleChipClick(project.id)}
                    ref={(el) => chipRefs.current[project.id] = el}
                    onClickCapture={handleChipClickCapture}
                  />
                ))}
              </div>
            </div>
            {/* 1px rule without `border: solid transparent` — iOS WebKit often paints that as a grey hairline. */}
            {/* Space above rule lives in chip scroll pb-[12px]; rule sits at bottom of white panel (not flush under pills). */}
            <div
              aria-hidden
              className="pointer-events-none -mx-[24px] h-px w-auto shrink-0"
              style={{
                backgroundColor: mobilePinnedRuleVisible ? 'rgb(0 0 0 / 0.03)' : '#ffffff',
              }}
            />
          </motion.div>

          {/* Vertical Stack of Cards */}
          <motion.div variants={MOBILE_SHELL_STAGGER_CHILD}>
            <AnimatePresence mode="wait" onExitComplete={handleMobileContentExitComplete}>
              <motion.div
                ref={mobileStackRef}
                key={activeProject}
                initial={
                  !isMobile || mobileProjectOpacitySwapEnabled ? { opacity: 0 } : false
                }
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: isMobile ? 0.16 : 0.25, ease: 'easeInOut' }}
                className="mb-[6px] mt-[6px] flex flex-col gap-[24px]"
              >
                <IntroCard
                  {...currentProject.introCard}
                  railWidthScale={desktopLyftRailScale}
                />
                {currentProject.id === 'sutter-hill' ? (
                  <SutterHillLogoGrid />
                ) : (
                  currentProject.cards.map((card, index) => (
                    <ProjectCard
                      key={index}
                      {...card}
                      desktopRailWidthScale={desktopLyftRailScale ?? 1}
                      {...warmMediaCardProps(card.imageUrl, card.imageUrlMobile, card.videoUrl, mediaWarm)}
                    />
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
          </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}