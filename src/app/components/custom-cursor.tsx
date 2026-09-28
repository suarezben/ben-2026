import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/** Matas-style `invert(30%) blur(10px)`; ~20px per original Matas notes (his ship is 50px). */
const CURSOR_SIZE = 20;
const CURSOR_OFFSET = CURSOR_SIZE / 2;

interface CustomCursorProps {
  isPressed: boolean;
}

type ForwardedCursorMove = CustomEvent<{
  clientX: number;
  clientY: number;
  hovered?: boolean;
}>;
type ForwardedCursorState = CustomEvent<{
  hovered?: boolean;
  pressed?: boolean;
  visible?: boolean;
}>;

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[data-lightbox]',
].join(',');

export function CustomCursor({ isPressed }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFramePressed, setIsFramePressed] = useState(false);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const moveTo = (clientX: number, clientY: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        el.style.transform = `translate(${clientX - CURSOR_OFFSET}px, ${clientY - CURSOR_OFFSET}px)`;
        el.style.opacity = '1';
      });
    };

    const onMove = (event: MouseEvent) => moveTo(event.clientX, event.clientY);
    const onForwardedMove = (event: Event) => {
      const { clientX, clientY, hovered } = (event as ForwardedCursorMove).detail;
      moveTo(clientX, clientY);
      if (typeof hovered === 'boolean') setIsHovered(hovered);
    };

    const interactiveAncestor = (target: EventTarget | null) =>
      target instanceof Element ? target.closest(INTERACTIVE_SELECTOR) : null;
    const onPointerOver = (event: PointerEvent) => {
      setIsHovered(Boolean(interactiveAncestor(event.target)));
    };
    const onPointerOut = (event: PointerEvent) => {
      setIsHovered(Boolean(interactiveAncestor(event.relatedTarget)));
    };
    const onForwardedState = (event: Event) => {
      const detail = (event as ForwardedCursorState).detail;
      if (typeof detail.hovered === 'boolean') setIsHovered(detail.hovered);
      if (typeof detail.pressed === 'boolean') setIsFramePressed(detail.pressed);
      if (detail.visible === false) el.style.opacity = '0';
    };

    const onLeave = () => {
      el.style.opacity = '0';
      setIsHovered(false);
      setIsFramePressed(false);
    };

    const onRelease = () => setIsFramePressed(false);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('writing-cursor-move', onForwardedMove);
    window.addEventListener('writing-cursor-state', onForwardedState);
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('pointerup', onRelease, { passive: true });
    window.addEventListener('pointercancel', onRelease, { passive: true });
    window.addEventListener('blur', onRelease);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('writing-cursor-move', onForwardedMove);
      window.removeEventListener('writing-cursor-state', onForwardedState);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
      window.removeEventListener('blur', onRelease);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 z-[100000] pointer-events-none will-change-transform transition-opacity duration-150"
      style={{ transform: 'translate(0, 0)', opacity: 0, width: CURSOR_SIZE, height: CURSOR_SIZE }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          transformOrigin: 'center center',
          backdropFilter: 'invert(30%) blur(10px)',
          WebkitBackdropFilter: 'invert(30%) blur(10px)',
        }}
        animate={{ scale: isPressed || isFramePressed ? 0.66 : isHovered ? 0.84 : 1 }}
        transition={{ type: 'spring', stiffness: 800, damping: 30, mass: 0.3 }}
      />
    </div>
  );
}
