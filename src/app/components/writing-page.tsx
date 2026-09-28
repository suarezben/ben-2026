import { createPortal } from 'react-dom';

export function WritingPage({ variant }: { variant: 'desktop' | 'mobile' }) {
  return createPortal(
    <main
      aria-labelledby={`writing-message-${variant}`}
      className={`pointer-events-none fixed inset-0 items-center justify-center ${
        variant === 'desktop' ? 'hidden md:flex' : 'flex md:hidden'
      }`}
    >
      <p
        id={`writing-message-${variant}`}
        className="font-['Alliance_No.1',sans-serif] text-[20px] font-light text-[#121111]"
      >
        Coming soon
      </p>
    </main>,
    document.body
  );
}
