import { useId } from "react";

type Channel = "h" | "s" | "b";

const trackBg = (channel: Channel, h: number, s: number) => {
  if (channel === "h") {
    return "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))";
  }
  if (channel === "s") {
    return `linear-gradient(to right, hsl(${h},0%,50%), hsl(${h},100%,50%))`;
  }
  return `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`;
};

export function HSBSlider({
  channel,
  value,
  onChange,
  max,
  label,
  h,
  s,
  disabled,
}: {
  channel: Channel;
  value: number;
  onChange: (v: number) => void;
  max: number;
  label: string;
  h: number;
  s: number;
  disabled?: boolean;
}) {
  const id = useId();
  const pct = (value / max) * 100;
  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <div className="mb-2 flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.25em]">
        <label htmlFor={id} className="text-muted-foreground">
          {label}
        </label>
        <span className="text-foreground tabular-nums">
          {Math.round(value)}
          <span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="relative h-3 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full ring-1 ring-border-strong/60"
          style={{ background: trackBg(channel, h, s) }}
        />
        <input
          id={id}
          type="range"
          min={0}
          max={max}
          step={channel === "h" ? 1 : 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="hsb-range absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-6 rounded-full border-2 border-white shadow-[0_0_18px_oklch(1_0_0_/_0.6)] transition-transform"
          style={{
            left: `${pct}%`,
            background: `hsl(${h}, ${s}%, ${channel === "b" ? value : 50}%)`,
          }}
        />
      </div>
    </div>
  );
}
