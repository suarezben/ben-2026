import { useEffect, useRef, useState } from 'react';

const ARTICLE_PATH = `${import.meta.env.BASE_URL}writing/site-codex/index.html`;

type WritingPageProps = {
  variant: 'desktop' | 'mobile';
  onHeaderVisibilityChange: (visible: boolean) => void;
  onHeaderDividerChange: (visible: boolean) => void;
  onLightboxProgressChange: (progress: number) => void;
};

type LightboxProgressEvent = CustomEvent<{ progress?: number }>;

const CURSOR_INTERACTIVE_SELECTOR = [
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

export function WritingPage({
  variant,
  onHeaderVisibilityChange,
  onHeaderDividerChange,
  onLightboxProgressChange,
}: WritingPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [articleReady, setArticleReady] = useState(false);
  const isMobile = variant === 'mobile';

  useEffect(() => {
    onHeaderVisibilityChange(true);
    onHeaderDividerChange(false);
    onLightboxProgressChange(0);
    return () => cleanupRef.current?.();
  }, [onHeaderDividerChange, onHeaderVisibilityChange, onLightboxProgressChange]);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(`[data-writing-header="${variant}"]`);
    if (!header) return;
    const forwardWheel = (event: WheelEvent) => {
      const frameWindow = iframeRef.current?.contentWindow;
      if (!frameWindow || event.ctrlKey) return;
      frameWindow.scrollBy({ top: event.deltaY, left: event.deltaX });
      event.preventDefault();
    };
    header.addEventListener('wheel', forwardWheel, { passive: false });
    return () => header.removeEventListener('wheel', forwardWheel);
  }, [variant]);

  const connectArticle = (iframe: HTMLIFrameElement) => {
    cleanupRef.current?.();
    const frameWindow = iframe.contentWindow;
    const frameDocument = iframe.contentDocument;
    if (!frameWindow || !frameDocument) return;

    let lastScrollY = frameWindow.scrollY;
    let headerVisible = true;
    let headerDividerVisible = false;
    const setHeaderVisible = (visible: boolean) => {
      if (visible === headerVisible) return;
      headerVisible = visible;
      onHeaderVisibilityChange(visible);
    };
    const setHeaderDividerVisible = (visible: boolean) => {
      if (visible === headerDividerVisible) return;
      headerDividerVisible = visible;
      onHeaderDividerChange(visible);
    };
    const onScroll = () => {
      const nextY = frameWindow.scrollY;
      if (nextY <= 24) {
        setHeaderVisible(true);
        setHeaderDividerVisible(false);
      } else if (nextY > lastScrollY + 3) {
        setHeaderVisible(false);
        setHeaderDividerVisible(false);
      } else if (nextY < lastScrollY - 3) {
        setHeaderVisible(true);
        setHeaderDividerVisible(true);
      }
      lastScrollY = nextY;
    };
    const isInteractive = (target: EventTarget | null) => {
      const element = target as (EventTarget & { closest?: (selector: string) => Element | null }) | null;
      return typeof element?.closest === 'function' &&
        Boolean(element.closest(CURSOR_INTERACTIVE_SELECTOR));
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = iframe.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent('writing-cursor-move', {
        detail: {
          clientX: rect.left + event.clientX,
          clientY: rect.top + event.clientY,
          hovered: isInteractive(event.target),
        },
      }));
    };
    const forwardCursorState = (detail: {
      hovered?: boolean;
      pressed?: boolean;
      visible?: boolean;
    }) => window.dispatchEvent(new CustomEvent('writing-cursor-state', { detail }));
    const onPointerOver = (event: PointerEvent) => {
      forwardCursorState({ hovered: isInteractive(event.target), visible: true });
    };
    const onPointerOut = (event: PointerEvent) => {
      forwardCursorState({
        hovered: isInteractive(event.relatedTarget),
        visible: event.relatedTarget !== null,
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary && event.button === 0) forwardCursorState({ pressed: true });
    };
    const releaseCursor = () => forwardCursorState({ pressed: false });
    const leaveArticle = () => {
      forwardCursorState({ hovered: false, pressed: false, visible: false });
    };
    const onLightboxProgress = (event: Event) => {
      const progress = (event as LightboxProgressEvent).detail?.progress ?? 0;
      onLightboxProgressChange(Math.max(0, Math.min(1, progress)));
    };
    const onLightboxClose = () => onLightboxProgressChange(0);

    const applyHostHeaderInset = () => {
      const articleColumn = frameDocument.querySelector<HTMLElement>('.column');
      const hostHeader = document.querySelector<HTMLElement>(`[data-writing-header="${variant}"]`);
      if (!articleColumn || !hostHeader) return;

      const iframeTop = iframe.getBoundingClientRect().top;
      const headerBottom = hostHeader.getBoundingClientRect().bottom;
      articleColumn.style.setProperty(
        'padding-top',
        `${Math.max(24, headerBottom - iframeTop + 24)}px`,
        'important'
      );
    };
    const scheduleHostHeaderInset = () => requestAnimationFrame(applyHostHeaderInset);
    const resizeObserver = new ResizeObserver(scheduleHostHeaderInset);
    const hostHeader = document.querySelector<HTMLElement>(`[data-writing-header="${variant}"]`);
    if (hostHeader) resizeObserver.observe(hostHeader);
    window.addEventListener('resize', scheduleHostHeaderInset);

    frameWindow.addEventListener('scroll', onScroll, { passive: true });
    frameDocument.addEventListener('pointermove', onPointerMove, { passive: true });
    frameDocument.addEventListener('pointerover', onPointerOver, { passive: true });
    frameDocument.addEventListener('pointerout', onPointerOut, { passive: true });
    frameDocument.addEventListener('pointerdown', onPointerDown, { passive: true });
    frameDocument.addEventListener('pointerup', releaseCursor, { passive: true });
    frameDocument.addEventListener('pointercancel', releaseCursor, { passive: true });
    frameDocument.addEventListener('mouseleave', leaveArticle);
    frameWindow.addEventListener('blur', releaseCursor);
    frameDocument.addEventListener('lightboxprogress', onLightboxProgress);
    frameDocument.addEventListener('lightboxclose', onLightboxClose);
    applyHostHeaderInset();
    requestAnimationFrame(applyHostHeaderInset);
    setArticleReady(true);

    cleanupRef.current = () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleHostHeaderInset);
      frameWindow.removeEventListener('scroll', onScroll);
      frameDocument.removeEventListener('pointermove', onPointerMove);
      frameDocument.removeEventListener('pointerover', onPointerOver);
      frameDocument.removeEventListener('pointerout', onPointerOut);
      frameDocument.removeEventListener('pointerdown', onPointerDown);
      frameDocument.removeEventListener('pointerup', releaseCursor);
      frameDocument.removeEventListener('pointercancel', releaseCursor);
      frameDocument.removeEventListener('mouseleave', leaveArticle);
      frameWindow.removeEventListener('blur', releaseCursor);
      frameDocument.removeEventListener('lightboxprogress', onLightboxProgress);
      frameDocument.removeEventListener('lightboxclose', onLightboxClose);
    };
  };

  return (
    <main
      aria-label="Writing"
      className={
        isMobile
          ? 'relative h-full min-h-0 w-full overflow-hidden bg-white'
          : '-mx-[17.5px] -mt-[31px] relative h-[calc(100%+31px)] min-h-0 w-[calc(100%+35px)] overflow-hidden bg-white lg:-mx-[24.5px] lg:w-[calc(100%+49px)] xl:-mx-[31.5px] xl:w-[calc(100%+63px)]'
      }
    >
      <iframe
        ref={iframeRef}
        src={`${ARTICLE_PATH}?embedded=${variant}`}
        title="AI helped me build something I actually wanted to print."
        className="block h-full w-full border-0 bg-white"
        allow="autoplay; fullscreen"
        onLoad={(event) => connectArticle(event.currentTarget)}
      />
      {!articleReady && <div aria-hidden className="absolute inset-0" />}
    </main>
  );
}
