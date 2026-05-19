import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Home, RotateCcw } from "lucide-react";
import { ColorOrbs } from "@/components/ColorOrbs";
import { Logo } from "@/components/Logo";
import { WalletPill } from "@/components/WalletPill";
import { useGame } from "@/lib/game-store";
import { addrHue } from "@/lib/color";

export const Route = createFileRoute("/results/$roomId")({ component: Results });

function Results() {
  const navigate = useNavigate();
  const { roomId } = Route.useParams();
  const { roundScores, totalScore, players, leaveRoom, resetGame, leaderboard, walletAddress, submitFinalScores, refreshLeaderboard } =
    useGame();

  useEffect(() => {
    if (totalScore > 0 && roomId) {
      void submitFinalScores(roomId, totalScore).then(() => refreshLeaderboard());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mock final podium combining you + bots from players list
  const podium = useMemo(() => {
    const me = walletAddress;
    const all = players.map((p) => ({
      address: p.address,
      name: p.name,
      score: p.address === me ? totalScore : Math.max(50, Math.round(totalScore * (0.6 + Math.random() * 0.6))),
    }));
    return all.sort((a, b) => b.score - a.score);
  }, [players, totalScore, walletAddress]);

  const xp = Math.round(totalScore * 1.25);

  return (
    <main className="relative min-h-screen">
      <ColorOrbs />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => { resetGame(); navigate({ to: "/room/$roomId", params: { roomId } }); }}
            className="group relative overflow-hidden rounded-2xl p-[1.5px]"
          >
            <span className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_0deg,oklch(0.85_0.2_195),oklch(0.72_0.28_330),oklch(0.9_0.23_130),oklch(0.85_0.2_195))] animate-[spin_5s_linear_infinite]" />
            <span className="relative inline-flex items-center gap-2 rounded-2xl bg-background/90 px-4 py-2 font-display text-xs tracking-[0.25em] group-hover:bg-background/60">
              <RotateCcw className="size-3.5" /> PLAY AGAIN
            </span>
          </button>
          <Link
            to="/"
            onClick={() => leaveRoom()}
            className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-border-strong"
          >
            <Home className="size-3.5" /> Home
          </Link>
          <WalletPill />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Run complete · room {roomId}
          </span>
          <h1
            data-text="VAULT SEALED"
            className="glitch mt-4 font-display text-5xl font-black tracking-[0.15em] md:text-7xl"
          >
            VAULT SEALED
          </h1>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Podium podium={podium} />

          {/* Your stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-3xl p-8"
          >
            <h2 className="font-display text-sm tracking-[0.3em] text-muted-foreground">
              YOUR RUN
            </h2>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="font-display text-6xl font-black tabular-nums neon-text">
                  {totalScore}
                  <span className="text-2xl text-muted-foreground">/700</span>
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Total Score
                </div>
              </div>
              <XPBurst xp={xp} />
            </div>

            <div className="mt-8 space-y-2">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Round Breakdown
              </div>
              {roundScores.map((s, i) => (
                <RoundBar key={i} index={i + 1} score={s} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Global leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong mt-6 rounded-3xl p-8"
        >
          <h2 className="font-display text-sm tracking-[0.3em] text-muted-foreground">
            GLOBAL LEADERBOARD
          </h2>
          <ol className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {leaderboard.map((e, i) => (
              <li key={e.address} className="flex items-center justify-between border-b border-border py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-display text-xs tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display tracking-widest">{e.name}</span>
                </div>
                <span className="font-mono tabular-nums">{e.weekScore}</span>
              </li>
            ))}
          </ol>
        </motion.div>

      </section>
    </main>
  );
}

function Podium({ podium }: { podium: { address: string; name: string; score: number }[] }) {
  const heights = [180, 230, 140];
  const order = [1, 0, 2]; // 2nd, 1st, 3rd visual order
  const colors = ["oklch(0.85 0.2 195)", "oklch(0.9 0.23 130)", "oklch(0.72 0.28 330)"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-8"
    >
      <h2 className="font-display text-sm tracking-[0.3em] text-muted-foreground">PODIUM</h2>
      <div className="mt-8 grid grid-cols-3 items-end gap-4">
        {order.map((rank, idx) => {
          const p = podium[rank];
          if (!p) return <div key={idx} />;
          const hue = addrHue(p.address);
          return (
            <motion.div
              key={p.address}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.15, type: "spring" }}
              className="text-center"
            >
              <div
                className="mx-auto mb-3 size-14 rounded-full ring-2"
                style={{
                  background: `conic-gradient(from 0deg, oklch(0.75 0.22 ${hue}), oklch(0.7 0.27 ${(hue + 120) % 360}), oklch(0.85 0.2 ${(hue + 240) % 360}))`,
                  boxShadow: `0 0 24px ${colors[rank]}`,
                  borderColor: colors[rank],
                }}
              />
              <div className="font-display text-sm tracking-widest">{p.name}</div>
              <div className="font-mono text-xs tabular-nums" style={{ color: colors[rank] }}>
                {p.score}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: heights[rank] }}
                transition={{ delay: 0.4 + idx * 0.15, duration: 0.6, ease: "easeOut" }}
                className="mx-auto mt-3 w-full rounded-t-xl border-x border-t"
                style={{
                  background: `linear-gradient(to top, ${colors[rank]}40, transparent)`,
                  borderColor: `${colors[rank]}80`,
                }}
              >
                <div
                  className="pt-4 font-display text-3xl font-black"
                  style={{ color: colors[rank] }}
                >
                  {rank + 1}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RoundBar({ index, score }: { index: number; score: number }) {
  const color =
    score >= 85 ? "oklch(0.78 0.22 145)" : score >= 55 ? "oklch(0.85 0.18 85)" : "oklch(0.65 0.26 25)";
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        R{index}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-elevated">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.05 * index }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums">{score}</span>
    </div>
  );
}

function XPBurst({ xp }: { xp: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative">
      <div className="relative inline-flex items-center gap-2 rounded-2xl border border-[oklch(0.9_0.23_130_/_0.4)] bg-[oklch(0.9_0.23_130_/_0.1)] px-4 py-3 font-mono text-sm">
        <Sparkles className="size-4 text-[oklch(0.9_0.23_130)]" />
        <span className="tabular-nums">+{xp} XP</span>
      </div>
      {show &&
        Array.from({ length: 14 }).map((_, i) => {
          const angle = (i / 14) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos(angle) * 80,
                y: Math.sin(angle) * 80,
                scale: 0.2,
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 size-1.5 rounded-full bg-[oklch(0.9_0.23_130)]"
              style={{ boxShadow: "0 0 8px oklch(0.9 0.23 130)" }}
            />
          );
        })}
    </div>
  );
}
