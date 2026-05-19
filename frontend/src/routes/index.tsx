import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, KeyRound, Plus, Trophy, ArrowRight } from "lucide-react";
import { ColorOrbs } from "@/components/ColorOrbs";
import { Logo } from "@/components/Logo";
import { WalletPill } from "@/components/WalletPill";
import { useGame } from "@/lib/game-store";
import { hsbToHex } from "@/lib/color";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const navigate = useNavigate();
  const {
    walletAddress,
    weekColors,
    generatedThisWeek,
    generateColors,
    createRoom,
    joinRoom,
    leaderboard,
    refreshLeaderboard,
  } = useGame();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => { refreshLeaderboard(); }, [refreshLeaderboard]);

  const ensureWallet = () => { /* wallet connected via modal in header */ };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <ColorOrbs />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo size="sm" />
        <WalletPill />
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/50 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-[oklch(0.85_0.2_195)] shadow-[0_0_8px_oklch(0.85_0.2_195)]" />
            on-chain · genlayer studionet
          </span>
          <h1
            data-text="CHROMAVAULT"
            className="glitch mt-6 font-display text-6xl font-black tracking-[0.12em] md:text-8xl lg:text-9xl"
          >
            CHROMAVAULT
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            Seven colors are minted to the chain each week. Memorize them. Recreate them
            from instinct. Climb the spectrum.
          </p>
        </motion.div>

        {/* Weekly palette strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-12"
        >
          <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>This week's vault</span>
            <span>{generatedThisWeek ? "sealed" : "unrevealed"}</span>
          </div>
          <div className="grid grid-cols-7 gap-2 md:gap-4">
            {Array.from({ length: 7 }).map((_, i) => {
              const c = weekColors[i];
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className="relative aspect-square rounded-2xl border border-border-strong overflow-hidden"
                  style={
                    c
                      ? {
                          background: hsbToHex(c),
                          boxShadow: `0 0 32px -4px ${hsbToHex(c)}80`,
                        }
                      : { background: "oklch(0.13 0.02 280)" }
                  }
                >
                  <span className="absolute left-2 top-2 font-mono text-[10px] tracking-wider text-black/70 mix-blend-overlay">
                    0{i + 1}
                  </span>
                  {!c && (
                    <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-muted-foreground/40">
                      ?
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="glass-strong rounded-3xl p-6 md:p-8"
          >
            <h2 className="font-display text-xl tracking-widest text-foreground">
              ENTER THE VAULT
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate the week's palette, then host or join a room.
            </p>

            <button
              onClick={() => {
                ensureWallet();
                void generateColors();
              }}
              className="group relative mt-6 w-full overflow-hidden rounded-2xl p-[1.5px]"
            >
              <span className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_var(--angle,0deg),oklch(0.85_0.2_195),oklch(0.72_0.28_330),oklch(0.9_0.23_130),oklch(0.85_0.2_195))] opacity-90 animate-[spin_6s_linear_infinite]" />
              <span className="relative flex items-center justify-center gap-3 rounded-2xl bg-background/90 px-6 py-4 font-display text-sm tracking-[0.3em] text-foreground transition group-hover:bg-background/60">
                <Sparkles className="size-4" />
                {generatedThisWeek ? "REGENERATE WEEKLY COLORS" : "GENERATE THIS WEEK'S COLORS"}
              </span>
            </button>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                disabled={creating}
                onClick={async () => {
                  setCreating(true);
                  ensureWallet();
                  if (!generatedThisWeek) await generateColors();
                  const id = await createRoom();
                  navigate({ to: "/room/$roomId", params: { roomId: id } });
                  setCreating(false);
                }}
                className="glass group flex items-center justify-between rounded-2xl px-5 py-5 text-left transition hover:neon-glow"
              >
                <div>
                  <div className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Host
                  </div>
                  <div className="mt-1 font-display text-lg tracking-wider">Create Room</div>
                </div>
                <Plus className="size-5 transition group-hover:rotate-90" />
              </button>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setErr("");
                  setJoining(true);
                  ensureWallet();
                  if (!generatedThisWeek) await generateColors();
                  const ok = await joinRoom(code);
                  setJoining(false);
                  if (!ok) {
                    setErr("Invalid room code");
                    return;
                  }
                  navigate({ to: "/room/$roomId", params: { roomId: code.toUpperCase() } });
                }}
                className="glass rounded-2xl px-5 py-4"
              >
                <label className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Join
                </label>
                <div className="mt-2 flex items-center gap-2 border-b border-border-strong focus-within:border-[oklch(0.85_0.2_195)] focus-within:shadow-[0_1px_0_0_oklch(0.85_0.2_195)] transition">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="ROOM CODE"
                    className="w-full bg-transparent py-2 font-mono text-base tracking-[0.3em] outline-none placeholder:text-muted-foreground/40"
                  />
                  <button type="submit" aria-label="join" className="text-foreground/80 hover:text-foreground">
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                <AnimatePresence>
                  {err && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 font-mono text-[11px] text-destructive"
                    >
                      {err}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>

          {/* Right: leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="glass-strong rounded-3xl p-6 md:p-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl tracking-widest text-foreground">
                LEADERBOARD
              </h2>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <Trophy className="size-3" /> Week
              </span>
            </div>

            <ol className="mt-5 divide-y divide-border">
              {leaderboard.slice(0, 7).map((e, i) => (
                <li
                  key={e.address}
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3"
                >
                  <span
                    className={`font-display text-sm tabular-nums ${
                      i === 0
                        ? "text-[oklch(0.9_0.23_130)] neon-text"
                        : i === 1
                          ? "text-[oklch(0.85_0.2_195)]"
                          : i === 2
                            ? "text-[oklch(0.72_0.28_330)]"
                            : "text-muted-foreground"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-display text-sm tracking-widest">{e.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {e.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums text-foreground">
                      {e.weekScore}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {e.xp.toLocaleString()} xp
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
