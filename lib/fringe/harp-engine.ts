/**
 * HarpEngine — a small real-time string instrument.
 *
 * A row of flexible cords hangs from a top bar, each weighted by a heavy bead
 * at its tip. Every cord is a Verlet rope: a short chain of point masses joined
 * by stiff distance constraints, with gravity, drag and a heavy end mass. It
 * genuinely bends, sags and lifts its bead as it swings — nothing here is a
 * canned animation. Longer cords ring lower notes, shorter ones higher, on a
 * pentatonic scale so any sweep stays consonant. The pointer excites cords by
 * proximity and by crossing them; harder/faster gestures swing them wider and
 * sound louder and brighter. Beads collide with their neighbours (momentum
 * transfers through contact), a little energy bleeds sideways, and everything
 * decays to stillness.
 *
 * Framework-agnostic on purpose: physics, audio and interaction live here; the
 * React component owns the canvas, pointer events and lifecycle. Rendering
 * reads {@link HarpEngine.forEachString} — this module never touches the DOM
 * except for its own AudioContext.
 */

const PENTATONIC = [0, 2, 4, 7, 9] as const;

export interface HarpConfig {
  /** How many cords hang from the bar (spec: 8–16). */
  stringCount: number;
  /** Lowest note, in Hz — the longest cord. */
  baseFrequency: number;
  /**
   * Length↔frequency relation. length ∝ (baseFrequency / freq) ** exponent,
   * so 1 mirrors a real string (length inversely proportional to pitch).
   */
  lengthFrequencyExponent: number;
  /** Gravity pulling the beads down. Lower = slower, more floaty swing. */
  gravity: number;
  /**
   * Bead mass / inertia. Heavier beads resist the pointer's push and barely
   * move under the cord's own tension, so they hang plumb and swing slowly.
   * Sound intensity ignores mass, so notes stay responsive while motion stays
   * weighty.
   */
  mass: number;
  /** Air drag (0–~0.4). Higher = the swing bleeds energy and settles sooner. */
  damping: number;
  /** Bounciness of bead-to-bead collisions (0 = dead clack, 1 = lively). */
  restitution: number;
  /** Fraction of energy handed to each neighbour, decaying with distance. */
  coupling: number;
  /** How many neighbours on each side receive coupled energy. */
  couplingRange: number;
  /** Pointer speed → push strength. */
  sensitivity: number;
  /** Overall gadget volume (0–1). */
  masterVolume: number;
  /** Master switch for audio. Physics still runs when false. */
  soundEnabled: boolean;
  /** Minimum normalised intensity that may produce a note. */
  activationThreshold: number;
  /** Per-cord minimum gap between triggered notes, in ms. */
  crossCooldownMs: number;
  /** Nodes per cord (including the pinned anchor). More = smoother bend. */
  ropeNodes: number;
  /** Honour prefers-reduced-motion: no idle breeze, heavier drag. */
  reducedMotion: boolean;
}

export const DEFAULT_HARP_CONFIG: HarpConfig = {
  stringCount: 12,
  baseFrequency: 196, // G3
  lengthFrequencyExponent: 1,
  gravity: 9.8,
  mass: 5,
  damping: 0.08,
  restitution: 0.5,
  coupling: 0.22,
  couplingRange: 2,
  sensitivity: 0.9,
  masterVolume: 0.5,
  soundEnabled: true,
  activationThreshold: 0.05,
  crossCooldownMs: 90,
  ropeNodes: 7,
  reducedMotion: false,
};

/** Public, per-frame read model consumed by the renderer. */
export interface HarpString {
  /** Flat cord polyline [x0,y0, x1,y1, …]; first pair = anchor, last = bead. */
  points: number[];
  /** Bead (last node) position. */
  bobX: number;
  bobY: number;
  /** Normalised speed 0–~1 for glow / activity. */
  energy: number;
  /** Bead colour (resolved CSS colour string). */
  color: string;
  /** Note frequency in Hz. */
  frequency: number;
}

export interface HarpPalette {
  bar: string;
  string: string;
  beads: string[];
}

interface Node {
  x: number;
  y: number;
  px: number; // previous position (Verlet velocity = pos - prev)
  py: number;
}

interface Voice {
  index: number;
  nodes: Node[]; // nodes[0] = pinned anchor, last = heavy bead
  restLen: number; // per-segment rest length
  length: number; // total cord length (px)
  frequency: number;
  color: string;
  lastNoteAt: number;
  idlePhase: number;
}

