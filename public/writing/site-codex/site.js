// Motion settings are centralized so the final lightbox design can change independently.
const CONFIG = {
  response: .48, damping: .88, pageScale: .96, blur: 16,
  backdropColor: '#131015', backdropDim: .10,
  saturation: 140, brightness: 82,
  materialWarmup: .0625, materialWarmupFrames: 3,
  dragRevealDistance: .5, dragMaxReduction: .85,
  lightboxDismissMinStride: .75,
  lightboxSiblingDelay: .03,
  margin: 64, carouselSpeed: 49, momentumTau: .9,
  carouselPauseTau: .14, carouselResumeTau: .52, carouselLandingHold: .12,
  carouselFadeFalloff: 150, carouselFadeIntensity: .82,
  carouselFadeMode: 'items', carouselItemDropoff: 760,
  carouselItemMinOpacity: .17, carouselItemMaxOpacity: 1,
  iterationSpeed: 49, iterationTiltAngle: 8, iterationMappingRange: .5,
  iterationCenterScale: 1, iterationEdgeScale: .86, iterationGap: 33,
  iterationAnchorX: 50, iterationAnchorY: 100,
  iterationFadeDistance: 860, iterationMinOpacity: .21,
  mobileIterationTiltAngle: 10, mobileIterationMappingRange: 1,
  mobileIterationCenterScale: 1, mobileIterationEdgeScale: .82,
  mobileIterationGap: 26,
  mobileIterationAnchorX: 50, mobileIterationAnchorY: 67,
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const reducedTransparency = matchMedia('(prefers-reduced-transparency: reduce)');
const supportsBackdropFilter = CSS.supports('backdrop-filter','blur(1px)') ||
  CSS.supports('-webkit-backdrop-filter','blur(1px)');
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const mix = (a, b, t) => a + (b - a) * t;
const carouselOpacityReturns = new WeakMap();
const carouselTransformReturns = new WeakMap();
const mobileCarouselLayout = matchMedia('(max-width: 700px)');
class Spring {
  constructor(x = 0) { this.set(x); }
  set(x) { this.x = this.target = x; this.v = 0; return this; }
  to(x, velocity) { this.target = x; if (velocity !== undefined) this.v = velocity; return this; }
  get settled() { return Math.abs(this.x - this.target) < .0001 && Math.abs(this.v) < .001; }
  step(dt) {
    if (reducedMotion.matches) return this.set(this.target);
    const w = 2 * Math.PI / CONFIG.response;
    const steps = Math.ceil(dt * 240), h = dt / Math.max(1, steps);
    for (let i = 0; i < steps; i++) {
      this.v += (-w*w*(this.x-this.target) - 2*CONFIG.damping*w*this.v)*h;
      this.x += this.v*h;
    }
    if (this.settled) this.set(this.target);
  }
}
const tickers = new Set();
let last = performance.now();
function frame(now) {
  const dt = Math.min(.032, (now-last)/1000); last = now;
  if (!document.hidden) for (const tick of tickers) tick(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Match the custom cursor from bensuarez.com: a small inverted, blurred lens
// with the same 800 / 30 / 0.3 spring and extra hover feedback for controls.
function setupCustomCursor() {
  const desktopPointer = matchMedia('(hover: hover) and (pointer: fine)');
  if (!desktopPointer.matches) return;

  // When embedded by the portfolio shell, that top-level document owns the
  // single cursor so it can paint above both the article and sticky header.
  // Keep the native cursor hidden here; WritingPage forwards pointer coordinates.
  if (window.self !== window.top) {
    document.documentElement.classList.add('has-custom-cursor');
    return;
  }

  const cursor = document.createElement('div');
  const lens = document.createElement('div');
  cursor.className = 'custom-cursor';
  lens.className = 'custom-cursor__lens';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.append(lens);
  document.body.append(cursor);

  const scale = { x: 1, target: 1, v: 0 };
  let moved = false;
  let hoveredTarget = null;
  let isPressed = false;

  const tabbableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  const updateScaleTarget = () => {
    scale.target = isPressed ? .66 : hoveredTarget ? .84 : 1;
  };

  const move = event => {
    cursor.style.transform = `translate3d(${event.clientX - 10}px, ${event.clientY - 10}px, 0)`;
    if (!moved) {
      moved = true;
      document.documentElement.classList.add('has-custom-cursor');
      cursor.style.opacity = '1';
    }
  };
  const show = () => { if (moved) cursor.style.opacity = '1'; };
  const hide = () => { cursor.style.opacity = '0'; };
  const trackHover = event => {
    const target = event.type === 'mouseout' ? event.relatedTarget : event.target;
    hoveredTarget = target instanceof Element ? target.closest(tabbableSelector) : null;
    updateScaleTarget();
  };
  const press = () => {
    isPressed = true;
    updateScaleTarget();
  };
  const release = () => {
    isPressed = false;
    updateScaleTarget();
  };

  addEventListener('mousemove', move, { passive: true });
  addEventListener('mouseover', trackHover, { passive: true });
  addEventListener('mouseout', trackHover, { passive: true });
  addEventListener('mousedown', press, { passive: true });
  addEventListener('mouseup', release, { passive: true });
  addEventListener('blur', release);
  document.addEventListener('mouseenter', show);
  document.addEventListener('mouseleave', hide);

  tickers.add(dt => {
    if (reducedMotion.matches) {
      scale.x = scale.target;
      scale.v = 0;
    } else {
      const steps = Math.ceil(dt * 240);
      const h = dt / Math.max(1, steps);
      for (let i = 0; i < steps; i++) {
        scale.v += (-800 * (scale.x - scale.target) - 30 * scale.v) / .3 * h;
        scale.x += scale.v * h;
      }
    }
    lens.style.setProperty('--cursor-scale', scale.x.toFixed(4));
  });
}
setupCustomCursor();

// Exact Figma corner smoothing, applied to containers, never to the image/video file.
const pendingGeometry = new Map();
let geometryFrame = 0;
const geometry = new ResizeObserver(entries => {
  for (const {target: el, contentRect: r} of entries) {
    pendingGeometry.set(el, {width: el.offsetWidth, height: el.offsetHeight, contentWidth: r.width});
  }
  // Apply clip-path and outline writes after ResizeObserver delivery. Writing
  // them inside the callback can cause Chromium to report an observer loop.
  if (!geometryFrame) geometryFrame = requestAnimationFrame(() => {
    geometryFrame = 0;
    const updates = [...pendingGeometry];
    pendingGeometry.clear();
    for (const [el, {width, height, contentWidth}] of updates) {
      if (el.matches('.media--fixed')) {
        el.style.setProperty('--dw', el.dataset.w);
        el.style.setProperty('--dh', el.dataset.h);
        el.style.setProperty('--s', contentWidth / Number(el.dataset.w));
      }
      smooth(el, width, height);
    }
  });
});
function smooth(el, width, height) {
  const smoothBareCard=el.classList.contains('iteration-card');
  if ((el.classList.contains('media--bare')&&!smoothBareCard) || !width || !height) return;
  const radiusValue=getComputedStyle(el).borderTopLeftRadius;
  const [horizontalRadius,verticalRadius=horizontalRadius]=radiusValue.split(/\s+/);
  const resolveRadius=(value,axisLength)=> {
    const amount=parseFloat(value)||0;
    return value.endsWith('%')?axisLength*amount/100:amount;
  };
  // Computed percentage radii remain percentages. parseFloat("12.25%") was
  // treating the carousel's intended ~24px corner as 12.25px, and the custom
  // clip path then overrode the correct CSS radius. The horizontal and vertical
  // percentages are tuned to resolve to the same physical radius.
  const radius=(resolveRadius(horizontalRadius,width)+resolveRadius(verticalRadius,height))/2;
  const path = getSvgPath({width, height, cornerRadius: radius, cornerSmoothing: .75, preserveSmoothing: true});
  el.style.clipPath = `path('${path}')`;
  if(el.matches('.media')) {
    el.classList.add('has-smooth-path');
    let svg=el.querySelector(':scope > .media-outline');
    if(!svg) {
      svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.classList.add('media-outline'); svg.setAttribute('aria-hidden','true');
      svg.append(document.createElementNS('http://www.w3.org/2000/svg','path')); el.append(svg);
    }
    // The outline stroke is centered on its path. Reusing the outer clipping
    // path cuts off half of that stroke, which becomes especially noticeable
    // while carousel cards are rotated and scaled. Keep the clip at the true
    // edge, but keep the 1px outline a half-pixel clear of that boundary. An
    // exact half-stroke inset still loses antialiased corner pixels once the
    // carousel rotates the composited card.
    const outlineInset=1;
    const outlinePath=getSvgPath({
      width:Math.max(0,width-outlineInset*2),
      height:Math.max(0,height-outlineInset*2),
      cornerRadius:Math.max(0,radius-outlineInset),
      cornerSmoothing:.75,
      preserveSmoothing:true
    });
    const outline=svg.firstChild;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    outline.setAttribute('d',outlinePath);
    outline.setAttribute('transform',`translate(${outlineInset} ${outlineInset})`);
  }
}
document.querySelectorAll('.media, .card-video, .tldr').forEach(el => geometry.observe(el));

// Load and loop only videos near the viewport. Every clip has a first-frame
// poster, so slow networks and decoder restarts never expose an empty container.
// Moving the original DOM node into the lightbox preserves its time; it does not
// create a second playing decoder.
const visibleVideos = new Set();
const videoRetryTimers = new WeakMap();
const videoRetryCounts = new WeakMap();
const clearVideoRetry = video => {
  const timer=videoRetryTimers.get(video);
  if(timer) clearTimeout(timer);
  videoRetryTimers.delete(video);
};
const retryVideo = (video, delay) => {
  if(!visibleVideos.has(video)||videoRetryTimers.has(video)) return;
  const retries=videoRetryCounts.get(video)||0;
  if(retries>=2) return;
  videoRetryCounts.set(video,retries+1);
  const timer=setTimeout(()=> {
    videoRetryTimers.delete(video);
    if(!document.hidden&&visibleVideos.has(video)) {
      if(video.error||video.readyState<3) video.load();
      playVideo(video);
    }
  },delay);
  videoRetryTimers.set(video,timer);
};
const playVideo = video => {
  if(document.hidden||!visibleVideos.has(video)) return;
  clearVideoRetry(video);
  video.muted=true;
  video.preload='auto';
  video.play().catch(error=> {
    if(error?.name==='AbortError'||error?.name==='NotAllowedError') return;
    retryVideo(video,1500);
  });
};
const videoObserver = new IntersectionObserver(entries => {
  for (const {target: video, isIntersecting} of entries) {
    if (isIntersecting) visibleVideos.add(video); else visibleVideos.delete(video);
    if (isIntersecting && !document.hidden) playVideo(video);
    else { clearVideoRetry(video); video.pause(); }
  }
}, {rootMargin: '160px 0px'});
document.querySelectorAll('video').forEach(video => {
  video.muted = true; video.loop = true; video.playsInline = true;
  video.disablePictureInPicture = true; video.controls = false;
  video.addEventListener('playing',()=> {
    clearVideoRetry(video);
    videoRetryCounts.set(video,0);
  });
  video.addEventListener('canplay',()=>playVideo(video));
  video.addEventListener('stalled',()=>retryVideo(video,2500));
  video.addEventListener('error',()=>retryVideo(video,1500));
  videoObserver.observe(video);
});
document.addEventListener('visibilitychange', () => {
  document.querySelectorAll('video').forEach(video => {
    if (document.hidden) video.pause();
    else if (visibleVideos.has(video)) playVideo(video);
  });
});

const lightbox = (() => {
  const root = document.querySelector('#lightbox');
  const stage = root.querySelector('.lb-stage');
  const backdrop = root.querySelector('.lb-backdrop');
  const closeButton = root.querySelector('.lb-close');
  const downloadButton = root.querySelector('.lb-download');
  const previous = root.querySelector('.lb-prev'), next = root.querySelector('.lb-next');
  const counter = root.querySelector('.lb-counter');
  const background = document.querySelector('#page');
  const progress = new Spring(), paging = new Spring(), dragX = new Spring(), dragY = new Spring();
  let state = 'closed', slides = [], index = 0, pointer = null, trigger;
  let restoreTriggerFocus = true;
  let vw = innerWidth, vh = innerHeight, savedScroll = 0, closingTargets, closingHoldUntil = 0, openingStartedAt = 0;
  let backgroundAriaHidden = null;
  let scrollLockStyles = null;
  let closingBackgroundPresence = 1;
  const rect = el => { const r = el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; };
  const lerpRect = (a,b,p) => ({x:mix(a.x,b.x,p),y:mix(a.y,b.y,p),w:mix(a.w,b.w,p),h:mix(a.h,b.h,p)});
  function dragReveal() {
    // Horizontal movement pages grouped media, so only its vertical component
    // dismisses. A single item can dismiss freely in any direction.
    const distance=slides.length===1?Math.hypot(dragX.x,dragY.x):Math.abs(dragY.x);
    return clamp(distance/(vh*CONFIG.dragRevealDistance),0,CONFIG.dragMaxReduction);
  }
  function fittedSize(slide, dismissDistance) {
    const margin = innerWidth < 600 ? 24 : CONFIG.margin;
    const maxW = vw-2*margin;
    const viewportMaxH = vh-2*margin-56;
    const isTallMedia = slide.origin.h/slide.origin.w >= 1.6;
    const maxH = isTallMedia ? Math.min(viewportMaxH,vh*.75) : viewportMaxH;
    const scale = Math.min(maxW/slide.origin.w, maxH/slide.origin.h);
    const shrink = 1 - Math.min(.22, dismissDistance/vh*.28);
    return {w:slide.origin.w*scale*shrink,h:slide.origin.h*scale*shrink};
  }
  function fit(slide, i) {
    const dismissDistance=slides.length===1?Math.hypot(dragX.x,dragY.x):Math.abs(dragY.x);
    const {w,h}=fittedSize(slide,dismissDistance);
    // Bring grouped siblings inward with the exact progress that reveals the
    // page. This makes vertical dismissal feel like one coherent gesture while
    // preserving horizontal paging as a separate interaction.
    const revealProgress=CONFIG.dragMaxReduction?dragReveal()/CONFIG.dragMaxReduction:0;
    let pageStride=1;
    if(slides.length>1) {
      const activeSize=fittedSize(slides[index],dismissDistance);
      const minimumGap=innerWidth<600?12:18;
      const nonOverlappingStride=((w+activeSize.w)/2+minimumGap)/vw;
      const minimumStride=clamp(nonOverlappingStride,CONFIG.lightboxDismissMinStride,1);
      // Approach the gap limit quickly, then add increasing resistance. The
      // sibling keeps responding to the pull but cannot cross the active item.
      const rubberProgress=1-Math.exp(-3*revealProgress);
      pageStride=mix(1,minimumStride,rubberProgress);
    }
    return {x:(vw-w)/2+(i-paging.x)*vw*pageStride+dragX.x,y:(vh-h)/2+dragY.x,w,h};
  }
  function backgroundPresence() {
    // Follow the same drag spring as the media, including its return on release.
    // Half a viewport of travel reveals most of the page without making it flash.
    return 1-dragReveal();
  }
  function render() {
    const presence = state === 'closing' ? closingBackgroundPresence : backgroundPresence();
    // Never render the spring outside the lightbox's visual range. An
    // underdamped spring crosses its target before settling; using that raw
    // value for geometry makes the media briefly pass its origin/destination
    // and then reverse, which looks like an endpoint flicker.
    const visualProgress = clamp(progress.x,0,1);
    const p = visualProgress * presence, scale = mix(1,CONFIG.pageScale,p);
    // WebKit can defer the first backdrop-filter paint when a previously hidden
    // layer begins filtering and animating in the same frame. Prime the material
    // at one pixel of blur before media motion starts so the visible spring does
    // not outrun Safari's compositor setup.
    const materialProgress = Math.max(p,state==='priming'?CONFIG.materialWarmup:0);
    document.dispatchEvent(new CustomEvent('lightboxprogress',{detail:{progress:p}}));
    background.style.transform = `scale(${scale})`;
    const useMaterial = supportsBackdropFilter && !reducedTransparency.matches;
    const dim = useMaterial ? CONFIG.backdropDim : Math.max(CONFIG.backdropDim,.72);
    const backdropAlpha=Math.round(dim*materialProgress*255).toString(16).padStart(2,'0');
    backdrop.style.background = `${CONFIG.backdropColor}${backdropAlpha}`;
    // Keep the filtered surface fully composited. Fading the whole layer blends
    // a blurred capture over the still-sharp page, which makes text look doubled.
    // Instead, animate the material itself and fade only its tint.
    backdrop.style.opacity = 1;
    backdrop.style.backdropFilter = backdrop.style.webkitBackdropFilter = useMaterial
      ? `blur(${CONFIG.blur*materialProgress}px) saturate(${mix(100,CONFIG.saturation,materialProgress)}%) brightness(${mix(100,CONFIG.brightness,materialProgress)}%)`
      : 'none';
    // Safari derives browser-chrome color from the viewport's outer pixels, but
    // does not reliably sample a backdrop-filtered surface. Keep the blur for
    // the lightbox while placing a very thin, unfiltered translucent tint above
    // it at each edge. Unlike the old solid matte, this preserves a trace of the
    // live blurred scene so the browser surroundings can feel contextual.
    root.style.setProperty('--lb-edge-color', `${CONFIG.backdropColor}${Math.round(CONFIG.backdropDim*255).toString(16).padStart(2,'0')}`);
    // Give Safari a stable edge sample throughout opening rather than asking
    // its browser chrome to follow the spring frame-by-frame.
    const edgePresence = state==='priming'||state==='opening'||state==='open' ? 1 : p;
    root.style.setProperty('--lb-edge-opacity', edgePresence);
    for (let i=0; i<slides.length; i++) {
      const slide=slides[i], o=slide.origin;
      const from={x:vw/2+(o.x-vw/2)*scale,y:vh/2+(o.y-vh/2)*scale,w:o.w*scale,h:o.h*scale};
      const to=state==='closing'?closingTargets[i]:fit(slide,i);
      const slideProgress=clamp(slide.entrance.x,0,1);
      const r=lerpRect(from,to,slideProgress);
      slide.wrap.style.transform=`translate3d(${r.x}px,${r.y}px,0) scale(${r.w/slide.base.w})`;
      slide.wrap.style.zIndex=i===index?'2':'1';
      const returnAngle=slide.oldAngle*(1-slideProgress);
      const returnScale=mix(slide.oldScale,1,slideProgress);
      slide.el.style.transform=slide.oldAngle||slide.oldScale!==1
        ? `rotate(${returnAngle}deg) scale(${returnScale})`
        : '';
      // Grouped media moves as one unit: every original leaves its page slot and
      // remains in the lightbox so the full set can return together on dismiss.
      slide.wrap.style.visibility='visible';
    }
  }
  function controls() {
    previous.hidden=next.hidden=slides.length<2;
    previous.disabled=index===0; next.disabled=index===slides.length-1;
    downloadButton.disabled=!downloadSource();
    counter.textContent=slides.length>1?`${index+1} / ${slides.length}`:'';
  }
  function downloadSource() {
    const media=slides[index]?.el;
    return media?.querySelector('video[src]')?.currentSrc || media?.querySelector('video[src]')?.src ||
      media?.querySelector('img:not(.phone-frame)[src]')?.currentSrc || media?.querySelector('img:not(.phone-frame)[src]')?.src || '';
  }
  async function downloadCurrent() {
    const source=downloadSource();
    if(!source) return;
    downloadButton.disabled=true;
    try {
      const response=await fetch(source);
      if(!response.ok) throw new Error(`Download failed: ${response.status}`);
      const objectURL=URL.createObjectURL(await response.blob());
      const link=document.createElement('a');
      link.href=objectURL;
      link.download=decodeURIComponent(new URL(source,location.href).pathname.split('/').pop()||'media');
      document.body.append(link); link.click(); link.remove();
      setTimeout(()=>URL.revokeObjectURL(objectURL),1000);
    } catch(error) {
      console.error(error);
    } finally {
      downloadButton.disabled=!downloadSource();
    }
  }
  function lockPageScroll() {
    const html=document.documentElement, body=document.body;
    scrollLockStyles={
      htmlOverflow:html.style.overflow,
      htmlOverscrollBehavior:html.style.overscrollBehavior,
      bodyOverflow:body.style.overflow,
      bodyOverscrollBehavior:body.style.overscrollBehavior,
      bodyPaddingRight:body.style.paddingRight,
    };
    const scrollbarWidth=innerWidth-html.clientWidth;
    if(scrollbarWidth>0) {
      const currentPadding=parseFloat(getComputedStyle(body).paddingRight)||0;
      body.style.paddingRight=`${currentPadding+scrollbarWidth}px`;
    }
    html.style.overflow='hidden';
    html.style.overscrollBehavior='none';
    body.style.overflow='hidden';
    body.style.overscrollBehavior='none';
    html.classList.add('lightbox-scroll-lock');
  }
  function unlockPageScroll() {
    if(!scrollLockStyles) return;
    const html=document.documentElement, body=document.body;
    html.style.overflow=scrollLockStyles.htmlOverflow;
    html.style.overscrollBehavior=scrollLockStyles.htmlOverscrollBehavior;
    body.style.overflow=scrollLockStyles.bodyOverflow;
    body.style.overscrollBehavior=scrollLockStyles.bodyOverscrollBehavior;
    body.style.paddingRight=scrollLockStyles.bodyPaddingRight;
    html.classList.remove('lightbox-scroll-lock');
    scrollLockStyles=null;
  }
  function open(el) {
    if (state!=='closed') return;
    // Give moving surfaces a chance to ease to rest before the selected tile
    // leaves its layout slot. The tile's origin is still read in this frame.
    document.dispatchEvent(new CustomEvent('lightboxopen',{detail:{trigger:el}}));
    trigger=el; restoreTriggerFocus=true; savedScroll=scrollY; vw=innerWidth; vh=innerHeight;
    const group=el.closest('[data-group]');
    const items=group?[...group.querySelectorAll('[data-lightbox]')]:[el];
    index=items.indexOf(el); paging.set(index); dragX.set(0); dragY.set(0);
    // Read every origin before reparenting any item, so flex rows cannot reflow.
    // Temporarily remove carousel transforms to capture the actual layout slot;
    // this stays exact for any scale, rotation, or transform-origin setting.
    const origins=items.map(item=> {
      if(!item.dataset.carouselAngle) return rect(item);
      const transform=item.style.transform;
      item.style.transform='none';
      const origin=rect(item);
      item.style.transform=transform;
      return origin;
    });
    slides=items.map((item,i)=> {
      const o=origins[i], placeholder=document.createElement('div');
      placeholder.className='lb-placeholder';
      const isHero=item.classList.contains('media--hero');
      if(isHero) placeholder.classList.add('lb-placeholder--hero');
      else {
        const maxWidth=item.classList.contains('media--phone')?287:item.classList.contains('phone')?o.w:600;
        placeholder.style.width=`min(${maxWidth}px, calc(100vw - 40px))`;
      }
      placeholder.style.aspectRatio=`${o.w}/${o.h}`;
      item.before(placeholder);
      const wrap=document.createElement('div'); wrap.className='lb-slide';
      // Chromium tends to rasterize transformed carousel cards at their small
      // in-strip layout size, then enlarge that bitmap in the modal. Give the
      // native iteration screenshots a 3x surface and the framed carousel a 2x
      // surface so the modal scales a sharper layer instead of a thumbnail.
      const rasterScale=item.classList.contains('iteration-card')?3:item.classList.contains('phone')?2:1;
      const baseWidth=o.w*rasterScale, baseHeight=o.h*rasterScale;
      wrap.style.width=baseWidth+'px'; wrap.style.height=baseHeight+'px';
      const oldTabIndex=item.tabIndex, oldHidden=item.getAttribute('aria-hidden'), oldOpacity=item.style.opacity;
      const oldTransform=item.style.transform, oldAngle=parseFloat(item.dataset.carouselAngle)||0;
      const oldScale=parseFloat(item.dataset.carouselScale)||1;
      wrap.append(item); stage.append(wrap); item.classList.add('in-lb'); item.tabIndex=-1; item.removeAttribute('aria-hidden');
      item.style.opacity='1';
      item.querySelectorAll('video').forEach(v=>v.play().catch(()=>{}));
      return {el:item,placeholder,wrap,origin:o,base:{w:baseWidth,h:baseHeight},oldTabIndex,oldHidden,oldOpacity,oldTransform,oldAngle,oldScale,
        entrance:new Spring(0),entranceDelay:i===index?0:CONFIG.lightboxSiblingDelay,entranceStarted:false};
    });
    background.style.transformOrigin=`50% ${savedScroll+vh/2}px`;
    backgroundAriaHidden=background.getAttribute('aria-hidden');
    background.setAttribute('aria-hidden','true');
    // Desktop browsers may use either the root element or body as the scrolling
    // container, so lock both. Keep fixed-body positioning out of this path: it
    // makes mobile Safari rebuild the page for a frame when the lightbox closes.
    lockPageScroll();
    root.hidden=false; state='priming';
    progress.set(0); controls(); render(); root.focus({preventScroll:true}); tickers.add(tick);
    // Three painted frames were enough to cover the delayed material commit in
    // the physical-device recording without adding a perceptible modal pause.
    const beginOpening = frames => {
      if(state!=='priming') return;
      if(frames>0) return requestAnimationFrame(()=>beginOpening(frames-1));
      state='opening'; openingStartedAt=performance.now(); root.classList.add('is-open'); progress.to(1);
      for(const slide of slides) if(slide.entranceDelay===0) { slide.entranceStarted=true; slide.entrance.to(1); }
    };
    beginOpening(reducedMotion.matches?0:CONFIG.materialWarmupFrames);
  }
  function close({restoreFocus=true}={}) {
    if (state==='closed'||state==='closing') return;
    restoreTriggerFocus=restoreFocus;
    // The page is scaled while the lightbox is open, so read each live return
    // slot with that transform temporarily removed. This keeps the closing
    // destination aligned even if responsive layout changed while expanded.
    const backgroundTransform=background.style.transform;
    background.style.transform='';
    for(const slide of slides) {
      // Carousel mapping rotates/scales track children. The placeholder is only
      // a layout slot, so always measure it without any visual transform; using
      // its transformed bounds here applies the card transform twice at landing.
      const placeholderTransform=slide.placeholder.style.transform;
      slide.placeholder.style.transform='none';
      slide.origin=rect(slide.placeholder);
      slide.placeholder.style.transform=placeholderTransform;
    }
    background.style.transform=backgroundTransform;
    // The same progress spring reverses, preserving its position and velocity.
    closingTargets=slides.map(fit);
    // Continue from the amount already revealed; do not restore the blur first.
    closingBackgroundPresence=backgroundPresence();
    closingHoldUntil=0;
    state='closing'; pointer=null; progress.to(0);
    for(const slide of slides) slide.entrance.to(0);
    root.classList.remove('is-open');
  }
  function finish() {
    for (const s of slides) {
      s.placeholder.replaceWith(s.el); s.wrap.remove(); s.el.classList.remove('in-lb'); s.el.tabIndex=s.oldTabIndex;
      const savedOpacity=s.oldOpacity===''?1:clamp(parseFloat(s.oldOpacity),0,1);
      const easeAfterLanding=!reducedMotion.matches&&s.el.closest('[data-carousel]')&&savedOpacity<.999;
      if(easeAfterLanding) {
        s.el.style.opacity='1';
        carouselOpacityReturns.set(s.el,{start:performance.now(),duration:320});
      } else s.el.style.opacity=s.oldOpacity;
      s.el.style.transform=s.oldTransform;
      if(!reducedMotion.matches&&s.el.closest('[data-carousel]')) {
        carouselTransformReturns.set(s.el,{
          start:performance.now(), duration:220,
          angle:s.oldAngle, scale:s.oldScale,
        });
      }
      if(s.oldHidden!==null) s.el.setAttribute('aria-hidden',s.oldHidden);
    }
    slides=[]; root.hidden=true;
    if(backgroundAriaHidden===null) background.removeAttribute('aria-hidden');
    else background.setAttribute('aria-hidden',backgroundAriaHidden);
    Object.assign(background.style,{transform:'',transformOrigin:''});
    unlockPageScroll();
    tickers.delete(tick);
    // Escape is a dismissal gesture, not a request to return keyboard focus to
    // the media tile. Avoid reintroducing its focus-visible accent ring after
    // the lightbox has gone away. Pointer and button dismissals retain the
    // normal focus restoration behavior.
    // Restore focus while the lightbox still reports itself as closing. The
    // carousel's keyboard-focus handler must not recenter the strip during this
    // programmatic handoff.
    if(restoreTriggerFocus) trigger?.focus({preventScroll:true});
    state='closed';
    document.dispatchEvent(new Event('lightboxclose'));
  }
  function tick(dt) {
    progress.step(dt); paging.step(dt); dragX.step(dt); dragY.step(dt);
    for(const slide of slides) slide.entrance.step(dt);
    if(state==='opening') {
      const elapsed=(performance.now()-openingStartedAt)/1000;
      for(const slide of slides) {
        if(!slide.entranceStarted&&elapsed>=slide.entranceDelay) { slide.entranceStarted=true; slide.entrance.to(1); }
        if(slide.entrance.x>=1) slide.entrance.set(1);
      }
    }
    if(state==='closing') for(const slide of slides) if(slide.entrance.x<=0) slide.entrance.set(0);
    render();
    // Clamp at the first target crossing so the spring cannot bounce back into
    // view. Keep the composited slide in its exact slot for one short settling
    // beat before returning ownership to the moving carousel.
    if(state==='opening'&&progress.x>=1) progress.set(1);
    if(state==='closing'&&progress.x<=0) progress.set(0);
    if (state==='opening'&&progress.x===1&&slides.every(slide=>slide.entrance.x>=1)) {
      for(const slide of slides) slide.entrance.set(1); render(); state='open';
    }
    if (state==='closing'&&progress.x===0&&slides.every(slide=>slide.entrance.x<=0)) {
      render();
      if(!closingHoldUntil) closingHoldUntil=performance.now()+(reducedMotion.matches?0:CONFIG.carouselLandingHold*1000);
      if(performance.now()>=closingHoldUntil) finish();
    }
  }
  function go(to, velocity) {
    if (state==='closed'||state==='closing') return;
    index=clamp(to,0,slides.length-1); paging.to(index,velocity); controls();
  }
  closeButton.addEventListener('click',close);
  downloadButton.addEventListener('click',downloadCurrent);
  previous.addEventListener('click',()=>go(index-1)); next.addEventListener('click',()=>go(index+1));
  stage.addEventListener('pointerdown',e=> {
    if (pointer||e.button!==0||state==='closed'||state==='closing') return;
    if(state==='opening') for(const slide of slides) {
      slide.entranceStarted=true;
      slide.entrance.to(1);
    }
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),vx:0,vy:0,axis:null,base:paging.x,dx:dragX.x,dy:dragY.x,onSlide:!!e.target.closest('.lb-slide')};
    stage.setPointerCapture(e.pointerId);
    paging.set(paging.x); dragX.set(dragX.x); dragY.set(dragY.x);
  });
  stage.addEventListener('pointermove',e=> {
    if (!pointer||e.pointerId!==pointer.id) return;
    const p=pointer, dx=e.clientX-p.x, dy=e.clientY-p.y, now=performance.now(), dt=Math.max(1,now-p.time)/1000;
    p.vx=(e.clientX-p.lastX)/dt; p.vy=(e.clientY-p.lastY)/dt;
    p.lastX=e.clientX; p.lastY=e.clientY; p.time=now;
    if (!p.axis&&Math.hypot(dx,dy)>6) p.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
    if(p.axis==='x'&&slides.length>1) {
      const raw=p.base-dx/vw;
      paging.set(raw<0?raw*.25:raw>slides.length-1?slides.length-1+(raw-slides.length+1)*.25:raw);
    } else if(p.axis==='x') {
      dragX.set(p.dx+dx); dragY.set(p.dy+dy*.25);
    } else if(p.axis==='y') { dragY.set(p.dy+dy); dragX.set(p.dx+dx*.35); }
  });
  function endPointer(e) {
    if (!pointer||pointer.id!==e.pointerId) return;
    const p=pointer; pointer=null;
    const cancelled=e.type==='pointercancel', stale=performance.now()-p.time>100;
    const vx=stale?0:p.vx, vy=stale?0:p.vy;
    if (!p.axis&&!cancelled&&!p.onSlide) return close();
    if(p.axis==='x'&&slides.length>1) {
      const dx=p.lastX-p.x;
      const direction=cancelled?0:Math.abs(vx)>500?Math.sign(-vx):Math.abs(dx)>vw*.2?Math.sign(-dx):0;
      go(index+direction,-vx/vw);
    } else if(p.axis==='x'&&slides.length===1&&!cancelled&&(Math.abs(dragX.x)>110||Math.abs(vx)>900)) close();
    else if(p.axis==='y'&&!cancelled&&(Math.abs(dragY.x)>110||Math.abs(vy)>900)) close();
    else { dragX.to(0); dragY.to(0); }
  }
  stage.addEventListener('pointerup',endPointer); stage.addEventListener('pointercancel',endPointer);
  root.addEventListener('keydown',e=> {
    if(e.key==='Escape') { e.preventDefault(); close({restoreFocus:false}); }
    if(e.key==='ArrowRight') { e.preventDefault(); go(index+1); }
    if(e.key==='ArrowLeft') { e.preventDefault(); go(index-1); }
    if(e.key==='Tab') {
      const buttons=[...root.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled);
      const at=buttons.indexOf(document.activeElement);
      e.preventDefault();
      if(at<0) buttons[e.shiftKey?buttons.length-1:0].focus();
      else buttons[(at+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
    }
  });
  addEventListener('resize',()=> {
    vw=innerWidth; vh=innerHeight;
    if(state==='closed') return;
    // Re-read responsive return slots without the background scale.
    const transform=background.style.transform; background.style.transform='';
    for(const slide of slides) {
      const current=rect(slide.placeholder);
      // Base dimensions remain fixed for transform scaling; only return positions update.
      slide.origin=current;
    }
    background.style.transform=transform;
    background.style.transformOrigin=`50% ${savedScroll+vh/2}px`; render();
  });
  return {open,close,get state(){return state;}};
})();

function accessibleMedia(el,i) {
  el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-haspopup','dialog');
  if(!el.hasAttribute('aria-label')) {
    const caption=el.closest('figure')?.querySelector('figcaption')?.textContent;
    el.setAttribute('aria-label',`Expand ${caption || 'printed artwork'}${el.classList.contains('phone')?` ${i+1}`:''}`);
  }
  el.querySelectorAll('img').forEach(image=> { if(!image.alt) image.alt=''; image.draggable=false; });
  el.addEventListener('keydown',e=> {
    if(e.key==='Enter'||e.key===' ') { e.preventDefault(); lightbox.open(el); }
  });
}
document.querySelectorAll('[data-lightbox]').forEach((el,i)=> {
  accessibleMedia(el,i);
  if(!el.closest('[data-carousel]')) el.addEventListener('click',()=>lightbox.open(el));
});

function setupLightboxTuner() {
  const defaults={
    backdropColor:'#131015', backdropDim:.10, blur:16,
    saturation:140, brightness:82,
    dragRevealDistance:.5, dragMaxReduction:.85,
    pageScale:.96, response:.48, damping:.88, margin:64,
  };
  let stored={};
  try { stored=JSON.parse(localStorage.getItem('lightbox-tuning')||'{}'); } catch {}
  for(const [key,fallback] of Object.entries(defaults)) {
    const value=stored[key];
    if(typeof fallback==='number'&&Number.isFinite(value)) CONFIG[key]=value;
    if(typeof fallback==='string'&&/^#[0-9a-f]{6}$/i.test(value)) CONFIG[key]=value;
  }

  const panel=document.createElement('details');
  panel.className='lightbox-tuner';
  panel.innerHTML=`
    <summary>Lightbox tuning <span class="build-id">v16-material-prewarm</span></summary>
    <label>Backdrop <output></output><button class="setting-reset" type="button" data-reset="backdropColor" aria-label="Reset backdrop color" title="Reset backdrop color">↺</button><input name="backdropColor" type="color"></label>
    <label>Dim <output></output><button class="setting-reset" type="button" data-reset="backdropDim" aria-label="Reset dim" title="Reset dim">↺</button><input name="backdropDim" type="range" min="0" max="0.9" step="0.01"></label>
    <label>Blur <output></output><button class="setting-reset" type="button" data-reset="blur" aria-label="Reset blur" title="Reset blur">↺</button><input name="blur" type="range" min="0" max="40" step="1"></label>
    <label>Saturation <output></output><button class="setting-reset" type="button" data-reset="saturation" aria-label="Reset saturation" title="Reset saturation">↺</button><input name="saturation" type="range" min="80" max="200" step="1"></label>
    <label>Brightness <output></output><button class="setting-reset" type="button" data-reset="brightness" aria-label="Reset brightness" title="Reset brightness">↺</button><input name="brightness" type="range" min="50" max="120" step="1"></label>
    <label>Reveal distance <output></output><button class="setting-reset" type="button" data-reset="dragRevealDistance" aria-label="Reset reveal distance" title="Reset reveal distance">↺</button><input name="dragRevealDistance" type="range" min="0.2" max="1" step="0.05"></label>
    <label>Max reveal <output></output><button class="setting-reset" type="button" data-reset="dragMaxReduction" aria-label="Reset maximum reveal" title="Reset maximum reveal">↺</button><input name="dragMaxReduction" type="range" min="0" max="1" step="0.05"></label>
    <label>Page scale <output></output><button class="setting-reset" type="button" data-reset="pageScale" aria-label="Reset page scale" title="Reset page scale">↺</button><input name="pageScale" type="range" min="0.85" max="1" step="0.005"></label>
    <label>Response <output></output><button class="setting-reset" type="button" data-reset="response" aria-label="Reset response" title="Reset response">↺</button><input name="response" type="range" min="0.15" max="1.2" step="0.01"></label>
    <label>Damping <output></output><button class="setting-reset" type="button" data-reset="damping" aria-label="Reset damping" title="Reset damping">↺</button><input name="damping" type="range" min="0.35" max="1.3" step="0.01"></label>
    <label>Media margin <output></output><button class="setting-reset" type="button" data-reset="margin" aria-label="Reset media margin" title="Reset media margin">↺</button><input name="margin" type="range" min="0" max="80" step="1"></label>
    <p class="tuner-hint">Lower response is faster. Lower damping is bouncier.</p>
    <button class="tuner-reset" type="button">Reset</button>`;

  const values={
    backdropColor:{suffix:''}, backdropDim:{suffix:''}, blur:{suffix:' px'},
    saturation:{suffix:'%'}, brightness:{suffix:'%'},
    dragRevealDistance:{suffix:' vh'}, dragMaxReduction:{suffix:''},
    pageScale:{suffix:''}, response:{suffix:' s'}, damping:{suffix:''}, margin:{suffix:' px'},
  };
  function sync() {
    for(const [name,{suffix}] of Object.entries(values)) {
      const input=panel.querySelector(`[name="${name}"]`);
      input.value=CONFIG[name];
      input.closest('label').querySelector('output').value=`${CONFIG[name]}${suffix}`;
    }
    localStorage.setItem('lightbox-tuning',JSON.stringify(Object.fromEntries(
      Object.keys(defaults).map(key=>[key,CONFIG[key]])
    )));
  }
  panel.addEventListener('input',e=> {
    if(!(e.target.name in values)) return;
    CONFIG[e.target.name]=e.target.type==='color'?e.target.value:Number(e.target.value);
    sync();
  });
  panel.querySelector('.tuner-reset').addEventListener('click',()=> {
    Object.assign(CONFIG,defaults); sync();
  });
  panel.querySelectorAll('.setting-reset').forEach(button=>button.addEventListener('click',()=> {
    CONFIG[button.dataset.reset]=defaults[button.dataset.reset]; sync();
  }));
  document.body.append(panel); sync();
}
// Kept available for future local tuning, but hidden in the published experience.
const showLightboxTuner = false;
if (showLightboxTuner) setupLightboxTuner();

function setupCarouselTuner() {
  const stored=JSON.parse(localStorage.getItem('carousel-tuning')||'{}');
  if(stored.mode==='gradient'||stored.mode==='items') CONFIG.carouselFadeMode=stored.mode;
  if(Number.isFinite(stored.falloff)) CONFIG.carouselFadeFalloff=stored.falloff;
  if(Number.isFinite(stored.intensity)) CONFIG.carouselFadeIntensity=stored.intensity;
  if(Number.isFinite(stored.itemDropoff)) CONFIG.carouselItemDropoff=stored.itemDropoff;
  if(Number.isFinite(stored.itemMinOpacity)) CONFIG.carouselItemMinOpacity=stored.itemMinOpacity;
  if(Number.isFinite(stored.itemMaxOpacity)) CONFIG.carouselItemMaxOpacity=stored.itemMaxOpacity;
  if(Number.isFinite(stored.speed)) CONFIG.carouselSpeed=stored.speed;
  const panel=document.createElement('details');
  panel.className='carousel-tuner';
  panel.innerHTML=`
    <summary>Carousel tuning</summary>
    <div class="tuner-segments" role="group" aria-label="Carousel fade style">
      <button type="button" data-mode="gradient">Gradient</button>
      <button type="button" data-mode="items">Item fade</button>
    </div>
    <div data-controls="gradient">
      <label>Falloff <output></output><input name="falloff" type="range" min="40" max="320" step="5"></label>
      <label>Intensity <output></output><input name="intensity" type="range" min="0" max="1" step="0.01"></label>
    </div>
    <div data-controls="items">
      <label>Drop-off <output></output><input name="itemDropoff" type="range" min="120" max="900" step="10"></label>
      <label>Min opacity <output></output><input name="itemMinOpacity" type="range" min="0" max="1" step="0.01"></label>
      <label>Max opacity <output></output><input name="itemMaxOpacity" type="range" min="0" max="1" step="0.01"></label>
    </div>
    <label>Speed <output></output><input name="speed" type="range" min="0" max="100" step="1"></label>
    <button class="tuner-reset" type="button">Reset</button>`;
  const values={
    falloff:{key:'carouselFadeFalloff',suffix:' px'},
    intensity:{key:'carouselFadeIntensity',suffix:''},
    itemDropoff:{key:'carouselItemDropoff',suffix:' px'},
    itemMinOpacity:{key:'carouselItemMinOpacity',suffix:''},
    itemMaxOpacity:{key:'carouselItemMaxOpacity',suffix:''},
    speed:{key:'carouselSpeed',suffix:' px/s'},
  };
  function sync() {
    panel.querySelectorAll('[data-mode]').forEach(button=> {
      const selected=button.dataset.mode===CONFIG.carouselFadeMode;
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',selected);
    });
    panel.querySelectorAll('[data-controls]').forEach(group=> {
      group.hidden=group.dataset.controls!==CONFIG.carouselFadeMode;
    });
    for(const [name,{key,suffix}] of Object.entries(values)) {
      const input=panel.querySelector(`[name="${name}"]`);
      input.value=CONFIG[key]; input.previousElementSibling.value=`${CONFIG[key]}${suffix}`;
    }
    localStorage.setItem('carousel-tuning',JSON.stringify({
      falloff:CONFIG.carouselFadeFalloff,
      intensity:CONFIG.carouselFadeIntensity,
      mode:CONFIG.carouselFadeMode,
      itemDropoff:CONFIG.carouselItemDropoff,
      itemMinOpacity:CONFIG.carouselItemMinOpacity,
      itemMaxOpacity:CONFIG.carouselItemMaxOpacity,
      speed:CONFIG.carouselSpeed,
    }));
  }
  panel.addEventListener('input',e=> {
    const setting=values[e.target.name]; if(!setting) return;
    CONFIG[setting.key]=Number(e.target.value); sync();
  });
  panel.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=> {
    CONFIG.carouselFadeMode=button.dataset.mode; sync();
  }));
  panel.querySelector('.tuner-reset').addEventListener('click',()=> {
    CONFIG.carouselFadeFalloff=150; CONFIG.carouselFadeIntensity=.82; CONFIG.carouselSpeed=36;
    CONFIG.carouselFadeMode='gradient'; CONFIG.carouselItemDropoff=430;
    CONFIG.carouselItemMinOpacity=.18; CONFIG.carouselItemMaxOpacity=1; sync();
  });
  document.body.append(panel); sync();
}
// Keep setupCarouselTuner available for future visual tuning, but ship without
// exposing the panel. The selected values above are now the production defaults.

function setupIterationCarouselTuner() {
  const query=new URLSearchParams(location.search);
  const host=location.hostname;
  const isLocalHost=location.protocol==='file:' || host==='localhost' || host==='127.0.0.1' ||
    host==='::1' || host.endsWith('.local') || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if(!isLocalHost || !query.has('tune')) return;
  const isMobile=mobileCarouselLayout.matches;
  const defaults={
    iterationSpeed:49, iterationTiltAngle:8, iterationMappingRange:.5,
    iterationCenterScale:1, iterationEdgeScale:.86, iterationGap:33,
    iterationAnchorX:50, iterationAnchorY:100,
    iterationFadeDistance:860, iterationMinOpacity:.21,
    mobileIterationTiltAngle:10, mobileIterationMappingRange:1,
    mobileIterationCenterScale:1, mobileIterationEdgeScale:.82,
    mobileIterationGap:26,
    mobileIterationAnchorX:50, mobileIterationAnchorY:67,
  };
  try {
    const stored=JSON.parse(localStorage.getItem('iteration-carousel-tuning')||'{}');
    for(const [key,fallback] of Object.entries(defaults)) {
      if(Number.isFinite(stored[key])) CONFIG[key]=stored[key];
      else if(!Number.isFinite(CONFIG[key])) CONFIG[key]=fallback;
    }
  } catch {}

  const panel=document.createElement('details');
  panel.className='carousel-tuner mapped-carousel-tuner';
  panel.open=true;
  panel.innerHTML=`
    <summary>Carousel motion</summary>
    <p class="tuner-hint">${isMobile?'Mobile':'Desktop'} values · applies to both carousels · persists here.</p>
    <div class="tuner-section"><strong>Motion</strong>
      <label>Speed <output></output><button class="setting-reset" type="button" data-reset="iterationSpeed" aria-label="Reset speed" title="Reset speed">↺</button><input name="iterationSpeed" type="range" min="0" max="100" step="1"></label>
      <label>Rotation range <output></output><button class="setting-reset" type="button" data-reset="iterationTiltAngle" aria-label="Reset rotation range" title="Reset rotation range">↺</button><input name="iterationTiltAngle" type="range" min="0" max="20" step="0.5"></label>
      <label>Mapping distance <output></output><button class="setting-reset" type="button" data-reset="iterationMappingRange" aria-label="Reset mapping distance" title="Reset mapping distance">↺</button><input name="iterationMappingRange" type="range" min="0.25" max="1" step="0.05"></label>
    </div>
    <div class="tuner-section"><strong>Scale</strong>
      <label>Center scale <output></output><button class="setting-reset" type="button" data-reset="iterationCenterScale" aria-label="Reset center scale" title="Reset center scale">↺</button><input name="iterationCenterScale" type="range" min="0.7" max="1.15" step="0.01"></label>
      <label>Edge scale <output></output><button class="setting-reset" type="button" data-reset="iterationEdgeScale" aria-label="Reset edge scale" title="Reset edge scale">↺</button><input name="iterationEdgeScale" type="range" min="0.7" max="1.15" step="0.01"></label>
    </div>
    <div class="tuner-section"><strong>Layout</strong>
      <label>Spacing <output></output><button class="setting-reset" type="button" data-reset="iterationGap" aria-label="Reset spacing" title="Reset spacing">↺</button><input name="iterationGap" type="range" min="16" max="100" step="1"></label>
      <label>Anchor X <output></output><button class="setting-reset" type="button" data-reset="iterationAnchorX" aria-label="Reset horizontal anchor" title="Reset horizontal anchor">↺</button><input name="iterationAnchorX" type="range" min="0" max="100" step="1"></label>
      <label>Anchor Y <output></output><button class="setting-reset" type="button" data-reset="iterationAnchorY" aria-label="Reset vertical anchor" title="Reset vertical anchor">↺</button><input name="iterationAnchorY" type="range" min="0" max="100" step="1"></label>
      <div class="tuner-segments tuner-segments--three" role="group" aria-label="Horizontal anchor preset">
        <button type="button" data-anchor-x="0">Left</button>
        <button type="button" data-anchor-x="50">Center</button>
        <button type="button" data-anchor-x="100">Right</button>
      </div>
      <div class="tuner-segments tuner-segments--three" role="group" aria-label="Vertical anchor preset">
        <button type="button" data-anchor-y="0">Top</button>
        <button type="button" data-anchor-y="50">Middle</button>
        <button type="button" data-anchor-y="100">Bottom</button>
      </div>
    </div>
    <div class="tuner-section"><strong>Fade</strong>
      <label>Fade distance <output></output><button class="setting-reset" type="button" data-reset="iterationFadeDistance" aria-label="Reset fade distance" title="Reset fade distance">↺</button><input name="iterationFadeDistance" type="range" min="160" max="1200" step="10"></label>
      <label>Minimum opacity <output></output><button class="setting-reset" type="button" data-reset="iterationMinOpacity" aria-label="Reset minimum opacity" title="Reset minimum opacity">↺</button><input name="iterationMinOpacity" type="range" min="0" max="1" step="0.01"></label>
    </div>
    <button class="tuner-reset" type="button">Reset defaults</button>`;

  const values={
    iterationSpeed:' px/s', iterationTiltAngle:'°', iterationMappingRange:'× viewport',
    iterationCenterScale:'×', iterationEdgeScale:'×', iterationGap:' px',
    iterationAnchorX:'%', iterationAnchorY:'%', iterationFadeDistance:' px', iterationMinOpacity:'',
  };
  const mobileAliases={
    iterationTiltAngle:'mobileIterationTiltAngle',
    iterationMappingRange:'mobileIterationMappingRange',
    iterationCenterScale:'mobileIterationCenterScale',
    iterationEdgeScale:'mobileIterationEdgeScale',
    iterationGap:'mobileIterationGap',
    iterationAnchorX:'mobileIterationAnchorX',
    iterationAnchorY:'mobileIterationAnchorY',
  };
  const anchorXKey=isMobile?'mobileIterationAnchorX':'iterationAnchorX';
  const anchorYKey=isMobile?'mobileIterationAnchorY':'iterationAnchorY';
  if(isMobile) for(const [name,key] of Object.entries(mobileAliases)) {
    panel.querySelector(`[name="${name}"]`).dataset.configKey=key;
    panel.querySelector(`[data-reset="${name}"]`).dataset.reset=key;
  }
  function sync({notify=true}={}) {
    for(const [name,suffix] of Object.entries(values)) {
      const input=panel.querySelector(`[name="${name}"]`);
      const key=input.dataset.configKey||name;
      input.value=CONFIG[key];
      const output=input.closest('label').querySelector('output');
      output.value=output.textContent=`${CONFIG[key]}${suffix}`;
    }
    panel.querySelectorAll('[data-anchor-y]').forEach(button=> {
      const selected=Number(button.dataset.anchorY)===CONFIG[anchorYKey];
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',selected);
    });
    panel.querySelectorAll('[data-anchor-x]').forEach(button=> {
      const selected=Number(button.dataset.anchorX)===CONFIG[anchorXKey];
      button.classList.toggle('is-selected',selected);
      button.setAttribute('aria-pressed',selected);
    });
    document.querySelectorAll('[data-carousel] .carousel-track').forEach(track=> {
      track.style.setProperty('--carousel-gap',`${CONFIG.iterationGap}px`);
      track.style.setProperty('--carousel-mobile-gap',`${CONFIG.mobileIterationGap}px`);
    });
    localStorage.setItem('iteration-carousel-tuning',JSON.stringify(
      Object.fromEntries(Object.keys(defaults).map(key=>[key,CONFIG[key]]))
    ));
    if(notify) document.dispatchEvent(new Event('iterationcarouseltuning'));
  }
  panel.addEventListener('input',event=> {
    if(!(event.target.name in values)) return;
    CONFIG[event.target.dataset.configKey||event.target.name]=Number(event.target.value); sync();
  });
  panel.querySelectorAll('[data-anchor-y]').forEach(button=>button.addEventListener('click',()=> {
    CONFIG[anchorYKey]=Number(button.dataset.anchorY); sync();
  }));
  panel.querySelectorAll('[data-anchor-x]').forEach(button=>button.addEventListener('click',()=> {
    CONFIG[anchorXKey]=Number(button.dataset.anchorX); sync();
  }));
  panel.querySelectorAll('.setting-reset').forEach(button=>button.addEventListener('click',()=> {
    CONFIG[button.dataset.reset]=defaults[button.dataset.reset]; sync();
  }));
  panel.querySelector('.tuner-reset').addEventListener('click',()=> {Object.assign(CONFIG,defaults);sync();});
  document.body.append(panel); sync({notify:false});
}
setupIterationCarouselTuner();

// Pointer-driven infinite strip. Velocity decays exponentially towards the
// ambient drift, so even a fling in the opposite direction rejoins smoothly.
document.querySelectorAll('[data-carousel]').forEach(carousel=> {
  const track=carousel.querySelector('.carousel-track'), originals=[...track.children];
  const mapsWithPosition=true;
  let width=0,x=0,velocity=-CONFIG.iterationSpeed,drag=null,visible=false,needsMeasure=false;
  let pausedByLightbox=false;
  function measure() {
    if(lightbox.state!=='closed') {needsMeasure=true;return;}
    needsMeasure=false;
    track.querySelectorAll('[data-clone]').forEach(el=>el.remove());
    const gap=parseFloat(getComputedStyle(track).gap)||0;
    width=originals.reduce((sum,el)=>sum+(mapsWithPosition?el.offsetWidth:el.getBoundingClientRect().width)+gap,0);
    const sets=Math.ceil(carousel.clientWidth/Math.max(1,width))+2;
    for(let i=1;i<sets;i++) originals.forEach((el,j)=> {
      const clone=el.cloneNode(true); clone.dataset.clone='true'; clone.tabIndex=-1;
      clone.setAttribute('aria-hidden','true'); clone.removeAttribute('role');
      track.append(clone); geometry.observe(clone);
    });
    wrap(); render();
  }
  function wrap() {if(width) x=((x%width)-width)%width;}
  function render() {
    track.style.transform=`translate3d(${x}px,0,0)`;
    const falloff=Math.max(1,CONFIG.carouselFadeFalloff), intensity=CONFIG.carouselFadeIntensity;
    for(const item of track.children) {
      // Lightbox placeholders preserve layout only. Mapping them like cards
      // corrupts the return-slot geometry and creates a snap at handoff.
      if(item.classList.contains('lb-placeholder')) {
        item.style.transform='none';
        item.style.opacity='0';
        continue;
      }
      const center=item.offsetLeft+x+item.offsetWidth/2;
      if(mapsWithPosition) {
        const isMobile=mobileCarouselLayout.matches;
        const mappingRange=isMobile?CONFIG.mobileIterationMappingRange:CONFIG.iterationMappingRange;
        const tiltAngle=isMobile?CONFIG.mobileIterationTiltAngle:CONFIG.iterationTiltAngle;
        const centerScale=isMobile?CONFIG.mobileIterationCenterScale:CONFIG.iterationCenterScale;
        const edgeScale=isMobile?CONFIG.mobileIterationEdgeScale:CONFIG.iterationEdgeScale;
        const anchorX=isMobile?CONFIG.mobileIterationAnchorX:CONFIG.iterationAnchorX;
        const anchorY=isMobile?CONFIG.mobileIterationAnchorY:CONFIG.iterationAnchorY;
        const mappingDistance=Math.max(1,carousel.clientWidth*mappingRange);
        const position=clamp((center-carousel.clientWidth/2)/mappingDistance,-1,1);
        const distance=Math.abs(position), easedDistance=distance*distance*(3-2*distance);
        const targetAngle=position*tiltAngle;
        const targetScale=mix(centerScale,edgeScale,easedDistance);
        const transformReturn=carouselTransformReturns.get(item);
        let angle=targetAngle, scale=targetScale;
        if(transformReturn) {
          const returnProgress=clamp((performance.now()-transformReturn.start)/transformReturn.duration,0,1);
          const easedReturn=1-Math.pow(1-returnProgress,3);
          angle=mix(transformReturn.angle,targetAngle,easedReturn);
          scale=mix(transformReturn.scale,targetScale,easedReturn);
          if(returnProgress===1) carouselTransformReturns.delete(item);
        }
        item.style.transformOrigin=`${anchorX}% ${anchorY}%`;
        item.style.transform=`rotate(${angle}deg) scale(${scale})`;
        item.dataset.carouselAngle=angle;
        item.dataset.carouselScale=scale;
      }
      const edgeDistance=Math.min(center,carousel.clientWidth-center);
      const itemDropoff=mapsWithPosition?CONFIG.iterationFadeDistance:CONFIG.carouselItemDropoff;
      const itemMinOpacity=mapsWithPosition?CONFIG.iterationMinOpacity:CONFIG.carouselItemMinOpacity;
      const t=CONFIG.carouselFadeMode==='items'
        ? clamp(1-Math.abs(center-carousel.clientWidth/2)/Math.max(1,itemDropoff),0,1)
        : clamp(edgeDistance/falloff,0,1);
      const eased=t*t*(3-2*t);
      const targetOpacity=CONFIG.carouselFadeMode==='items'
        ? mix(itemMinOpacity,CONFIG.carouselItemMaxOpacity,eased)
        : 1-intensity*(1-eased);
      const opacityReturn=carouselOpacityReturns.get(item);
      if(opacityReturn) {
        const returnProgress=clamp((performance.now()-opacityReturn.start)/opacityReturn.duration,0,1);
        const easedReturn=returnProgress*returnProgress*(3-2*returnProgress);
        item.style.opacity=mix(1,targetOpacity,easedReturn);
        if(returnProgress===1) carouselOpacityReturns.delete(item);
      } else item.style.opacity=targetOpacity;
    }
  }
  let measureFrame=0;
  const scheduleMeasure=()=> {
    if(measureFrame) return;
    measureFrame=requestAnimationFrame(()=> {measureFrame=0;measure();});
  };
  measure(); new ResizeObserver(scheduleMeasure).observe(carousel);
  document.addEventListener('iterationcarouseltuning',measure);
  document.addEventListener('lightboxopen',()=> {
    pausedByLightbox=true;
    // Freeze the return slot at the exact position used to open the lightbox.
    // On close, the normal velocity easing resumes from rest into ambient drift.
    velocity=0;
  });
  document.addEventListener('lightboxclose',()=> {
    pausedByLightbox=false;
    if(needsMeasure) measure();
  });
  new IntersectionObserver(([entry])=>visible=entry.isIntersecting).observe(carousel);
  tickers.add(dt=> {
    if(drag||reducedMotion.matches||(!visible&&!pausedByLightbox)) return;
    const resting=pausedByLightbox||!!carousel.querySelector(':focus-visible');
    const target=resting?0:-CONFIG.iterationSpeed;
    const tau=resting?CONFIG.carouselPauseTau:CONFIG.carouselResumeTau;
    velocity=target+(velocity-target)*Math.exp(-dt/tau);
    if(resting&&Math.abs(velocity)<.05) velocity=0;
    x+=velocity*dt; wrap(); render();
  });
  carousel.addEventListener('pointerdown',e=> {
    if(drag||e.button!==0||lightbox.state!=='closed') return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:x,last:e.clientX,time:performance.now(),velocity:0,moved:false,target:e.target.closest('.phone')};
    carousel.setPointerCapture(e.pointerId);
  });
  carousel.addEventListener('pointermove',e=> {
    if(!drag||drag.id!==e.pointerId) return;
    const dx=e.clientX-drag.x, now=performance.now();
    if(Math.abs(dx)>6) {drag.moved=true;carousel.classList.add('is-dragging');}
    if(!drag.moved) return;
    drag.velocity=(e.clientX-drag.last)/Math.max(1,now-drag.time)*1000;
    drag.time=now;drag.last=e.clientX;
    x=drag.start+dx;wrap();render();
  });
  function end(e) {
    if(!drag||drag.id!==e.pointerId) return;
    const p=drag;drag=null;carousel.classList.remove('is-dragging');
    if(e.type==='pointercancel') {velocity=0;return;}
    // A tap must preserve the strip's current velocity so the lightbox-open
    // lifecycle can ease it down. Only an actual drag supplies new momentum.
    if(p.moved) velocity=performance.now()-p.time>100?0:clamp(p.velocity,-5000,5000);
    if(!p.moved&&p.target) lightbox.open(p.target);
  }
  carousel.addEventListener('pointerup',end); carousel.addEventListener('pointercancel',end);
  // Clones stay mouse/touch accessible; the original sequence is the keyboard path.
  carousel.addEventListener('focusin',e=> {
    const at=originals.indexOf(e.target);
    if(at<0||lightbox.state!=='closed'||!e.target.matches(':focus-visible')) return;
    const gap=parseFloat(getComputedStyle(track).gap)||0;
    x=Math.min(0,-(at*(originals[at].offsetWidth+gap))+Math.max(0,(carousel.clientWidth-originals[at].offsetWidth)/2));
    render();
  });
});
