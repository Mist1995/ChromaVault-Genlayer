import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { ColorOrbs } from "@/components/ColorOrbs";
import { Logo } from "@/components/Logo";
import { WalletPill } from "@/components/WalletPill";
import { HSBSlider } from "@/components/HSBSlider";
import { useGame } from "@/lib/game-store";
import { hsbToHex, type HSB } from "@/lib/color";

export const Route = createFileRoute("/play/$roomId")({ component: GameScreen });

const MEMORIZE_MS = 4000;
const REVEAL_MS = 3000;
const TOTAL_ROUNDS = 7;

function GameScreen() {
  const navigate = useNavigate();
  const { roomId } = Route.useParams();
  const {
    round,
    weekColors,
    phase,
    setPhase,
    submitGuess,
    nextRound,
    roundScores,
    totalScore,
    lastScore,
  } = useGame();

  const target = weekColors[round];
  const [guess, setGuess] = useState<HSB>({ h: 180, s: 50, b: 50 });
  const [memoLeft, setMemoLeft] = useState(MEMORIZE_MS);

  // bounce to landing if no game state
  useEffect(() => {
    if (!target) {
      navigate({ to: "/results/$roomId", params: { roomId } });
    }
  }, [target, navigate, roomId]);

  // memorize timer
  useEffect(() => {
    if (phase !== "memorize") return;
    setMemoLeft(MEMORIZE_MS);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const left = Math.max(0, MEMORIZE_MS - (t - start));
      setMemoLeft(left);
      if (left <= 0) setPhase("recall");
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, round, setPhase]);

  // reveal auto-advance
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => {
      if (round + 1 >= TOTAL_ROUNDS) {
        navigate({ to: "/results/$roomId", params: { roomId } });
      } else {
        setGuess({ h: 180, s: 50, b: 50 });
        nextRound();
      }
    }, REVEAL_MS);
    return () => clearTimeout(t);
  }, [phase, round, nextRound, navigate, roomId]);

  // sync UI chroma to target
  useEffect(() => {
    if (!target) return;
    const root = document.documentElement;
    root.style.setProperty("--chroma", String(target.h));
    return () => {
      root.style.removeProperty("--chroma");
    };
  }, [target]);

  const memoPct = (memoLeft / MEMORIZE_MS) * 100;

  if (!target) return null;

  const targetHex = hsbToHex(target);
  const guessHex = hsbToHex(guess);

  const scoreColor =
    lastScore == null
      ? "oklch(0.85 0.2 195)"
      : lastScore >= 85
        ? "oklch(0.78 0.22 145)"
        : lastScore >= 55
          ? "oklch(0.85 0.18 85)"
          : "oklch(0.65 0.26 25)";

  return (
    <main className="relative min-h-screen">
      <ColorOrbs />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <RoundDots round={round} scores={roundScores} />
          <WalletPill />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-6 pb-16 lg:grid-cols-2">
        {/* TARGET PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong scanline relative overflow-hidden rounded-3xl p-8"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Target · Round {round + 1}/{TOTAL_ROUNDS}
            </span>
            <Badge phase={phase} />
          </div>

          <div className="mt-10 flex items-center justify-center">
            <div className="relative">
              {/* countdown ring */}
              <svg className="size-72 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="oklch(0.2 0.025 280)" strokeWidth="2" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={targetHex}
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={phase === "memorize" ? 100 - memoPct : 0}
                  style={{
                    filter: `drop-shadow(0 0 10px ${targetHex})`,
                    transition: phase === "memorize" ? "none" : "stroke-dashoffset 0.4s",
                  }}
                />
              </svg>
              <div className="absolute inset-3 rounded-full overflow-hidden ring-1 ring-border-strong">
                <AnimatePresence mode="wait">
                  {phase === "memorize" ? (
                    <motion.div
                      key="show"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="size-full pulse-ring"
                      style={{ background: targetHex }}
                    />
                  ) : phase === "reveal" ? (
                    <motion.div
                      key="reveal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="size-full"
                      style={{ background: targetHex }}
                    />
                  ) : (
                    <motion.div
                      key="hide"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex size-full items-center justify-center bg-[oklch(0.06_0.015_280)]"
                    >
                      <HelpCircle className="size-16 text-muted-foreground/30" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {phase === "memorize" && `Memorizing · ${(memoLeft / 1000).toFixed(1)}s`}
            {phase === "recall" && "Recreate it from memory"}
            {phase === "reveal" && "Revealed"}
          </div>
        </motion.div>

        {/* GUESS PANEL */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-strong relative overflow-hidden rounded-3xl p-8"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Your Color
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Score · {totalScore}/{TOTAL_ROUNDS * 100}
            </span>
          </div>

          <div className="mt-8 flex items-center gap-6">
            <div
              className="size-32 shrink-0 rounded-2xl ring-1 ring-border-strong transition-[background] duration-200"
              style={{
                background: guessHex,
                boxShadow: `0 0 40px -8px ${guessHex}`,
              }}
            />
            <div className="font-mono text-sm text-muted-foreground space-y-1">
              <div>HUE  <span className="text-foreground tabular-nums">{Math.round(guess.h)}°</span></div>
              <div>SAT  <span className="text-foreground tabular-nums">{Math.round(guess.s)}%</span></div>
              <div>BRT  <span className="text-foreground tabular-nums">{Math.round(guess.b)}%</span></div>
              <div className="pt-1 text-xs uppercase tracking-widest">{guessHex}</div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <HSBSlider
              channel="h"
              label="HUE"
              max={360}
              value={guess.h}
              h={guess.h}
              s={guess.s}
              disabled={phase !== "recall"}
              onChange={(v) => setGuess((g) => ({ ...g, h: v }))}
            />
            <HSBSlider
              channel="s"
              label="SATURATION"
              max={100}
              value={guess.s}
              h={guess.h}
              s={guess.s}
              disabled={phase !== "recall"}
              onChange={(v) => setGuess((g) => ({ ...g, s: v }))}
            />
            <HSBSlider
              channel="b"
              label="BRIGHTNESS"
              max={100}
              value={guess.b}
              h={guess.h}
              s={guess.s}
              disabled={phase !== "recall"}
              onChange={(v) => setGuess((g) => ({ ...g, b: v }))}
            />
          </div>

          <button
            disabled={phase !== "recall"}
            onClick={() => submitGuess(guess)}
            className="mt-8 w-full rounded-2xl bg-foreground py-4 font-display text-sm tracking-[0.3em] text-background transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            SUBMIT GUESS
          </button>

          {/* Reveal overlay */}
          <AnimatePresence>
            {phase === "reveal" && lastScore !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-xl"
              >
                <RevealCard score={lastScore} color={scoreColor} target={target} guess={guess} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}

function Badge({ phase }: { phase: string }) {
  const label =
    phase === "memorize" ? "MEMORIZING" : phase === "recall" ? "RECALL" : phase === "reveal" ? "REVEAL" : "—";
  const color =
    phase === "memorize"
      ? "oklch(0.9 0.23 130)"
      : phase === "recall"
        ? "oklch(0.72 0.28 330)"
        : "oklch(0.85 0.2 195)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.3em]"
      style={{ borderColor: `${color}50`, color, background: `${color}15` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}

function RoundDots({ round, scores }: { round: number; scores: number[] }) {
  return (
    <div className="hidden items-center gap-2 md:flex">
      {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
        const done = i < scores.length;
        const active = i === round;
        return (
          <span
            key={i}
            className="size-2.5 rounded-full transition"
            style={{
              background: done
                ? "oklch(0.85 0.2 195)"
                : active
                  ? "oklch(0.72 0.28 330)"
                  : "oklch(0.25 0.03 280)",
              boxShadow: active ? "0 0 12px oklch(0.72 0.28 330)" : "none",
              transform: active ? "scale(1.4)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

function RevealCard({
  score,
  color,
  target,
  guess,
}: {
  score: number;
  color: string;
  target: HSB;
  guess: HSB;
}) {
  const display = useCount(score, 900);
  const pct = score;
  const c = useMemo(() => 2 * Math.PI * 46, []);
  return (
    <div className="text-center">
      <div className="relative inline-flex">
        <svg className="size-48 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="oklch(0.2 0.025 280)" strokeWidth="3" />
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ strokeDasharray: c, strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (c * pct) / 100 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <div className="font-display text-6xl font-black tabular-nums" style={{ color }}>
              {display}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              accuracy
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-4">
        <Swatch label="TARGET" hsb={target} />
        <Swatch label="YOURS" hsb={guess} />
      </div>
    </div>
  );
}

function Swatch({ label, hsb }: { label: string; hsb: HSB }) {
  const hex = hsbToHex(hsb);
  return (
    <div className="text-left">
      <div
        className="size-16 rounded-xl ring-1 ring-border-strong"
        style={{ background: hex, boxShadow: `0 0 24px -8px ${hex}` }}
      />
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-[10px] text-foreground">{hex}</div>
    </div>
  );
}

function useCount(to: number, ms: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return n;
}
