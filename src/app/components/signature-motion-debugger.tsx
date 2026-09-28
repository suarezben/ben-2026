import type { SignatureMotionSettings } from '../lib/signature-motion-settings';

type NumericSetting = {
  [Key in keyof SignatureMotionSettings]: SignatureMotionSettings[Key] extends number
    ? Key
    : never;
}[keyof SignatureMotionSettings];

type Control = {
  key: NumericSetting;
  label: string;
  min: number;
  max: number;
  step: number;
};

export function SignatureMotionDebugger({
  settings,
  isMobile,
  onChange,
  onReset,
  onReplay,
}: {
  settings: SignatureMotionSettings;
  isMobile: boolean;
  onChange: (next: SignatureMotionSettings) => void;
  onReset: () => void;
  onReplay: () => void;
}) {
  const sections: { label: string; controls: Control[] }[] = [
    {
      label: 'Into Writing',
      controls: [
        { key: 'inDelayMs', label: 'Delay', min: 0, max: 250, step: 10 },
        { key: 'anticipationPx', label: 'Anticipation', min: 0, max: 40, step: 1 },
        { key: 'anticipationMs', label: 'Wind-up', min: 40, max: 240, step: 10 },
        { key: 'inStiffness', label: 'Stiffness', min: 50, max: 600, step: 10 },
        { key: 'inDamping', label: 'Damping', min: 5, max: 60, step: 1 },
        { key: 'inMass', label: 'Mass', min: 0.2, max: 2, step: 0.01 },
      ],
    },
    {
      label: 'Back to Work',
      controls: [
        { key: 'outDelayMs', label: 'Text delay', min: 0, max: 250, step: 10 },
        { key: 'outAnticipationPx', label: 'Anticipation', min: 0, max: 40, step: 1 },
        { key: 'outAnticipationMs', label: 'Wind-up', min: 40, max: 240, step: 10 },
        { key: 'outStiffness', label: 'Stiffness', min: 50, max: 600, step: 10 },
        { key: 'outDamping', label: 'Damping', min: 5, max: 60, step: 1 },
        { key: 'outMass', label: 'Mass', min: 0.2, max: 2, step: 0.01 },
      ],
    },
    {
      label: `Final Position · ${isMobile ? 'Mobile' : 'Desktop'}`,
      controls: [
        {
          key: isMobile ? 'mobileScale' : 'desktopScale',
          label: 'Scale',
          min: 0.5,
          max: 1,
          step: 0.01,
        },
        {
          key: isMobile ? 'mobileY' : 'desktopY',
          label: 'Y offset',
          min: -10,
          max: 70,
          step: 1,
        },
      ],
    },
  ];

  return (
    <details className="fixed bottom-4 left-4 z-[99990] w-[276px] rounded-[14px] border border-black/10 bg-white/90 font-['Inter',sans-serif] text-[12px] text-site-ink shadow-[0_12px_40px_rgb(19_16_21/0.14)] backdrop-blur-xl">
      <summary className="cursor-pointer select-none px-3 py-2.5 font-medium tracking-[-0.02em]">
        Signature motion
      </summary>
      <div className="max-h-[min(72vh,620px)] overflow-y-auto border-t border-black/8 px-3 pb-3 pt-2">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.08em] text-black/45">
          <span>{isMobile ? 'Mobile' : 'Desktop'}</span>
          <span>Dev only</span>
        </div>
        <div className="space-y-3">
          {sections.map((section) => (
            <section key={section.label}>
              <h3 className="mb-2 mt-0 text-[10px] font-medium uppercase tracking-[0.08em] text-black/40">
                {section.label}
              </h3>
              <div className="space-y-2">
                {section.label === 'Back to Work' && (
                  <label className="grid grid-cols-[82px_1fr_42px] items-center gap-2">
                    <span className="text-black/60">Delay copy</span>
                    <input
                      type="checkbox"
                      checked={settings.outDelayEnabled}
                      onChange={(event) =>
                        onChange({
                          ...settings,
                          outDelayEnabled: event.currentTarget.checked,
                        })
                      }
                      className="h-3.5 w-3.5 accent-[#131015]"
                    />
                    <output className="text-right text-black/55">
                      {settings.outDelayEnabled ? 'On' : 'Off'}
                    </output>
                  </label>
                )}
                {section.controls.map((control) => (
                  <label key={control.key} className="grid grid-cols-[82px_1fr_42px] items-center gap-2">
                    <span className="text-black/60">{control.label}</span>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={settings[control.key]}
                      onChange={(event) =>
                        onChange({
                          ...settings,
                          [control.key]: Number(event.currentTarget.value),
                        })
                      }
                      className="h-1 w-full accent-[#131015]"
                    />
                    <output className="text-right tabular-nums text-black/55">
                      {settings[control.key]}
                    </output>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg bg-black/5 px-2.5 py-2 text-[11px] font-medium transition-colors hover:bg-black/10"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg bg-site-ink px-2.5 py-2 text-[11px] font-medium text-white transition-transform active:scale-[0.97]"
          >
            Replay
          </button>
        </div>
      </div>
    </details>
  );
}