const TOP_BAR_Y = 7;
const BOB_RADIUS = 6;
const FIXED_DT = 1 / 120; // physics substep (seconds)
const CONSTRAINT_ITERATIONS = 10;
const OMEGA_REF = 6; // gesture strength that maps to full sound intensity

// Tuned so the default config swings at a natural rate/amplitude.
const GRAV_SCALE = 230; // config.gravity → px/s²
const KICK_SCALE = 3.4; // gesture strength → bead velocity (px per substep)
const SPEED_REF = 2.2; // bead speed (px/substep) that maps to full glow
const WIND_AMP = 0.006; // idle breeze on the bead (px/substep) — barely there

function noteFrequency(base: number, index: number): number {
  const octave = Math.floor(index / PENTATONIC.length);
  const semitones = PENTATONIC[index % PENTATONIC.length] + 12 * octave;
  return base * Math.pow(2, semitones / 12);
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

type WindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export class HarpEngine {
  private config: HarpConfig;
  private palette: HarpPalette;
  private voices: Voice[] = [];
  private xs: number[] = [];
  private width = 0;
  private height = 0;

  private accumulator = 0;
  private elapsed = 0;

  // Pointer tracking
  private hasPointer = false;
  private prevX = 0;
  private prevY = 0;
  private prevT = 0;
  private prevVx = 0;

  // Audio
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private reverbSend: DelayNode | null = null;

  constructor(config: HarpConfig, palette: HarpPalette) {
    this.config = { ...config };
    this.palette = palette;
    this.build();
  }

  // --- Construction / geometry --------------------------------------------

  private build(): void {
    const { stringCount, baseFrequency } = this.config;
    const nodeCount = Math.max(3, Math.round(this.config.ropeNodes));
    this.voices = Array.from({ length: stringCount }, (_, i) => {
      const frequency = noteFrequency(baseFrequency, i);
      return {
        index: i,
        nodes: Array.from({ length: nodeCount }, () => ({
          x: 0,
          y: 0,
          px: 0,
          py: 0,
        })),
        restLen: 1,
        length: 1,
        frequency,
        color: this.palette.beads[i % this.palette.beads.length] ?? "#d99a2b",
        lastNoteAt: -1e9,
        idlePhase: (i * 1.37) % (Math.PI * 2),
      };
    });
    this.scratchPoints = new Array(nodeCount * 2).fill(0);
    this.layout();
    this.placeAtRest();
  }

  /** Geometry only (anchor columns + cord lengths). Never moves the cords, so
   *  live tuning of gravity/mass/etc. doesn't reset the simulation. */
  private layout(): void {
    const { width, height } = this;
    if (width <= 0 || height <= 0) return;
    const { baseFrequency, lengthFrequencyExponent } = this.config;
    const count = this.voices.length;

    const maxLen = Math.max(20, height - BOB_RADIUS * 2 - TOP_BAR_Y - 6);
    const minLen = maxLen * 0.42;

    for (const v of this.voices) {
      const ratio = Math.pow(
        baseFrequency / v.frequency,
        lengthFrequencyExponent,
      );
      v.length = minLen + ratio * (maxLen - minLen);
      v.restLen = v.length / (v.nodes.length - 1);
    }

    // Inset anchors by the widest plausible swing so a bead never leaves canvas.
    const maxSwing = maxLen * 0.62 + BOB_RADIUS + 2;
    const left = maxSwing;
    const usable = Math.max(1, width - maxSwing * 2);
    const step = count > 1 ? usable / (count - 1) : 0;
    this.xs = this.voices.map((_, i) => left + step * i);
  }

  /** Hang every cord straight down from its anchor, at rest. */
  private placeAtRest(): void {
    this.voices.forEach((v, i) => {
      const ax = this.xs[i] ?? 0;
      v.nodes.forEach((n, k) => {
        n.x = ax;
        n.y = TOP_BAR_Y + v.restLen * k;
        n.px = n.x;
        n.py = n.y;
      });
    });
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.layout();
    this.placeAtRest();
  }

  // --- Config --------------------------------------------------------------

  setConfig(partial: Partial<HarpConfig>): void {
    const structural =
      (partial.stringCount !== undefined &&
        partial.stringCount !== this.config.stringCount) ||
      (partial.baseFrequency !== undefined &&
        partial.baseFrequency !== this.config.baseFrequency) ||
      (partial.ropeNodes !== undefined &&
        Math.round(partial.ropeNodes) !== Math.round(this.config.ropeNodes));
    this.config = { ...this.config, ...partial };
    if (this.master && partial.masterVolume !== undefined) {
      this.master.gain.value = partial.masterVolume;
    }
    if (structural) this.build();
    else this.layout(); // geometry only; cords keep swinging
  }

  setPalette(palette: HarpPalette): void {
    this.palette = palette;
    this.voices.forEach((v, i) => {
      v.color = palette.beads[i % palette.beads.length] ?? v.color;
    });
  }

  /** Bring every cord back to rest. */
  reset(): void {
    this.placeAtRest();
  }

  // --- Physics -------------------------------------------------------------

  step(dtMs: number): void {
    const dt = Math.min(dtMs, 40) / 1000; // clamp spikes (tab refocus, etc.)
    this.accumulator += dt;
    this.elapsed += dt;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < 8) {
      this.integrate(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps += 1;
    }
    if (steps === 8) this.accumulator = 0; // avoid spiral of death
  }

  private integrate(dt: number): void {
    const { damping, mass, reducedMotion } = this.config;
    const gPx = this.config.gravity * GRAV_SCALE;
    // Per-substep velocity retention. The slider (0.01–0.4) maps to a small
    // per-step loss so the swing decays over seconds, not milliseconds.
    const drag = 1 - clamp(damping * (reducedMotion ? 2.5 : 1) * 0.12, 0, 0.2);
    const gStep = gPx * dt * dt;

    for (const v of this.voices) {
      const nodes = v.nodes;
      const last = nodes.length - 1;

      // Anchor stays pinned to the bar.
      const anchor = nodes[0];
      anchor.x = this.xs[v.index];
      anchor.y = TOP_BAR_Y;
      anchor.px = anchor.x;
      anchor.py = anchor.y;

      // Verlet step for the free nodes (gravity + inherited velocity).
      for (let k = 1; k < nodes.length; k += 1) {
        const n = nodes[k];
        const vx = (n.x - n.px) * drag;
        const vy = (n.y - n.py) * drag;
        n.px = n.x;
        n.py = n.y;
        n.x += vx;
        n.y += vy + gStep;
      }

      // Idle breeze so the instrument reads as "alive" at rest.
      if (!reducedMotion) {
        nodes[last].x +=
          Math.sin(this.elapsed * 0.7 + v.idlePhase) * WIND_AMP;
      }

      // Stiff distance constraints — the cord is (almost) inextensible. The
      // heavy bead barely yields, so the cord straightens toward it and lifts
      // it along the arc as it swings.
      const bobInv = 1 / mass;
      for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter += 1) {
        anchor.x = this.xs[v.index];
        anchor.y = TOP_BAR_Y;
        for (let k = 1; k < nodes.length; k += 1) {
          const a = nodes[k - 1];
          const b = nodes[k];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1e-6;
          const diff = (dist - v.restLen) / dist;
          const invA = k - 1 === 0 ? 0 : 1;
          const invB = k === last ? bobInv : 1;
          const sum = invA + invB || 1;
          const fa = (invA / sum) * diff;
          const fb = (invB / sum) * diff;
          a.x += dx * fa;
          a.y += dy * fa;
          b.x -= dx * fb;
          b.y -= dy * fb;
        }
      }
    }

    this.resolveCollisions();
    this.clampWalls();
  }

  /** Beads bounce off the canvas frame — a hard safety net so nothing ever
   *  leaves the box, however violent the input. */
  private clampWalls(): void {
    const r = BOB_RADIUS;
    const w = this.width;
    for (const v of this.voices) {
      const bob = v.nodes[v.nodes.length - 1];
      if (bob.x < r) {
        const vel = bob.x - bob.px;
        bob.x = r;
        bob.px = r + vel * 0.4; // reflect + damp
      } else if (bob.x > w - r) {
        const vel = bob.x - bob.px;
        bob.x = w - r;
        bob.px = w - r + vel * 0.4;
      }
    }
  }

  /**
   * Bead-to-bead collisions between neighbours. In Verlet, nudging positions
   * apart automatically produces the rebound velocity next step, so momentum
   * transfers through contact like a Newton's cradle. Restitution adds extra
   * separation velocity; a heavier bead shoves a lighter neighbour further.
   */
  private collVel: number[] = [];
  private collHit: boolean[] = [];

  private resolveCollisions(): void {
    const r = BOB_RADIUS;
    const minDist = 2 * r;
    const { restitution: e } = this.config;
    const n = this.voices.length;
    if (this.collVel.length !== n) {
      this.collVel = new Array(n).fill(0);
      this.collHit = new Array(n).fill(false);
    }
    const bob = (i: number) => this.voices[i].nodes[this.voices[i].nodes.length - 1];

    // Snapshot incoming horizontal velocities and detect approaching contacts
    // BEFORE we move anything (so restitution uses true pre-collision speeds).
    for (let i = 0; i < n; i += 1) {
      const nb = bob(i);
      this.collVel[i] = nb.x - nb.px;
      this.collHit[i] = false;
    }
    for (let i = 0; i < n - 1; i += 1) {
      const a = bob(i);
      const b = bob(i + 1);
      if (Math.abs(a.y - b.y) >= minDist) continue; // different heights: pass
      if (b.x - a.x >= minDist) continue; // enough room
      if (this.collVel[i] - this.collVel[i + 1] > 0) this.collHit[i] = true;
    }

    // Positional separation: keep bead i a diameter left of bead i+1. X only,
    // clamped, iterated so clusters settle evenly and a cross-over is undone
    // gradually — never a teleport, never a sign-flip that reads as attraction.
    for (let pass = 0; pass < 3; pass += 1) {
      for (let i = 0; i < n - 1; i += 1) {
        const a = bob(i);
        const b = bob(i + 1);
        if (Math.abs(a.y - b.y) >= minDist) continue;
        const gap = b.x - a.x;
        if (gap >= minDist) continue;
        const push = Math.min(minDist - gap, minDist) / 2;
        a.x -= push;
        b.x += push;
      }
    }

    // Restitution: reflect the relative horizontal velocity, scaled by e. This
    // is energy-BOUNDED (e ≤ 1 never adds energy) — unlike an overlap-based
    // shove, so heavy sweeps can't pump the system forever.
    if (e > 0) {
      for (let i = 0; i < n - 1; i += 1) {
        if (!this.collHit[i]) continue;
        const a = bob(i);
        const b = bob(i + 1);
        const va = this.collVel[i];
        const vb = this.collVel[i + 1];
        const ua = ((1 - e) * va + (1 + e) * vb) / 2;
        const ub = ((1 + e) * va + (1 - e) * vb) / 2;
        a.px = a.x - ua;
        b.px = b.x - ub;
      }
    }
  }

  private bobSpeed(v: Voice): number {
    const n = v.nodes[v.nodes.length - 1];
    return Math.hypot(n.x - n.px, n.y - n.py);
  }

  get isSettled(): boolean {
    if (this.hasPointer || !this.config.reducedMotion) return false;
    for (const v of this.voices) {
      if (this.bobSpeed(v) > 0.02) return false;
    }
    return true;
  }

  // --- Excitation ----------------------------------------------------------

  /** Push one cord's bead. Optionally plays its note (gated by threshold +
   *  cooldown). A fraction bleeds into neighbours (physics only). */
  private excite(index: number, strength: number, withSound: boolean): void {
    const v = this.voices[index];
    if (!v) return;
    const { mass, coupling, couplingRange } = this.config;
    const bob = v.nodes[v.nodes.length - 1];
    // Heavy bead: the same gesture yields less velocity (push it by moving its
    // previous position, the Verlet way).
    bob.px -= (strength * KICK_SCALE) / mass;

    if (withSound) {
      const intensity = clamp(Math.abs(strength) / OMEGA_REF, 0, 1);
      const now = this.ctx ? this.ctx.currentTime * 1000 : performance.now();
      if (
        intensity >= this.config.activationThreshold &&
        now - v.lastNoteAt >= this.config.crossCooldownMs
      ) {
        v.lastNoteAt = now;
        this.playNote(v, intensity);
      }
    }

    for (let d = 1; d <= couplingRange; d += 1) {
      const share = strength * Math.pow(coupling, d);
      if (Math.abs(share) < 0.01) break;
      const left = this.voices[index - d];
      const right = this.voices[index + d];
      if (left) {
        const lb = left.nodes[left.nodes.length - 1];
        lb.px -= (share * KICK_SCALE) / mass;
      }
      if (right) {
        const rb = right.nodes[right.nodes.length - 1];
        rb.px -= (share * KICK_SCALE) / mass;
      }
    }
  }

  // --- Pointer -------------------------------------------------------------

  pointerDown(x: number, y: number, tMs: number): void {
    this.pointerMove(x, y, tMs, true);
  }

  pointerLeave(): void {
    this.hasPointer = false;
  }

  pointerMove(x: number, y: number, tMs: number, primed = false): void {
    if (!this.hasPointer) {
      this.hasPointer = true;
      this.prevX = x;
      this.prevY = y;
      this.prevT = tMs;
      this.prevVx = 0;
      if (!primed) return;
    }

    const dt = Math.max(tMs - this.prevT, 1);
    const vx = (x - this.prevX) / dt;
    const vy = (y - this.prevY) / dt;
    const speed = Math.hypot(vx, vy);
    const { sensitivity } = this.config;

    // Crossing an anchor column is the musical trigger.
    for (let i = 0; i < this.xs.length; i += 1) {
      const sx = this.xs[i];
      const crossed = (this.prevX - sx) * (x - sx) <= 0 && this.prevX !== x;
      if (crossed) {
        const mag = (Math.abs(vx) + Math.abs(vy) * 0.35) * sensitivity * 2.2;
        const dir = x >= this.prevX ? 1 : -1;
        this.excite(i, dir * clamp(mag, 0.15, OMEGA_REF), true);
      }
    }

    // Proximity brush — a slow hover near a cord gives a faint vibration.
    if (speed > 0.02) {
      const nearest = this.nearestString(x);
      if (nearest >= 0) {
        const dist = Math.abs(this.xs[nearest] - x);
        const radius = 16;
        if (dist < radius) {
          const closeness = 1 - dist / radius;
          const mag = speed * closeness * sensitivity * 0.5;
          if (mag > 0.05) {
            const dir = vx >= 0 ? 1 : -1;
            this.excite(nearest, dir * clamp(mag, 0, 1.4), true);
          }
        }
      }
    }

    // Sharp direction change adds an extra perturbation to the nearest cord.
    if (Math.sign(vx) !== 0 && Math.sign(vx) === -Math.sign(this.prevVx)) {
      const jolt = Math.abs(vx) * sensitivity;
      if (jolt > 0.4) {
        const nearest = this.nearestString(x);
        if (nearest >= 0)
          this.excite(nearest, Math.sign(vx) * clamp(jolt, 0, 2.5), false);
      }
    }

    this.prevX = x;
    this.prevY = y;
    this.prevT = tMs;
    this.prevVx = vx;
  }

  private nearestString(x: number): number {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < this.xs.length; i += 1) {
      const d = Math.abs(this.xs[i] - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  // --- Audio ---------------------------------------------------------------

  unlockAudio(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();

      this.master = this.ctx.createGain();
      this.master.gain.value = this.config.masterVolume;
      this.master.connect(this.ctx.destination);

      // Subtle feedback-delay reverb tail.
      const delay = this.ctx.createDelay(0.5);
      delay.delayTime.value = 0.16;
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.28;
      const tone = this.ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2600;
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.18;

      delay.connect(tone);
      tone.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.wet);
      this.wet.connect(this.master);
      this.reverbSend = delay;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private playNote(v: Voice, intensity: number): void {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.config.soundEnabled || ctx.state !== "running")
      return;

    const now = ctx.currentTime;
    const freq = v.frequency;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = clamp(freq * (3 + intensity * 6), 400, 12000);

    const gain = ctx.createGain();
    const peak = (0.06 + intensity * 0.3) * this.config.masterVolume;
    const attack = 0.001 + (1 - intensity) * 0.004;
    const release = 1.1 + (1 - intensity) * 0.4 + (196 / freq) * 0.3;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);

    const subGain = ctx.createGain();
    subGain.gain.value = 0.4;

    osc.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    if (this.reverbSend) gain.connect(this.reverbSend);

    osc.start(now);
    sub.start(now);
    const stopAt = now + attack + release + 0.05;
    osc.stop(stopAt);
    sub.stop(stopAt);

    osc.onended = () => {
      osc.disconnect();
      sub.disconnect();
      subGain.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  // --- Read model / teardown ----------------------------------------------

  private scratchPoints: number[] = [];
  private scratch: HarpString = {
    points: [],
    bobX: 0,
    bobY: 0,
    energy: 0,
    color: "",
    frequency: 0,
  };

  /** Visit every cord with a shared, mutable read model (allocation-free). */
  forEachString(cb: (s: Readonly<HarpString>) => void): void {
    const s = this.scratch;
    s.points = this.scratchPoints;
    for (const v of this.voices) {
      const nodes = v.nodes;
      for (let k = 0; k < nodes.length; k += 1) {
        s.points[k * 2] = nodes[k].x;
        s.points[k * 2 + 1] = nodes[k].y;
      }
      const bob = nodes[nodes.length - 1];
      s.bobX = bob.x;
      s.bobY = bob.y;
      s.energy = clamp(this.bobSpeed(v) / SPEED_REF, 0, 1);
      s.color = v.color;
      s.frequency = v.frequency;
      cb(s);
    }
  }

  get topBarY(): number {
    return TOP_BAR_Y;
  }

  get bobRadius(): number {
    return BOB_RADIUS;
  }

  dispose(): void {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
      this.wet = null;
      this.reverbSend = null;
    }
    this.voices = [];
    this.xs = [];
  }
}
