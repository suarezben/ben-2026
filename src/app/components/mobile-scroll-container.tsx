import { useRef, useState, TouchEvent, ReactNode } from 'react';

interface MobileScrollContainerProps {
  children: ReactNode;
  gap: number;
  className?: string;
  onRubberBandOffsetChange: (offset: number) => void;
}

export const MobileScrollContainer = ({
  children,
  gap,
  className = '',
  onRubberBandOffsetChange,
}: MobileScrollContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const currentOffset = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (!containerRef.current) return;

    // Cancel any ongoing animation
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    isDragging.current = true;
    startX.current = e.touches[0].pageX;
    scrollLeft.current = containerRef.current.scrollLeft;
    lastX.current = e.touches[0].pageX;
    lastTime.current = Date.now();
    velocity.current = 0;
    currentOffset.current = 0;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const currentTime = Date.now();
    const currentX = e.touches[0].pageX;
    const deltaTime = currentTime - lastTime.current;
    const deltaX = currentX - lastX.current;

    // Calculate velocity for inertia
    if (deltaTime > 0) {
      velocity.current = deltaX / deltaTime * 16; // Normalize to 60fps
    }

    lastX.current = currentX;
    lastTime.current = currentTime;

    const walk = startX.current - currentX;
    const targetScroll = scrollLeft.current + walk;

    const container = containerRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    // Check if trying to scroll beyond boundaries (apply rubberbanding)
    if (targetScroll < 0) {
      // Dragging right when already at start
      const overscroll = Math.abs(targetScroll);
      const resistance = Math.pow(overscroll, 0.6) * 0.6;
      onRubberBandOffsetChange(resistance);
      currentOffset.current = resistance;
      container.scrollLeft = 0;
    } else if (targetScroll > maxScroll) {
      // Dragging left when already at end
      const overscroll = targetScroll - maxScroll;
      const resistance = Math.pow(overscroll, 0.6) * 0.6;
      onRubberBandOffsetChange(-resistance);
      currentOffset.current = -resistance;
      container.scrollLeft = maxScroll;
    } else {
      // Normal 1:1 scrolling within bounds
      onRubberBandOffsetChange(0);
      currentOffset.current = 0;
      container.scrollLeft = targetScroll;
    }
  };

  const handleTouchEnd = () => {
    if (!containerRef.current) return;
    isDragging.current = false;

    // Start inertial scrolling
    startInertialScroll();
  };

  const startInertialScroll = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    let currentVelocity = velocity.current;
    let offset = currentOffset.current;

    const animate = () => {
      // Apply friction
      currentVelocity *= 0.95;

      // Calculate new scroll position
      const newScrollLeft = container.scrollLeft - currentVelocity;

      // Check boundaries
      if (newScrollLeft < 0) {
        // Hit left boundary
        const overscroll = Math.abs(newScrollLeft);
        const resistance = Math.pow(overscroll, 0.6) * 0.6;
        offset = resistance;
        onRubberBandOffsetChange(resistance);
        container.scrollLeft = 0;

        // Apply spring back force
        currentVelocity *= 0.85;
        offset *= 0.88; // Stronger spring back

        if (Math.abs(offset) < 0.5 && Math.abs(currentVelocity) < 0.1) {
          onRubberBandOffsetChange(0);
          return;
        }
      } else if (newScrollLeft > maxScroll) {
        // Hit right boundary
        const overscroll = newScrollLeft - maxScroll;
        const resistance = Math.pow(overscroll, 0.6) * 0.6;
        offset = -resistance;
        onRubberBandOffsetChange(-resistance);
        container.scrollLeft = maxScroll;

        // Apply spring back force
        currentVelocity *= 0.85;
        offset *= 0.88; // Stronger spring back

        if (Math.abs(offset) < 0.5 && Math.abs(currentVelocity) < 0.1) {
          onRubberBandOffsetChange(0);
          return;
        }
      } else {
        // Normal scrolling
        container.scrollLeft = newScrollLeft;
        offset = 0;
        onRubberBandOffsetChange(0);

        // Stop if velocity is too low
        if (Math.abs(currentVelocity) < 0.1) {
          return;
        }
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    // Only start animation if there's significant velocity
    if (Math.abs(currentVelocity) > 0.5 || Math.abs(offset) > 0.5) {
      animationFrame.current = requestAnimationFrame(animate);
    } else {
      onRubberBandOffsetChange(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto hide-scrollbar ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ WebkitOverflowScrolling: 'auto' }}
    >
      {children}
    </div>
  );
};