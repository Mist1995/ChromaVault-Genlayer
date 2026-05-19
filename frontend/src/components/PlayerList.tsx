import { useGame } from "@/lib/game-store";
import { addrHue, truncateAddr } from "@/lib/color";
import { Crown } from "lucide-react";

export function PlayerList() {
  const players = useGame((s) => s.players);
  return (
    <ul className="space-y-2">
      {players.map((p) => {
        const hue = addrHue(p.address);
        return (
          <li
            key={p.address}
            className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/60 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="size-8 rounded-full ring-2 ring-border-strong"
                style={{
                  background: `conic-gradient(from 0deg, oklch(0.75 0.22 ${hue}), oklch(0.7 0.27 ${(hue + 120) % 360}), oklch(0.85 0.2 ${(hue + 240) % 360}), oklch(0.75 0.22 ${hue}))`,
                }}
              />
              <div className="leading-tight">
                <div className="font-display text-sm tracking-widest">{p.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  {truncateAddr(p.address)}
                </div>
              </div>
            </div>
            {p.isHost && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.85_0.18_85_/_0.15)] px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-[oklch(0.85_0.18_85)]">
                <Crown className="size-3" /> Host
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
