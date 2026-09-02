"use client";

/**
 * FringeLab — a dev-only playground for tuning the harp gadget live.
 *
 * Renders the Fringe plus a control panel wired straight into the running
 * engine through its imperative handle, so dragging a slider retunes the
 * physics/audio without rebuilding or re-unlocking anything. Not linked from
 * the app; reach it at /fringe-lab.
 */

import { useRef, useState } from "react";
import { Fringe, type FringeHandle } from "@/components/fringe";
import { DEFAULT_HARP_CONFIG, type HarpConfig } from "@/lib/fringe/harp-engine";

interface SliderDef {
  key: keyof HarpConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  /** Changing this rebuilds the strings. */
  structural?: boolean;
}

const SLIDERS: SliderDef[] = [
  { key: "mass", label: "Mass", min: 1, max: 20, step: 0.5, hint: "heavier bead resists the kick" },
  { key: "gravity", label: "Gravity", min: 2, max: 20, step: 0.2, hint: "lower = slower swing" },
  { key: "damping", label: "Damping", min: 0.01, max: 0.4, step: 0.01, hint: "higher = settles sooner" },
  { key: "restitution", label: "Restitution", min: 0, max: 1, step: 0.05, hint: "bounciness of collisions" },
  { key: "sensitivity", label: "Sensitivity", min: 0.1, max: 3, step: 0.1, hint: "pointer speed → force" },
  { key: "coupling", label: "Coupling", min: 0, max: 0.6, step: 0.02, hint: "energy shared to neighbours" },
  { key: "masterVolume", label: "Volume", min: 0, max: 1, step: 0.05, hint: "overall gadget volume" },
  { key: "stringCount", label: "Strings", min: 6, max: 16, step: 1, hint: "how many hang", structural: true },
  { key: "ropeNodes", label: "Cord nodes", min: 3, max: 12, step: 1, hint: "more = smoother, floppier cord", structural: true },
  { key: "baseFrequency", label: "Base note", min: 98, max: 330, step: 1, hint: "lowest string, Hz", structural: true },
];

export function FringeLab() {
  const fringeRef = useRef<FringeHandle>(null);
  const [values, setValues] = useState<HarpConfig>({ ...DEFAULT_HARP_CONFIG });

  const update = (key: keyof HarpConfig, value: number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    fringeRef.current?.setConfig({ [key]: value });
  };

  return (
    <div className="lab">
      <header className="lab__head">
        <h1 className="lab__title">Fringe Lab</h1>
        <p className="lab__sub">
          Sweep the pointer across the strings. Tune live — nothing here ships.
        </p>
      </header>

      <div className="lab__stage">
        <Fringe ref={fringeRef} config={values} />
      </div>

      <div className="lab__controls">
        {SLIDERS.map((s) => (
          <label key={s.key} className="lab__row">
            <span className="lab__label">
              {s.label}
              {s.structural ? " ↻" : ""}
              <span className="lab__value">
                {Number(values[s.key]).toFixed(s.step < 1 ? 2 : 0)}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={Number(values[s.key])}
              onChange={(e) => update(s.key, Number(e.target.value))}
              className="lab__range"
            />
            <span className="lab__hint">{s.hint}</span>
          </label>
        ))}

        <div className="lab__actions">
          <label className="lab__toggle">
            <input
              type="checkbox"
              checked={values.soundEnabled}
              onChange={(e) => update("soundEnabled", e.target.checked)}
            />
            Sound
          </label>
          <button
            type="button"
            className="lab__btn"
            onClick={() => fringeRef.current?.reset()}
          >
            Reset simulation
          </button>
          <button
            type="button"
            className="lab__btn"
            onClick={() => {
              const d = { ...DEFAULT_HARP_CONFIG };
              setValues(d);
              fringeRef.current?.setConfig(d);
            }}
          >
            Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
