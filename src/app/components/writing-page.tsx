const PLACEHOLDER_POSTS = [
  { title: 'Designing through prototypes', detail: 'Notes · Coming soon' },
  { title: 'What hardware teaches software', detail: 'Essay · Coming soon' },
  { title: 'Making interaction models legible', detail: 'Notes · Coming soon' },
];

export function WritingPage({ variant }: { variant: 'desktop' | 'mobile' }) {
  const isMobile = variant === 'mobile';

  return (
    <main
      aria-labelledby={`writing-title-${variant}`}
      className={
        isMobile
          ? 'pb-16 pt-8 font-[\'Alliance_No.1\',sans-serif] text-[#121111]'
          : 'max-w-[880px] pt-[clamp(42px,7vh,96px)] font-[\'Alliance_No.1\',sans-serif] text-[#121111]'
      }
    >
      <h1
        id={`writing-title-${variant}`}
        className={
          isMobile
            ? 'm-0 font-light text-[40px] leading-[0.98] tracking-[-1.8px]'
            : 'm-0 font-light text-[clamp(56px,6vw,92px)] leading-[0.95] tracking-[-0.045em]'
        }
      >
        Writing
      </h1>
      <p className="mb-0 mt-5 max-w-[520px] font-light text-[18px] leading-[1.35] tracking-[-0.025em] text-[rgb(18_17_17/0.58)] md:mt-7 md:text-[22px]">
        A place for notes on design, prototyping, and the things I learn while making products.
      </p>

      <div className="mt-12 border-t border-[rgb(18_17_17/0.1)] md:mt-16">
        {PLACEHOLDER_POSTS.map((post) => (
          <div
            key={post.title}
            className="flex items-baseline justify-between gap-6 border-b border-[rgb(18_17_17/0.1)] py-5 md:py-6"
          >
            <h2 className="m-0 font-light text-[20px] leading-[1.1] tracking-[-0.035em] md:text-[27px]">
              {post.title}
            </h2>
            <p className="m-0 shrink-0 font-light text-[13px] tracking-[-0.02em] text-[rgb(18_17_17/0.45)] md:text-[15px]">
              {post.detail}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
