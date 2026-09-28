import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

/** Matas-style `invert(30%) blur(10px)`; ~20px per original Matas notes (his ship is 50px). */
const CURSOR_SIZE = 20;
const CURSOR_OFFSET = CURSOR_SIZE / 2;

interface CustomCursorProps {
  isPressed: boolean;
}

type ForwardedCursorMove = CustomEvent<{ clientX: number; clientY: number }>;

export function CustomCursor({ isPressed }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

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
      const { clientX, clientY } = (event as ForwardedCursorMove).detail;
      moveTo(clientX, clientY);
    };

    const onLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('writing-cursor-move', onForwardedMove);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('writing-cursor-move', onForwardedMove);
      document.removeEventListener('mouseleave', onLeave);
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
        animate={{ scale: isPressed ? 0.85 : 1 }}
        transition={{ type: 'spring', stiffness: 800, damping: 30, mass: 0.3 }}
      />
    </div>
  );
}
