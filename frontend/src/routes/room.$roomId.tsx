import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Play, LogOut } from "lucide-react";
import { ColorOrbs } from "@/components/ColorOrbs";
import { Logo } from "@/components/Logo";
import { WalletPill } from "@/components/WalletPill";
import { PlayerList } from "@/components/PlayerList";
import { useGame } from "@/lib/game-store";

export const Route = createFileRoute("/room/$roomId")({ component: WaitingRoom });

function WaitingRoom() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { isHost, leaveRoom, startGame, players, generatedThisWeek, generateColors } =
    useGame();
  const [copied, setCopied] = useState(false);
  const [counting, setCounting] = useState<number | null>(null);

  useEffect(() => {
    if (!generatedThisWeek) generateColors();
  }, [generatedThisWeek, generateColors]);

  useEffect(() => {
    if (counting === null) return;
    if (counting === 0) {
      void startGame().then(() => navigate({ to: "/play/$roomId", params: { roomId } }));
      return;
    }
    const t = setTimeout(() => setCounting(counting - 1), 800);
    return () => clearTimeout(t);
  }, [counting, navigate, roomId, startGame]);

  const copy = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="relative min-h-screen">
      <ColorOrbs />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo size="sm" />
        <WalletPill />
      </header>

      <section className="relative z-10 mx-auto grid max-w-5xl gap-6 px-6 pb-20 md:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong scanline relative overflow-hidden rounded-3xl p-8 md:p-10"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Room ID · sealed on chain
          </span>
          <div className="mt-3 flex items-center gap-4">
            <h1 className="font-display text-5xl font-black tracking-[0.2em] md:text-7xl neon-text">
              {roomId}
            </h1>
            <button
              onClick={copy}
              className="glass inline-flex size-11 items-center justify-center rounded-full transition hover:neon-glow"
              aria-label="copy"
            >
              {copied ? <Check className="size-4 text-[oklch(0.78_0.22_145)]" /> : <Copy className="size-4" />}
            </button>
          </div>

          <div className="mt-10">
            <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <span>Scanning Vault</span>
              <span>{players.length} connected</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-surface-elevated">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[oklch(0.85_0.2_195)] to-transparent"
              />
            </div>
          </div>

          {counting !== null ? (
            <div className="mt-12 text-center">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Initializing
              </div>
              <motion.div
                key={counting}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="font-display text-9xl font-black neon-text"
              >
                {counting === 0 ? "GO" : counting}
              </motion.div>
            </div>
          ) : (
            <div className="mt-10 flex flex-wrap gap-3">
              <button
                disabled={!isHost}
                onClick={() => setCounting(3)}
                className="group relative overflow-hidden rounded-2xl p-[1.5px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_0deg,oklch(0.85_0.2_195),oklch(0.72_0.28_330),oklch(0.9_0.23_130),oklch(0.85_0.2_195))] animate-[spin_5s_linear_infinite]" />
                <span className="relative inline-flex items-center gap-2 rounded-2xl bg-background/90 px-6 py-3 font-display text-sm tracking-[0.3em] group-enabled:group-hover:bg-background/60">
                  <Play className="size-4" /> START GAME
                </span>
              </button>
              {!isHost && (
                <span className="inline-flex items-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  · waiting for host
                </span>
              )}
              <button
                onClick={() => {
                  leaveRoom();
                  navigate({ to: "/" });
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-border-strong"
              >
                <LogOut className="size-4" /> Leave
              </button>
            </div>
          )}
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-3xl p-6"
        >
          <h2 className="font-display text-sm tracking-[0.3em] text-muted-foreground">
            PLAYERS
          </h2>
          <div className="mt-4">
            <PlayerList />
          </div>
        </motion.aside>
      </section>
    </main>
  );
}
