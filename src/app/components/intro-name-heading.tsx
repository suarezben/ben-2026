/**
 * “My name is” + signature image — layout/sizing from Figma `4206:13665`
 * (desktop frame 299×59, mobile 122×24; scales with text breakpoints).
 */
const NAME_SIGNATURE_SRC = '/images/bensuarez-name.png';

type IntroNameHeadingProps = {
  variant: 'desktop' | 'mobile';
  /** Signature acts as a shortcut to the first project (e.g. Meta). */
  onSignatureClick?: () => void;
};

export function IntroNameHeading({ variant, onSignatureClick }: IntroNameHeadingProps) {
  const isMobile = variant === 'mobile';

  const imgClass =
    isMobile
      ? 'block h-6 w-[122px] object-contain object-left'
      : 'block h-[28px] w-auto max-w-[142px] translate-y-[2px] object-contain object-left lg:h-[35px] lg:max-w-[177px] xl:h-[43px] xl:max-w-[213px]';

  const signatureImg = (
    <img
      src={NAME_SIGNATURE_SRC}
      alt={onSignatureClick ? '' : 'Ben Suarez'}
      width={973}
      height={191}
      decoding="async"
      fetchPriority="high"
      className={imgClass}
    />
  );

  return (
    <>
      <p
        className={
          isMobile
            ? 'm-0 mb-0 flex flex-wrap items-end gap-x-[0.25em] gap-y-1 leading-[normal]'
            : 'mb-0 flex flex-wrap items-end gap-x-[0.25em] gap-y-1 leading-[normal]'
        }
      >
        <span className="shrink-0">My name is</span>
        {onSignatureClick ? (
          <button
            type="button"
            onClick={onSignatureClick}
            aria-label="Open first project: Meta Reality Labs"
            className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-black/35 focus-visible:ring-offset-2"
          >
            {signatureImg}
          </button>
        ) : (
          signatureImg
        )}
      </p>
      <p
        className={
          isMobile
            ? 'm-0 mt-[0.225em] leading-[normal]'
            : 'mb-0 mt-0 leading-[normal]'
        }
      >
        I'm a designer living in San Francisco.
      </p>
    </>
  );
}
