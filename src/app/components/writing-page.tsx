export function WritingPage({ variant }: { variant: 'desktop' | 'mobile' }) {
  return (
    <main
      aria-labelledby={`writing-message-${variant}`}
      className="pointer-events-none fixed inset-0 flex items-center justify-center"
    >
      <p
        id={`writing-message-${variant}`}
        className="font-['Alliance_No.1',sans-serif] text-[20px] font-light text-[#121111]"
      >
        Coming soon
      </p>
    </main>
  );
}
