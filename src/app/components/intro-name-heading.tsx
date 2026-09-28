import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

const BLUR_SWAP_TRANSITION = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
};

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
  const locationLabel = isMobile ? 'SF' : 'San Francisco';
  const [signaturePhase, setSignaturePhase] = useState<SignaturePhase>(() =>
    isWriting ? 'writing' : 'work'
  );
  const [showIntroText, setShowIntroText] = useState(() => !isWriting);
  const signaturePhaseInitializedRef = useRef(false);

  useEffect(() => {
    if (!signaturePhaseInitializedRef.current) {
      signaturePhaseInitializedRef.current = true;
      setSignaturePhase(isWriting ? 'writing' : 'work');
      setShowIntroText(!isWriting);
      return;
    }

    const timers: number[] = [];
    if (isWriting) {
      setShowIntroText(false);
      setSignaturePhase('waiting-in');
      const delayMs = Math.max(0, motionSettings.inDelayMs);
      const anticipationMs = Math.max(0, motionSettings.anticipationMs);
      timers.push(
        window.setTimeout(() => setSignaturePhase('anticipating-in'), delayMs),
        window.setTimeout(
          () => setSignaturePhase('writing'),
          delayMs + anticipationMs
        )
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
        window.setTimeout(() => setShowIntroText(true), textDelayMs),
        window.setTimeout(() => setSignaturePhase('work'), anticipationMs)
      );
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // Settings are intentionally sampled when the view changes; use Replay after tuning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWriting]);

  const inSpring = {
    type: 'spring' as const,
    stiffness: motionSettings.inStiffness,
    damping: motionSettings.inDamping,
    mass: motionSettings.inMass,
  };
  const outSpring = {
    type: 'spring' as const,
    stiffness: motionSettings.outStiffness,
    damping: motionSettings.outDamping,
    mass: motionSettings.outMass,
  };
  const signatureSpring = isWriting ? inSpring : outSpring;
  const signatureKeepsWritingLayout =
    signaturePhase === 'writing' ||
    signaturePhase === 'anticipating-out';
  // Visibility and layout are intentionally separate. On the way into Writing,
  // the copy disappears immediately but keeps its width through the wind-up so
  // the signature can anticipate to the right before its leftward spring begins.
  const introTextOccupiesLayout = isWriting
    ? signaturePhase !== 'writing'
    : showIntroText;
  const writingY = isMobile ? motionSettings.mobileY - 16 : motionSettings.desktopY;
  const writingScale = isMobile
    ? motionSettings.mobileScale
    : motionSettings.desktopScale;
  const signatureMotionTarget =
    signaturePhase === 'anticipating-in'
      ? { x: motionSettings.anticipationPx + SIGNATURE_LAYER_OFFSET, y: 0, scale: 1 }
      : signaturePhase === 'anticipating-out'
        ? {
            x: -motionSettings.outAnticipationPx + SIGNATURE_LAYER_OFFSET,
            y: writingY,
            scale: writingScale,
          }
        : signatureKeepsWritingLayout
          ? { x: SIGNATURE_LAYER_OFFSET, y: writingY, scale: writingScale }
          : { x: SIGNATURE_LAYER_OFFSET, y: 0, scale: 1 };

  const signatureClass = isMobile
    ? 'block h-6 w-[122px] shrink-0 bg-site-ink'
    : 'block h-[28px] w-[142px] shrink-0 bg-site-ink lg:h-[35px] lg:w-[177px] xl:h-[43px] xl:w-[213px]';

  return (
    <div
      className={
        isMobile
          ? isWriting
            ? 'relative flex h-[72px] items-center justify-between gap-0'
            : 'flex items-center justify-between gap-0'
          : 'flex items-center justify-between gap-4'
      }
    >
      <motion.div
        className={
          isMobile
            ? isWriting
              ? 'flex h-full min-w-0 flex-1 items-center'
              : 'h-[104px] min-w-0 flex-1'
            : 'h-[52px] min-w-0 flex-1 lg:h-[64px] xl:h-[79px]'
        }
      >
        <p
          className={
            isMobile
              ? 'm-0 flex flex-wrap items-end gap-y-1 leading-[normal]'
              : 'mb-0 flex flex-wrap items-end gap-y-1 leading-[normal]'
          }
        >
          <motion.span
            initial={false}
            aria-hidden={!showIntroText}
            animate={{
              maxWidth: introTextOccupiesLayout ? '6em' : '0em',
              marginRight: introTextOccupiesLayout ? '0.25em' : '0em',
              opacity: showIntroText ? 1 : 0,
              filter: showIntroText ? 'blur(0px)' : 'blur(7px)',
            }}
            transition={{
              maxWidth: signatureSpring,
              marginRight: signatureSpring,
              opacity: BLUR_SWAP_TRANSITION,
              filter: BLUR_SWAP_TRANSITION,
            }}
            className="inline-block shrink-0 overflow-hidden whitespace-nowrap"
          >
            My name is
          </motion.span>

          <motion.button
            type="button"
            onClick={onSignatureClick}
            aria-label={isWriting ? 'Back to work' : 'Open first project: Meta Reality Labs'}
            initial={false}
            animate={signatureMotionTarget}
            transition={{
              x: signatureSpring,
              y: signatureSpring,
              scale: signatureSpring,
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
          </motion.button>
        </p>

        <AnimatePresence initial={false} mode="sync">
          {showIntroText && (
            <motion.p
              key="intro-location"
              initial={{ opacity: 0, filter: 'blur(7px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(7px)' }}
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
        aria-label="Primary"
        className={
          isMobile
            ? isWriting
              ? 'absolute right-0 top-[-22px] flex w-[92px] shrink-0 flex-col items-end justify-center gap-3 text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70'
              : 'flex w-[92px] -translate-y-[22px] shrink-0 flex-col items-end justify-center gap-3 text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70'
            : 'ml-6 flex shrink-0 items-center gap-[1.35em] text-[16px] text-site-ink/70 lg:text-[20px] xl:text-[24px]'
        }
      >
        <motion.button
          type="button"
          onClick={isWriting ? onWorkClick : onWritingClick}
          aria-label={isWriting ? 'Back to work' : 'Open writing'}
          whileTap={{ scale: 0.97 }}
          className={
            isMobile
              ? 'relative grid min-h-11 w-full items-end justify-items-end border-0 bg-transparent px-1.5 py-0 text-right text-[22px] font-light leading-[1.08] tracking-[-0.99px] text-site-ink/70 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
              : 'relative grid w-[3.25em] border-0 bg-transparent p-0 text-left font-light leading-[normal] text-inherit text-[16px] transition-colors duration-200 hover:text-site-ink focus-visible:rounded-sm focus-visible:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2 lg:text-[20px] xl:text-[24px]'
          }
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={isWriting ? 'work' : 'writing'}
              initial={{ opacity: 0, filter: 'blur(5px)', transform: 'scale(0.85)' }}
              animate={{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }}
              exit={{ opacity: 0, filter: 'blur(5px)', transform: 'scale(0.85)' }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: isMobile ? 'right center' : 'left center' }}
              className="col-start-1 row-start-1"
            >
              {isWriting ? 'Work' : 'Writing'}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <a
          href={EMAIL_HREF}
          aria-label="Email Benjamin.r.suarez@gmail.com"
          className={
            isMobile
              ? 'inline-flex min-h-11 w-full shrink-0 items-start justify-end px-1.5 text-right font-light text-inherit focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
              : 'inline-flex shrink-0 items-center self-center text-inherit transition-colors duration-200 hover:text-site-ink focus-visible:rounded-sm focus-visible:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-ink/35 focus-visible:ring-offset-2'
          }
        >
          {isMobile ? 'Contact' : 'Email'}
        </a>
      </nav>
    </div>
  );
}
