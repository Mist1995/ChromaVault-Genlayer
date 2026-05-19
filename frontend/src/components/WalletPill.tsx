import { useState } from "react";
import { useGame } from "@/lib/game-store";
import { addrHue, truncateAddr } from "@/lib/color";
import { ConnectModal } from "./ConnectModal";

export function WalletPill() {
  const { walletAddress, disconnectWallet } = useGame();
  const [open, setOpen] = useState(false);

  const hue = walletAddress ? addrHue(walletAddress) : 0;

  return (
    <>
      <ConnectModal open={open} onClose={() => setOpen(false)} />

      {!walletAddress ? (
        <button
          onClick={() => setOpen(true)}
          className="glass rounded-full px-5 py-2 text-sm font-mono uppercase tracking-wider text-foreground transition hover:neon-glow"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={disconnectWallet}
          title="Disconnect"
          className="glass group flex items-center gap-3 rounded-full pl-2 pr-4 py-1.5"
        >
          <span
            className="size-6 rounded-full ring-2 ring-border-strong"
            style={{
              background: `conic-gradient(from 0deg, oklch(0.75 0.22 ${hue}), oklch(0.7 0.27 ${(hue + 90) % 360}), oklch(0.85 0.2 ${(hue + 200) % 360}), oklch(0.75 0.22 ${hue}))`,
            }}
          />
          <span className="font-mono text-xs tracking-wider text-muted-foreground group-hover:text-foreground">
            {truncateAddr(walletAddress)}
          </span>
        </button>
      )}
    </>
  );
}
