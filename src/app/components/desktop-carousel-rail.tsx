import { type RefObject, type ComponentProps, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IntroCard } from './intro-card';
import { ProjectCard } from './project-card';
import { SutterHillLogoGrid } from './sutter-hill-logo-grid';
import { carouselFlexGapPx, carouselRowJustifyContent } from '../lib/carousel-flex-gap';
import { warmMediaCardProps, type MediaWarmMaps } from '../lib/warm-media-card-props';

type Intro = ComponentProps<typeof IntroCard>;
type Card = ComponentProps<typeof ProjectCard>;

export type DesktopCarouselProject = {
  id: string;
  introCard: Intro;
  cards: Card[];
};

export function DesktopCarouselRail({
  scrollContainerRef,
  desktopCarouselZoomRef,
  desktopCarouselRowRef,
  onMouseDown,
  onWheel,
  desktopCarouselContentScale,
  onExitComplete,
  onEnterAnimationComplete,
  activeProject,
  rubberBandOffset,
  currentProject,
  desktopLyftRailScale,
  mediaWarm,
}: {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  desktopCarouselZoomRef: RefObject<HTMLDivElement | null>;
  desktopCarouselRowRef: RefObject<HTMLDivElement | null>;
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  onWheel: () => void;
  desktopCarouselContentScale: number;
  onExitComplete: () => void;
  /** After opacity enter settles — remeasure vertical `zoom` (Safari layout lags behind AnimatePresence). */
  onEnterAnimationComplete?: () => void;
  activeProject: string;
  rubberBandOffset: number;
  currentProject: DesktopCarouselProject;
  desktopLyftRailScale: number | undefined;
  mediaWarm: MediaWarmMaps;
}) {
  return (
    <div
      ref={scrollContainerRef}
      className="overscroll-x-contain overflow-x-auto hide-scrollbar pb-4 -mx-[17.5px] lg:-mx-[24.5px] xl:-mx-[31.5px] pl-[17.5px] lg:pl-[24.5px] xl:pl-[31.5px] pr-0"
      onMouseDown={onMouseDown}
      onWheel={onWheel}
    >
      <div
        ref={desktopCarouselZoomRef}
        className="inline-block min-w-min origin-top-left"
        style={{ zoom: desktopCarouselContentScale }}
      >
        <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
          <motion.div
            key={activeProject}
            initial={{ opacity: 0 }}
            style={{
              x: rubberBandOffset,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { type: 'spring', stiffness: 320, damping: 30, mass: 0.4 },
            }}
            onAnimationComplete={() => onEnterAnimationComplete?.()}
            className="flex w-max"
          >
            {/*
              Origami-style row: `justify-content` start vs end mirrors left- vs right-anchored
              auto-layout; rubber widens `gap` in the drag direction. ResizeObserver + layout pin
              keeps Safari at scroll end when width grows from the right.
            */}
            <div
              ref={desktopCarouselRowRef}
              className="flex w-max"
              style={{
                gap: `${carouselFlexGapPx(rubberBandOffset)}px`,
                justifyContent: carouselRowJustifyContent(rubberBandOffset),
              }}
            >
              <div className="shrink-0">
                <IntroCard
                  {...currentProject.introCard}
                  railWidthScale={desktopLyftRailScale}
                />
              </div>
              {currentProject.id === 'sutter-hill' ? (
                <div className="shrink-0">
                  <SutterHillLogoGrid />
                </div>
              ) : (
                currentProject.cards.map((card, index) => (
                  <div key={index} className="shrink-0">
                    <ProjectCard
                      {...card}
                      desktopRailWidthScale={desktopLyftRailScale ?? 1}
                      {...warmMediaCardProps(
                        card.imageUrl,
                        card.imageUrlMobile,
                        card.videoUrl,
                        mediaWarm
                      )}
                    />
                  </div>
                ))
              )}
            </div>
            <div
              aria-hidden
              className="shrink-0 w-[17.5px] lg:w-[24.5px] xl:w-[31.5px]"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
