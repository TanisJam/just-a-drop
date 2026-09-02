"use client";

/**
 * Fringe — a hanging string instrument that decorates the drop screens.
 *
 * Beads dangle from a top bar on strings of descending length (low notes on
 * the left, high on the right). Sweep the pointer across them and they swing
 * like real pendulums and ring a soft pentatonic scale; move faster for a
 * stronger pluck. All physics and audio live in {@link HarpEngine}; this
 * component only owns the canvas, pointer events and lifecycle.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  DEFAULT_HARP_CONFIG,
  HarpEngine,
  type HarpConfig,
  type HarpPalette,
} from "@/lib/fringe/harp-engine";

/** Optional overrides — the gadget works with zero props. */
export interface FringeProps {
  config?: Partial<HarpConfig>;
}

/** Imperative handle for live tweaking (used by the dev lab). */
export interface FringeHandle {
  setConfig(partial: Partial<HarpConfig>): void;
  reset(): void;
}

function readPalette(el: HTMLElement): HarpPalette {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;
  return {
    bar: v("--color-primary", "#1b5e43"),
    string: v("--color-primary-light", "#3e8e68"),
    beads: [
      v("--aurora-gold", "#f0be4e"),
      v("--aurora-rose", "#e59ab0"),
      v("--aurora-lav", "#b6a4dd"),
      v("--aurora-teal", "#74c3b2"),
      v("--color-accent", "#d99a2b"),
    ],
  };
}

export const Fringe = forwardRef<FringeHandle, FringeProps>(function Fringe(
  { config },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HarpEngine | null>(null);
  // Initial config is read once on mount; live changes go through the handle.
  const initialConfig = useRef(config);

  useImperativeHandle(
    ref,
    () => ({
      setConfig: (partial) => engineRef.current?.setConfig(partial),
      reset: () => engineRef.current?.reset(),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const engine = new HarpEngine(
      {
        ...DEFAULT_HARP_CONFIG,
        ...initialConfig.current,
        reducedMotion: reduceMotion,
      },
      readPalette(container),
    );
    engineRef.current = engine;

    let cssWidth = 0;
    let cssHeight = 0;
    let dpr = 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      engine.resize(cssWidth, cssHeight);
    };
    resize();

    // Colours captured now, re-read on theme change below.
    let palette = readPalette(container);
    let paletteString = palette.string;
    let paletteBar = palette.bar;

    // --- Render ------------------------------------------------------------
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const barY = engine.topBarY;
      const r = engine.bobRadius;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      let barLeft = Infinity;
      let barRight = -Infinity;

      engine.forEachString((s) => {
        const pts = s.points;
        const bx = s.bobX;
        const by = s.bobY;
        const ax = pts[0];
        const ay = pts[1];
        barLeft = Math.min(barLeft, ax);
        barRight = Math.max(barRight, ax);

        const glow = Math.min(s.energy, 1);

        // Flexible cord — a smooth curve through the Verlet nodes. It bends and
        // sags for real; the bead hangs at the last node.
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        for (let k = 1; k < pts.length / 2 - 1; k += 1) {
          const cx = pts[k * 2];
          const cy = pts[k * 2 + 1];
          const mx = (cx + pts[k * 2 + 2]) / 2;
          const my = (cy + pts[k * 2 + 3]) / 2;
          ctx.quadraticCurveTo(cx, cy, mx, my);
        }
        ctx.lineTo(bx, by);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = paletteString;
        ctx.globalAlpha = 0.5 + glow * 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Active halo — grows with energy.
        if (glow > 0.02) {
          ctx.beginPath();
          ctx.arc(bx, by, r + 3 + glow * 7, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = glow * 0.22;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Bead.
        const grad = ctx.createRadialGradient(
          bx - r * 0.35,
          by - r * 0.4,
          r * 0.2,
          bx,
          by,
          r,
        );
        grad.addColorStop(0, "rgba(255,255,255,0.9)");
        grad.addColorStop(0.25, s.color);
        grad.addColorStop(1, s.color);
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 5 + glow * 14;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Anchor knot on the bar.
        ctx.beginPath();
        ctx.arc(ax, ay, 2, 0, Math.PI * 2);
        ctx.fillStyle = paletteBar;
        ctx.fill();
      });

      // Draw the bar last so knots sit under it visually.
      if (barRight > barLeft) {
        ctx.beginPath();
        ctx.moveTo(barLeft, barY);
        ctx.lineTo(barRight, barY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = paletteBar;
        ctx.globalAlpha = 0.85;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    // --- Loop --------------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    let running = false;

    const frame = (now: number) => {
      const dt = now - last;
      last = now;
      engine.step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // --- Visibility (perf: don't animate offscreen or in a hidden tab) -----
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(container);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // --- Resize ------------------------------------------------------------
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    // --- Theme ------------------------------------------------------------
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => {
      palette = readPalette(container);
      paletteString = palette.string;
      paletteBar = palette.bar;
      engine.setPalette(palette);
    };
    darkQuery.addEventListener("change", onTheme);

    // --- Pointer ----------------------------------------------------------
    const localX = (e: PointerEvent) =>
      e.clientX - container.getBoundingClientRect().left;
    const localY = (e: PointerEvent) =>
      e.clientY - container.getBoundingClientRect().top;

    const onMove = (e: PointerEvent) => {
      // Moving is a good moment to (re)unlock audio after a first gesture.
      engine.unlockAudio();
      engine.pointerMove(localX(e), localY(e), e.timeStamp);
    };
    const onDown = (e: PointerEvent) => {
      engine.unlockAudio();
      engine.pointerDown(localX(e), localY(e), e.timeStamp);
    };
    const onLeave = () => engine.pointerLeave();

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);

    // --- Cleanup ----------------------------------------------------------
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      darkQuery.removeEventListener("change", onTheme);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="fringe" role="presentation">
      <canvas ref={canvasRef} className="fringe__canvas" />
    </div>
  );
});
