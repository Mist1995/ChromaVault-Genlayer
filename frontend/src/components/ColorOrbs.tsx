import { useMemo } from "react";

/** Animated, floating color orbs background. Pure CSS, GPU-friendly. */
export function ColorOrbs() {
  const orbs = useMemo(
    () => [
      { c: "oklch(0.72 0.28 330)", size: 520, top: "-10%", left: "-8%", delay: "0s" },
      { c: "oklch(0.85 0.2 195)", size: 460, top: "20%", left: "70%", delay: "-6s" },
      { c: "oklch(0.7 0.25 295)", size: 600, top: "60%", left: "10%", delay: "-12s" },
      { c: "oklch(0.9 0.23 130)", size: 360, top: "75%", left: "75%", delay: "-3s" },
      { c: "oklch(0.85 0.2 25)", size: 320, top: "45%", left: "45%", delay: "-9s" },
    ],
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden grid-bg">
      {orbs.map((o, i) => (
        <div
          key={i}
          className="orb"
          style={{
            background: o.c,
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            animationDelay: o.delay,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,oklch(0.08_0.015_280)_85%)]" />
    </div>
  );
}
