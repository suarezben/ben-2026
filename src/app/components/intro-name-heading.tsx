import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SWAP_BLUR_PX, SWAP_S } from '../lib/reveal-tunables';
import {
  DEFAULT_SIGNATURE_MOTION,
  type SignatureMotionSettings,
} from '../lib/signature-motion-settings';

/**
 * “My name is” + signature image — layout/sizing from Figma `4206:13665`
 * (desktop frame 299×59, mobile 122×24; scales with text breakpoints).
 */
const NAME_SIGNATURE_SRC = '/images/bensuarez-name.png';
const EMAIL_HREF = 'mailto:Benjamin.r.suarez@gmail.com';
// Avoid the transformed → untransformed raster handoff that can flash a
// transparent PNG for one frame when a spring lands at an identity transform.
const SIGNATURE_LAYER_OFFSET = 1;

type IntroNameHeadingProps = {
  variant: 'desktop' | 'mobile';
  view?: 'work' | 'writing';
  /** The signature returns to Work (and resets to the first project when already there). */
  onSignatureClick?: () => void;
  onWritingClick?: () => void;
  onWorkClick?: () => void;
  motionSettings?: SignatureMotionSettings;
};

const HEADER_SWAP_BLUR = `blur(${SWAP_BLUR_PX}px)`;

const BLUR_SWAP_TRANSITION = {
  duration: SWAP_S,
  ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
};

const SIGNATURE_TRAVEL_DURATION_MS = 420;
const SIGNATURE_RETURN_DURATION_MS = 380;
const SIGNATURE_TRAVEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SIGNATURE_ANTICIPATION_EASE = 'cubic-bezier(0.45, 0, 0.55, 1)';
// The nav travels with the changing header geometry. A balanced curve spreads
// that distance across frames; the signature's punchier ease read as a jump on
// this smaller, text-only target in slow motion.
const NAV_TRAVEL_DURATION_MS = 420;
const NAV_TRAVEL_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

type SignaturePhase =
  | 'work'
  | 'waiting-in'
  | 'anticipating-in'
  | 'writing'
  | 'anticipating-out';

