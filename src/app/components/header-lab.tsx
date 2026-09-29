import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, RotateCcw } from 'lucide-react';
import './header-lab.css';

type HeaderView = 'work' | 'writing';

type ViewportPreset = {
  label: string;
  width: number;
  height: number;
};

type HeaderIntent = {
  surfaceHeight: number;
  logoY: number;
  linksY: number;
  note: string;
};

type SavedHeaderIntents = Record<string, HeaderIntent>;

const STORAGE_KEY = 'ben-header-lab-v1';

const VIEWPORTS: ViewportPreset[] = [
  { label: '27-inch desktop', width: 2560, height: 1440 },
  { label: 'Desktop', width: 1920, height: 1080 },
  { label: 'Large laptop', width: 1440, height: 900 },
  { label: 'Laptop', width: 1280, height: 800 },
  { label: 'Tablet landscape', width: 1024, height: 768 },
  { label: 'Tablet portrait', width: 768, height: 1024 },
  { label: 'iPhone 17', width: 402, height: 874 },
];

const PROJECTS = [
  'Meta Reality Labs',
  'Fellow Products',
  'Ghost Autonomy',
  'General Collaboration',
  'Sutter Hill Ventures',
  'Lyft',
  'Twitter',
  'Periscope',
];

function customViewport(width: number): ViewportPreset {
  const snapped = VIEWPORTS.find((preset) => Math.abs(preset.width - width) <= 10);
  if (snapped) return snapped;
  const height = width < 768
    ? 874
    : width <= 768
      ? 1024
      : width <= 1024
        ? 768
        : width <= 1280
          ? 800
          : width <= 1440
            ? 900
            : width <= 1920
              ? 1080
              : 1440;
  return { label: 'Custom', width, height };
}

function intentKey(width: number, height: number, view: HeaderView) {
  return `${width}x${height}:${view}`;
}

function defaultsFor(width: number, view: HeaderView): HeaderIntent {
  const mobile = width < 768;
  if (mobile) {
    return view === 'work'
      ? { surfaceHeight: 136, logoY: 0, linksY: 0, note: '' }
      : { surfaceHeight: 84, logoY: 0, linksY: 0, note: '' };
  }

  const top = width >= 1536 ? 46 : width >= 1280 ? 33 : width >= 1024 ? 20 : 14;
  const workHeight = width >= 1280 ? 201 - (46 - top) : width >= 1024 ? 158 : 163;
  const writingHeight = width >= 1536 ? 67 : width >= 1280 ? 63 : width >= 1024 ? 55 : 46;
  return view === 'work'
    ? {
        surfaceHeight: workHeight,
        logoY: 0,
        linksY: 0,
        note: '',
      }
    : { surfaceHeight: writingHeight, logoY: 0, linksY: 0, note: '' };
}

