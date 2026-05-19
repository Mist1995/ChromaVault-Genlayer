import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, AlertTriangle, ExternalLink } from "lucide-react";
import { connectMetaMask, connectDemoAccount } from "@/lib/game-store";
import { useGame } from "@/lib/game-store";

interface ConnectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConnectModal({ open, onClose }: ConnectModalProps) {
  const { connectWallet } = useGame();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState<"metamask" | "demo" | null>(null);

  const hasMetaMask = typeof window !== "undefined" && !!(window as { ethereum?: unknown }).ethereum;

  const handleMetaMask = async () => {
    setErr("");
    setLoading("metamask");
    try {
      const address = await connectMetaMask();
      connectWallet(address);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "MetaMask connection failed");
    } finally {
      setLoading(null);
    }
  };

  const handleDemo = () => {
    setLoading("demo");
    try {
      const address = connectDemoAccount();
      connectWallet(address);
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-sm rounded-3xl p-8"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <h2 className="font-display text-xl tracking-widest">CONNECT WALLET</h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              GenLayer Studionet · Chain ID 61999
            </p>

            <div className="mt-6 space-y-3">
              {/* MetaMask */}
              <button
                onClick={handleMetaMask}
                disabled={loading !== null}
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-border-strong bg-surface/40 px-5 py-4 text-left transition hover:border-[oklch(0.85_0.2_195_/_0.6)] hover:bg-surface/70 disabled:opacity-50"
              >
                <span className="text-3xl">🦊</span>
                <div className="flex-1">
                  <div className="font-display text-sm tracking-widest">
                    {loading === "metamask" ? "Connecting…" : "MetaMask"}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {hasMetaMask ? "Browser extension detected" : "Not installed — click to install"}
                  </div>
                </div>
                {!hasMetaMask && (
                  <a
                    href="https://metamask.io"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Demo */}
              <button
                onClick={handleDemo}
                disabled={loading !== null}
                className="group flex w-full items-center gap-4 rounded-2xl border border-border px-5 py-4 text-left transition hover:border-[oklch(0.9_0.23_130_/_0.5)] hover:neon-glow disabled:opacity-50"
              >
                <Zap className="size-6 text-[oklch(0.9_0.23_130)]" />
                <div>
                  <div className="font-display text-sm tracking-widest">
                    {loading === "demo" ? "Connecting…" : "Demo Account"}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    Quick connect — studionet test wallet
                  </div>
                </div>
              </button>
            </div>

            <AnimatePresence>
              {err && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-destructive"
                >
                  <AlertTriangle className="size-3 shrink-0" /> {err}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="mt-5 font-mono text-[10px] text-muted-foreground/50">
              MetaMask will auto-add GenLayer Studionet to your networks.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
