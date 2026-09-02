/**
 * Fringe — decorative solarpunk tapestry hem.
 * Threads sway and beads twinkle, then the strands fade to nothing:
 * a visual echo of the ephemeral drop that hangs by a moment.
 */

const BEADS = [
  "var(--aurora-gold)",
  "var(--aurora-rose)",
  "var(--aurora-lav)",
  "var(--aurora-teal)",
  "var(--color-accent)",
] as const;

const THREAD_COUNT = 21;

export function Fringe() {
  return (
    <div className="fringe" aria-hidden="true">
      {Array.from({ length: THREAD_COUNT }, (_, i) => {
        // Gentle organic variation in length, sway phase and bead colour
        const height = 22 + (i % 5) * 5;
        const delay = (i % 7) * 0.35;
        const bead = BEADS[i % BEADS.length];
        return (
          <span
            key={i}
            className="fringe__thread"
            style={
              {
                height: `${height}px`,
                animationDelay: `${delay}s`,
                "--bead": bead,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