function loadSaved(): SavedHeaderIntents {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function RangeControl({
  label,
  description,
  value,
  defaultValue,
  min,
  max,
  onChange,
  onReset,
}: {
  label: string;
  description: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <label className="header-lab-control">
      <span className="header-lab-control-topline">
        <span>{label}</span>
        <span className="header-lab-control-actions">
          <button
            aria-label={`Reset ${label.toLowerCase()} to ${defaultValue} pixels`}
            className="header-lab-control-reset"
            disabled={value === defaultValue}
            onClick={(event) => {
              event.preventDefault();
              onReset();
            }}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={12} />
            Reset
          </button>
          <span className="header-lab-number-wrap">
            <input
              aria-label={`${label} in pixels`}
              className="header-lab-number"
              max={max}
              min={min}
              onChange={(event) => onChange(Number(event.target.value))}
              type="number"
              value={value}
            />
            <span>px</span>
          </span>
        </span>
      </span>
      <span className="header-lab-control-description">{description}</span>
      <input
        aria-label={label}
        className="header-lab-range"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
    </label>
  );
}

function HeaderPreview({
  viewport,
  view,
  intent,
  guides,
}: {
  viewport: ViewportPreset;
  view: HeaderView;
  intent: HeaderIntent;
  guides: boolean;
}) {
  const width = viewport.width;
  const mobile = width < 768;
  const paddingX = mobile ? 24 : width >= 1280 ? 31.5 : width >= 1024 ? 24.5 : 17.5;
  const titleSize = mobile ? 22 : width >= 1280 ? 30 : width >= 1024 ? 25 : 20;
  const navSize = mobile ? 22 : width >= 1280 ? 24 : width >= 1024 ? 20 : 16;
  const letterSpacing = mobile ? -0.99 : width >= 1280 ? -1.46 : width >= 1024 ? -1.21 : -1;
  const signatureWidth = mobile ? 122 : width >= 1280 ? 213 : width >= 1024 ? 177 : 142;
  const signatureHeight = mobile ? 24 : width >= 1280 ? 43 : width >= 1024 ? 35 : 28;
  const baseTop = view === 'writing'
    ? mobile
      ? 30
      : width >= 1536
        ? 16
        : width >= 1024
          ? 12
          : 10
    : mobile
      ? 36
      : width >= 1536
        ? 46
        : width >= 1280
          ? 33
          : width >= 1024
            ? 20
            : 14;
  const linksTop = view === 'writing'
    ? mobile
      ? -5.5
      : width >= 1536
        ? 17
        : width >= 1280
          ? 13
          : width >= 1024
            ? 12.5
            : 10.5
    : mobile
      ? 16
      : baseTop + (width >= 1280 ? 25 : width >= 1024 ? 20 : 16.5);
  const chipSize = mobile ? 14 : width >= 1280 ? 16.6 : width >= 1024 ? 14.8 : 13.6;
  const chipTop = mobile ? 140 : width >= 1280 ? baseTop + 99 : width >= 1024 ? 104 : 82;
  const contentTop = view === 'writing'
    ? intent.surfaceHeight + (mobile ? 0 : 24)
    : Math.max(intent.surfaceHeight, mobile ? 188 : 230);

  return (
    <div
      className={`header-lab-viewport ${guides ? 'is-guided' : ''}`}
      style={{ width: viewport.width, height: viewport.height }}
    >
      <div
        className={`header-lab-site-content is-${view} ${mobile ? 'is-mobile' : ''}`}
        style={{ top: contentTop }}
      >
        {view === 'work' ? (
          <>
            <div className="header-lab-placeholder-card" />
            <div className="header-lab-placeholder-media" />
          </>
        ) : (
          <div className="header-lab-writing-column">
            <div
              className="header-lab-writing-hero"
              style={{ width: Math.min(900, viewport.width - (mobile ? 48 : 118)) }}
            >
              <img
                alt="Writing hero preview"
                src="/writing/site-codex/Assets/figma/hero-original.png"
              />
            </div>
            <div className="header-lab-writing-copy">
              <div className="header-lab-writing-title" />
              <div className="header-lab-writing-date" />
              <div className="header-lab-writing-summary" />
            </div>
          </div>
        )}
      </div>

      <header className="header-lab-surface" style={{ height: intent.surfaceHeight }}>
        {guides && (
          <div className="header-lab-surface-label">white surface · {intent.surfaceHeight}px</div>
        )}

        <div
          className="header-lab-identity"
          style={{
            left: paddingX,
            top: baseTop + intent.logoY,
            fontSize: titleSize,
            letterSpacing,
          }}
        >
          {view === 'work' && <span>My name is</span>}
          <img
            alt="Ben Suarez"
            className="header-lab-signature"
            src="/images/bensuarez-name.png"
            style={{ width: view === 'writing' ? signatureWidth * 0.76 : signatureWidth, height: view === 'writing' ? signatureHeight * 0.76 : signatureHeight }}
          />
          {view === 'work' && (
            <span className="header-lab-location">
              I&apos;m a designer living in {mobile ? 'SF' : 'San Francisco'}.
            </span>
          )}
        </div>

        <nav
          aria-label="Preview links"
          className={`header-lab-links ${mobile ? 'is-mobile' : ''}`}
          style={{
            right: mobile ? 24 : paddingX,
            top: linksTop + intent.linksY,
            fontSize: navSize,
            letterSpacing,
          }}
        >
          <span>{view === 'work' ? 'Writing' : 'Work'}</span>
          <span>{mobile ? 'Contact' : 'Email'}</span>
        </nav>

        {view === 'work' && (
          <div className="header-lab-chips" style={{ left: paddingX, right: paddingX, top: chipTop }}>
            {PROJECTS.map((project, index) => (
              <span
                className={index === 0 ? 'is-active' : ''}
                key={project}
                style={{ fontSize: chipSize }}
              >
                {project}
              </span>
            ))}
          </div>
        )}

      </header>
    </div>
  );
}

export function HeaderLab() {
  const [viewport, setViewport] = useState(VIEWPORTS[2]);
  const [view, setView] = useState<HeaderView>('work');
  const [saved, setSaved] = useState<SavedHeaderIntents>(loadSaved);
  const [guides, setGuides] = useState(true);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });

  const key = intentKey(viewport.width, viewport.height, view);
  const defaultIntent = defaultsFor(viewport.width, view);
  const intent = saved[key] ?? defaultIntent;

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const scale = useMemo(
    () => Math.min(1, (stageSize.width - 64) / viewport.width, (stageSize.height - 64) / viewport.height),
    [stageSize, viewport]
  );

  const updateIntent = (patch: Partial<HeaderIntent>) => {
    setSaved((current) => ({
      ...current,
      [key]: { ...(current[key] ?? defaultsFor(viewport.width, view)), ...patch },
    }));
  };

  const resetCurrent = () => {
    setSaved((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const copyFeedback = async () => {
    const payload = {
      selected: { viewport, view },
      currentIntent: intent,
      allSavedIntents: saved,
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="header-lab-shell">
      <aside className="header-lab-sidebar">
        <div className="header-lab-heading">
          <div>
            <p className="header-lab-eyebrow">Sandbox</p>
            <h1>Header lab</h1>
          </div>
          <button className="header-lab-icon-button" onClick={resetCurrent} title="Reset this viewport">
            <RotateCcw aria-hidden="true" size={16} />
          </button>
        </div>
        <p className="header-lab-intro">
          Tune the intention here. Nothing on the live site changes until these values are implemented.
        </p>

        <section className="header-lab-section">
          <p className="header-lab-section-title">Preview</p>
          <label className="header-lab-field">
            <span>Viewport</span>
            <select
              onChange={(event) => setViewport(VIEWPORTS[Number(event.target.value)])}
              value={VIEWPORTS.indexOf(viewport)}
            >
              {VIEWPORTS.indexOf(viewport) === -1 && (
                <option value={-1}>Custom · {viewport.width} × {viewport.height}</option>
              )}
              {VIEWPORTS.map((item, index) => (
                <option key={item.label} value={index}>
                  {item.label} · {item.width} × {item.height}
                </option>
              ))}
            </select>
          </label>
          <label className="header-lab-width-control">
            <span>
              <span>Viewport width</span>
              <span>{viewport.width}px</span>
            </span>
            <input
              aria-label="Viewport width"
              max={2560}
              min={320}
              onChange={(event) => setViewport(customViewport(Number(event.target.value)))}
              step={1}
              type="range"
              value={viewport.width}
            />
            <small>Snaps within 10px of a named viewport.</small>
          </label>
          <div className="header-lab-segmented" role="group" aria-label="Header page">
            {(['work', 'writing'] as HeaderView[]).map((item) => (
              <button
                aria-pressed={view === item}
                className={view === item ? 'is-active' : ''}
                key={item}
                onClick={() => setView(item)}
              >
                {item === 'work' ? 'Work' : 'Writing'}
              </button>
            ))}
          </div>
          <label className="header-lab-guide-toggle">
            <input checked={guides} onChange={(event) => setGuides(event.target.checked)} type="checkbox" />
            <span>Show measurement guides</span>
          </label>
        </section>

        <section className="header-lab-section">
          <p className="header-lab-section-title">Intent controls</p>
          <RangeControl
            defaultValue={defaultIntent.surfaceHeight}
            description="The full white header surface before page content begins."
            label="White surface height"
            max={320}
            min={44}
            onChange={(surfaceHeight) => updateIntent({ surfaceHeight })}
            onReset={() => updateIntent({ surfaceHeight: defaultIntent.surfaceHeight })}
            value={intent.surfaceHeight}
          />
          <RangeControl
            defaultValue={defaultIntent.logoY}
            description="Moves the signature/identity group without changing its layout."
            label="Logo vertical offset"
            max={100}
            min={-100}
            onChange={(logoY) => updateIntent({ logoY })}
            onReset={() => updateIntent({ logoY: defaultIntent.logoY })}
            value={intent.logoY}
          />
          <RangeControl
            defaultValue={defaultIntent.linksY}
            description="Moves Writing/Work and Email/Contact together."
            label="Links vertical offset"
            max={100}
            min={-100}
            onChange={(linksY) => updateIntent({ linksY })}
            onReset={() => updateIntent({ linksY: defaultIntent.linksY })}
            value={intent.linksY}
          />
        </section>

        <section className="header-lab-section header-lab-notes-section">
          <label className="header-lab-field">
            <span>Note for this viewport</span>
            <textarea
              onChange={(event) => updateIntent({ note: event.target.value })}
              placeholder="Example: keep the logo here, but make the white bar feel 12px tighter."
              value={intent.note}
            />
          </label>
        </section>

        <button className="header-lab-copy-button" onClick={copyFeedback}>
          {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
          {copied ? 'Copied feedback' : 'Copy feedback JSON'}
        </button>
      </aside>

      <section className="header-lab-stage" ref={stageRef}>
        <div className="header-lab-stage-meta">
          <span>{viewport.width} × {viewport.height}</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>
        <div className="header-lab-stage-center">
          <div
            className="header-lab-scaled-preview"
            style={{
              width: viewport.width * scale,
              height: viewport.height * scale,
            }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <HeaderPreview guides={guides} intent={intent} view={view} viewport={viewport} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
