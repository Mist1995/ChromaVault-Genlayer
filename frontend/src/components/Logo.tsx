import { Link } from "@tanstack/react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "text-6xl md:text-8xl"
      : size === "sm"
        ? "text-xl"
        : "text-3xl md:text-4xl";
  return (
    <Link to="/" className="inline-flex items-center gap-3 group">
      <span className="relative inline-block size-3 rounded-full bg-gradient-to-br from-[oklch(0.85_0.2_195)] via-[oklch(0.72_0.28_330)] to-[oklch(0.9_0.23_130)] shadow-[0_0_18px_oklch(0.72_0.28_330_/_0.8)]" />
      <span
        data-text="CHROMAVAULT"
        className={`glitch font-display font-black tracking-[0.18em] ${cls}`}
      >
        CHROMAVAULT
      </span>
    </Link>
  );
}