export function IntroNameHeading({
  variant,
  view = 'work',
  onSignatureClick,
  onWritingClick,
  onWorkClick,
  motionSettings = DEFAULT_SIGNATURE_MOTION,
}: IntroNameHeadingProps) {
  const isMobile = variant === 'mobile';
  const isWriting = view === 'writing';
  const shouldReduceMotion = useReducedMotion();
  const locationLabel = isMobile ? 'SF' : 'San Francisco';
  const [signaturePhase, setSignaturePhase] = useState<SignaturePhase>(() =>
    isWriting ? 'writing' : 'work'
  );
  const [showIntroText, setShowIntroText] = useState(() => !isWriting);
  const signaturePhaseInitializedRef = useRef(false);
  const introTextRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navAnimationRef = useRef<Animation | null>(null);
  const navVisualOriginRef = useRef<{ left: number; top: number } | null>(null);
  const lastNavLayoutRef = useRef<{ left: number; top: number } | null>(null);
  const [introTextOffset, setIntroTextOffset] = useState(0);

  const captureNavVisualPosition = () => {
    const nav = navRef.current;
    if (!nav) return;
    const rect = nav.getBoundingClientRect();
    navVisualOriginRef.current = { left: rect.left, top: rect.top };
  };

  useLayoutEffect(() => {
    const introText = introTextRef.current;
    if (!introText) return;

    const measureIntroText = () => {
      const marginRight = Number.parseFloat(
        window.getComputedStyle(introText).marginRight
      ) || 0;
      setIntroTextOffset(introText.getBoundingClientRect().width + marginRight);
    };

    measureIntroText();
    const resizeObserver = new ResizeObserver(measureIntroText);
    resizeObserver.observe(introText);
    document.fonts?.ready.then(measureIntroText).catch(() => {});

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!signaturePhaseInitializedRef.current) {
      signaturePhaseInitializedRef.current = true;
      setSignaturePhase(isWriting ? 'writing' : 'work');
      setShowIntroText(!isWriting);
      return;
    }

    const timers: number[] = [];
    const animationFrames: number[] = [];
    if (isWriting) {
      setShowIntroText(false);
      setSignaturePhase('waiting-in');
      const delayMs = Math.max(0, motionSettings.inDelayMs);
      const anticipationMs = Math.max(0, motionSettings.anticipationMs);
      timers.push(
        window.setTimeout(() => {
          setSignaturePhase('anticipating-in');
          animationFrames.push(
            window.requestAnimationFrame(() => {
              timers.push(
                window.setTimeout(
                  () => setSignaturePhase('writing'),
                  anticipationMs
                )
              );
            })
          );
        }, delayMs)
      );
    } else {
      // The signature starts immediately. Only the returning intro copy waits.
      setSignaturePhase('anticipating-out');
      setShowIntroText(false);
      const textDelayMs = motionSettings.outDelayEnabled
        ? Math.max(0, motionSettings.outDelayMs)
        : 0;
      const anticipationMs = Math.max(0, motionSettings.outAnticipationMs);
      timers.push(
        window.setTimeout(() => setShowIntroText(true), textDelayMs)
      );
      animationFrames.push(
        window.requestAnimationFrame(() => {
          timers.push(
            window.setTimeout(() => setSignaturePhase('work'), anticipationMs)
          );
        })
      );
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      animationFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
    // Settings are intentionally sampled when the view changes; use Replay after tuning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWriting]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const origin = navVisualOriginRef.current ?? lastNavLayoutRef.current;
    navAnimationRef.current?.cancel();

    const finalRect = nav.getBoundingClientRect();
    const finalPosition = { left: finalRect.left, top: finalRect.top };
    lastNavLayoutRef.current = finalPosition;
    navVisualOriginRef.current = null;

    if (!origin || shouldReduceMotion) return;

    const deltaX = origin.left - finalPosition.left;
    const deltaY = origin.top - finalPosition.top;
    if (Math.abs(deltaX) < 0.25 && Math.abs(deltaY) < 0.25) return;

    navAnimationRef.current = nav.animate(
      [
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ],
      {
        duration: NAV_TRAVEL_DURATION_MS,
        easing: NAV_TRAVEL_EASE,
      }
    );
  }, [isWriting, shouldReduceMotion]);

  useEffect(() => () => navAnimationRef.current?.cancel(), []);

  const signatureKeepsWritingLayout =
    signaturePhase === 'writing' ||
    signaturePhase === 'anticipating-out';
  // Center the mobile signature between the Work and Contact text rows.
  // Keep the stable header geometry and existing transform animation unchanged.
  const writingY = isMobile
    ? signatureKeepsWritingLayout
      ? 0
      : motionSettings.mobileY + 7
    : signatureKeepsWritingLayout
      ? 0
      : motionSettings.desktopY;
  const writingScale = isMobile
    ? motionSettings.mobileScale
    : motionSettings.desktopScale;
  // Keep the intro copy's layout footprint stable and move the signature entirely
  // with transforms. Collapsing the copy while translating the signature made the
  // two animations fight each other and read as a jump in WebKit.
  const writingX = SIGNATURE_LAYER_OFFSET - introTextOffset;
  const signatureMotionTarget =
    signaturePhase === 'anticipating-in'
      ? { x: motionSettings.anticipationPx + SIGNATURE_LAYER_OFFSET, y: 0, scale: 1 }
      : signaturePhase === 'anticipating-out'
        ? {
            x: writingX - motionSettings.outAnticipationPx,
            y: writingY,
            scale: writingScale,
          }
        : signatureKeepsWritingLayout
          ? { x: writingX, y: writingY, scale: writingScale }
          : { x: SIGNATURE_LAYER_OFFSET, y: 0, scale: 1 };
  const signatureTransition = shouldReduceMotion
    ? 'none'
    : signaturePhase === 'waiting-in'
      ? 'none'
      : signaturePhase === 'anticipating-in'
        ? `transform ${Math.max(1, motionSettings.anticipationMs)}ms ${SIGNATURE_ANTICIPATION_EASE}`
        : signaturePhase === 'anticipating-out'
          ? `transform ${Math.max(1, motionSettings.outAnticipationMs)}ms ${SIGNATURE_ANTICIPATION_EASE}`
          : `transform ${
              signaturePhase === 'writing'
                ? SIGNATURE_TRAVEL_DURATION_MS
                : SIGNATURE_RETURN_DURATION_MS
            }ms ${SIGNATURE_TRAVEL_EASE}`;

  const signatureClass = isMobile
    ? 'block h-6 w-[122px] shrink-0 bg-site-ink'
    : 'block h-[28px] w-[142px] shrink-0 bg-site-ink lg:h-[35px] lg:w-[177px] xl:h-[43px] xl:w-[213px]';

  return (
    <div
      className={
        isMobile
          ? isWriting
            ? 'relative flex h-[84px] items-center justify-between gap-0'
            : 'relative flex h-[64px] items-start justify-between gap-0 max-[373px]:h-[77px]'
          : isWriting
            ? 'flex h-[28px] items-center justify-between gap-4 lg:h-[35px] xl:h-[43px]'
            : 'flex items-center justify-between gap-4'
      }
    >
      <motion.div
        className={
          isMobile
            ? isWriting
              ? 'h-6 min-w-0 flex-1'
              : 'h-[64px] min-w-0 flex-1 pr-[92px] max-[373px]:h-[77px]'
            : isWriting
              ? 'h-[28px] min-w-0 flex-1 lg:h-[35px] xl:h-[43px]'
              : 'h-[52px] min-w-0 flex-1 lg:h-[64px] xl:h-[79px]'
        }
      >
        <p
          className={
            isMobile
              ? 'm-0 flex flex-nowrap items-end leading-[normal]'
              : 'mb-0 flex flex-wrap items-end gap-y-1 leading-[normal]'
          }
        >
          <motion.span
            ref={introTextRef}
            data-work-hold={isMobile ? undefined : ''}
            initial={false}
            aria-hidden={!showIntroText}
            animate={{
              opacity: showIntroText ? 1 : 0,
              filter: showIntroText ? 'blur(0px)' : HEADER_SWAP_BLUR,
            }}
            transition={{
              opacity: BLUR_SWAP_TRANSITION,
              filter: BLUR_SWAP_TRANSITION,
            }}
            className="mr-[0.25em] inline-block shrink-0 whitespace-nowrap"
          >
            My name is
          </motion.span>

          <button
            type="button"
            onClick={() => {
              if (isWriting) captureNavVisualPosition();
              onSignatureClick?.();
            }}
            aria-label={isWriting ? 'Back to work' : 'Open first project: Meta Reality Labs'}
            style={{
              transform: `translate3d(${signatureMotionTarget.x}px, ${signatureMotionTarget.y}px, 0) scale(${signatureMotionTarget.scale})`,
              transformOrigin: 'left center',
              transition: signatureTransition,
              willChange: shouldReduceMotion ? undefined : 'transform',
            }}
            className="-ml-px shrink-0 border-0 bg-transparent p-0 text-left focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className={signatureClass}
              style={{
                WebkitMaskImage: `url(${NAME_SIGNATURE_SRC})`,
                maskImage: `url(${NAME_SIGNATURE_SRC})`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'left center',
                maskPosition: 'left center',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
              }}
            />
          </button>
        </p>

        <AnimatePresence initial={false} mode="sync">
          {showIntroText && (
            <motion.p
              key="intro-location"
              data-work-hold={isMobile ? undefined : ''}
              initial={{ opacity: 0, filter: HEADER_SWAP_BLUR }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: HEADER_SWAP_BLUR }}
              transition={BLUR_SWAP_TRANSITION}
              className={
                isMobile
                  ? 'm-0 mt-[0.225em] leading-[normal]'
                  : 'mb-0 mt-0 leading-[normal]'
              }
            >
              I'm a designer living in {locationLabel}.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <nav
        ref={navRef}
        aria-label="Primary"
        className={
          isMobile
            ? isWriting
              ? 'relative top-[-0.25em] flex w-[92px] shrink-0 flex-col items-end justify-center gap-1 text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70'
              : 'absolute right-0 top-[-20px] flex w-[92px] shrink-0 flex-col items-end justify-center gap-3 text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70'
            : `${isWriting ? 'relative top-[-0.25em]' : ''} ml-6 flex shrink-0 items-center gap-[1.35em] text-[16px] text-site-ink/70 lg:text-[20px] xl:text-[24px]`
        }
      >
        <motion.button
          type="button"
          onClick={() => {
            captureNavVisualPosition();
            if (isWriting) onWorkClick?.();
            else onWritingClick?.();
          }}
          aria-label={isWriting ? 'Back to work' : 'Open writing'}
          whileTap={{ scale: 0.97 }}
          className={
            isMobile
              ? isWriting
                ? 'relative grid min-h-10 w-full items-end justify-items-end border-0 bg-transparent px-1.5 py-0 text-right text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
                : 'relative grid min-h-11 w-full items-end justify-items-end border-0 bg-transparent px-1.5 py-0 text-right text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
              : 'relative grid w-[3.25em] border-0 bg-transparent p-0 text-left font-light leading-[normal] text-inherit text-[16px] transition-colors duration-200 hover:text-site-ink focus-visible:rounded-sm focus-visible:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2 lg:text-[20px] xl:text-[24px]'
          }
        >
          <span
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1"
            style={{
              opacity: isWriting ? 1 : 0,
              transition: shouldReduceMotion
                ? 'none'
                : 'opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)',
              willChange: shouldReduceMotion ? undefined : 'opacity',
            }}
          >
            Work
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1"
            style={{
              opacity: isWriting ? 0 : 1,
              transition: shouldReduceMotion
                ? 'none'
                : 'opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)',
              willChange: shouldReduceMotion ? undefined : 'opacity',
            }}
          >
            Writing
          </span>
        </motion.button>

        <a
          href={EMAIL_HREF}
          aria-label="Email Benjamin.r.suarez@gmail.com"
          className={
            isMobile
              ? isWriting
                ? 'inline-flex min-h-10 w-full shrink-0 items-start justify-end px-1.5 text-right font-light text-inherit focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
                : 'inline-flex min-h-11 w-full shrink-0 items-start justify-end px-1.5 text-right font-light text-inherit focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
              : 'inline-flex shrink-0 items-center self-center text-inherit transition-colors duration-200 hover:text-site-ink focus-visible:rounded-sm focus-visible:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
          }
        >
          {isMobile ? 'Contact' : 'Email'}
        </a>
      </nav>
    </div>
  );
}
