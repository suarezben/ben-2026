import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeD0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  /** One remount + refetch; avoids sticking on spurious error (e.g. aborted load during layout/animation). */
  const [retryGeneration, setRetryGeneration] = useState(0)

  const { src, alt, style, className, onError, onLoad, ...rest } = props
  const imgRef = useRef<HTMLImageElement>(null)
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  useEffect(() => {
    setDidError(false)
    setRetryGeneration(0)
  }, [src])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (retryGeneration < 2) {
      setRetryGeneration((g) => g + 1)
      return
    }
    setDidError(true)
    onError?.(e)
  }

  const effectiveSrc =
    src && retryGeneration > 0
      ? `${src}${src.includes('?') ? '&' : '?'}_retry=${retryGeneration}`
      : src

  /** Cached images often reach `complete` before `load` fires — avoids stuck blur overlays. */
  useLayoutEffect(() => {
    if (didError || !effectiveSrc) return
    const el = imgRef.current
    const cb = onLoadRef.current
    if (!el || !cb) return
    if (el.complete && el.naturalWidth > 0) {
      cb({ currentTarget: el, target: el } as React.SyntheticEvent<HTMLImageElement, Event>)
    }
  }, [effectiveSrc, didError])

  const mergedOnLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    onLoad?.(e)
  }

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      key={`${src ?? ''}-${retryGeneration}`}
      ref={imgRef}
      src={effectiveSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
      onLoad={mergedOnLoad}
    />
  )
}
