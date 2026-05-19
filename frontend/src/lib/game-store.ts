import { create } from "zustand";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import { createWalletClient, custom, defineChain } from "viem";
import {
  type HSB,
  generateWeeklyColors,
  scoreRound,
  shortRoomCode,
  truncateAddr,
  weekKey,
} from "./color";

// ── GenLayer setup ──────────────────────────────────────────────────────────
const CONTRACT = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined;
const DEMO_KEY = import.meta.env.VITE_DEPLOYER_KEY as string | undefined;

const glClient = createClient({ chain: studionet });

// Active signing account — set on wallet connect
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeAccount: any = DEMO_KEY ? createAccount(DEMO_KEY as `0x${string}`) : null;

const STUDIONET_CHAIN_ID = "0xF22F"; // 61999

const STUDIONET_PARAMS = {
  chainId: STUDIONET_CHAIN_ID,
  chainName: "GenLayer Studio Network",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: ["https://studio.genlayer.com/"],
};

// Viem chain definition for studionet — ensures MetaMask signs with chain ID 61999
const studionetViemChain = defineChain({
  id: 61999,
  name: "GenLayer Studio Network",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } },
});

export async function connectMetaMask(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("MetaMask not found");

  // Request accounts
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  const address = accounts[0] as `0x${string}`;

  // Add studionet if not added yet
  try {
    await eth.request({ method: "wallet_addEthereumChain", params: [STUDIONET_PARAMS] });
  } catch { /* already added */ }

  // Force switch to studionet
  await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET_CHAIN_ID }] });

  // Create viem WalletClient with studionet chain — MetaMask will sign with chain ID 61999
  const walletClient = createWalletClient({
    account: address,
    chain: studionetViemChain,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: custom(eth),
  });

  activeAccount = walletClient.account;
  return address;
}

export function connectDemoAccount(): string {
  if (!DEMO_KEY) throw new Error("No demo key configured");
  activeAccount = createAccount(DEMO_KEY as `0x${string}`);
  return activeAccount.address as string;
}

async function writeGL(fn: string, args: unknown[]): Promise<void> {
  if (!activeAccount || !CONTRACT) return;
  const h = await glClient.writeContract({
    account: activeAccount,
    address: CONTRACT as `0x${string}`,
    functionName: fn,
    args: args as never,
    value: BigInt(0),
  });
  await glClient.waitForTransactionReceipt({
    hash: h,
    status: TransactionStatus.ACCEPTED,
  });
}

async function readGL(fn: string, args: unknown[]): Promise<string> {
  if (!CONTRACT) return "[]";
  return (await glClient.readContract({ address: CONTRACT as `0x${string}`, functionName: fn, args: args as never })) as string;
}

function addrToName(addr: string): string {
  const prefixes = ["PRISM", "VOID", "NEON", "ECHO", "FLUX", "NOVA", "HEX", "GLITCH", "AURA", "SPECTRA"];
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  return `${prefixes[h % prefixes.length]}_${String(h % 99).padStart(2, "0")}`;
}

// ── Types ───────────────────────────────────────────────────────────────────
export type Player = { address: string; name: string; isHost?: boolean; ready?: boolean };
export type Phase = "idle" | "memorize" | "recall" | "reveal";
export type LeaderboardEntry = { address: string; name: string; xp: number; weekScore: number };

type GameState = {
  walletAddress: string | null;
  weekColors: HSB[];
  generatedThisWeek: boolean;
  roomId: string | null;
  players: Player[];
  isHost: boolean;
  round: number;
  phase: Phase;
  roundScores: number[];
  totalScore: number;
  lastPlayerHSB: HSB | null;
  lastScore: number | null;
  leaderboard: LeaderboardEntry[];

  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  generateColors: () => Promise<void>;
  createRoom: () => Promise<string>;
  joinRoom: (id: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: () => Promise<void>;
  submitFinalScores: (roomId: string, total: number) => Promise<void>;
  setPhase: (p: Phase) => void;
  submitGuess: (hsb: HSB) => number;
  nextRound: () => void;
  resetGame: () => void;
  refreshLeaderboard: () => Promise<void>;
};

// ── Store ────────────────────────────────────────────────────────────────────
export const useGame = create<GameState>((set, get) => ({
  walletAddress: null,
  weekColors: [],
  generatedThisWeek: false,
  roomId: null,
  players: [],
  isHost: false,
  round: 0,
  phase: "idle",
  roundScores: [],
  totalScore: 0,
  lastPlayerHSB: null,
  lastScore: null,
  leaderboard: [],

  connectWallet: (address: string) => {
    set({ walletAddress: address });
  },
  disconnectWallet: () => set({ walletAddress: null }),

  generateColors: async () => {
    try {
      await writeGL("generate_weekly_colors", [weekKey()]);
      const raw = await readGL("get_weekly_colors", [weekKey()]);
      const parsed: { hue: number; saturation: number; brightness: number }[] = JSON.parse(raw || "[]");
      if (parsed.length === 7) {
        const colors: HSB[] = parsed.map((c) => ({ h: c.hue, s: c.saturation, b: c.brightness }));
        set({ weekColors: colors, generatedThisWeek: true });
        return;
      }
    } catch (e) {
      console.warn("generateColors contract error:", e);
    }
    const colors = generateWeeklyColors(weekKey());
    set({ weekColors: colors, generatedThisWeek: true });
  },

  createRoom: async () => {
    const id = shortRoomCode();
    try {
      await writeGL("create_room", [id]);
    } catch (e) {
      console.warn("create_room error:", e);
    }
    const me = activeAccount?.address ?? "0x0000";
    set({ roomId: id, isHost: true, players: [{ address: me, name: "YOU", isHost: true }] });
    return id;
  },

  joinRoom: async (id: string) => {
    if (!id || id.length < 4) return false;
    const upper = id.toUpperCase();
    try {
      await writeGL("join_room", [upper]);
    } catch (e) {
      console.warn("join_room error:", e);
    }
    const me = activeAccount?.address ?? "0x0000";
    set({ roomId: upper, isHost: false, players: [{ address: me, name: "YOU" }] });
    return true;
  },

  leaveRoom: () =>
    set({ roomId: null, players: [], isHost: false, round: 0, phase: "idle", roundScores: [], totalScore: 0 }),

  startGame: async () => {
    const { roomId, weekColors } = get();
    if (weekColors.length === 0) await get().generateColors();
    try {
      if (roomId) await writeGL("start_game", [roomId]);
    } catch (e) {
      console.warn("start_game error:", e);
    }
    set({ round: 0, phase: "memorize", roundScores: [], totalScore: 0 });
  },

  submitFinalScores: async (roomId: string, total: number) => {
    try {
      await writeGL("submit_scores", [roomId, BigInt(total), weekKey()]);
      await get().refreshLeaderboard();
    } catch (e) {
      console.warn("submit_scores error:", e);
    }
  },

  refreshLeaderboard: async () => {
    try {
      const raw = await readGL("get_leaderboard_top10", []);
      const entries: { address: string; xp: number }[] = JSON.parse(raw || "[]");
      if (entries.length > 0) {
        const lb: LeaderboardEntry[] = entries.map((e) => ({
          address: truncateAddr(e.address),
          name: addrToName(e.address),
          xp: e.xp,
          weekScore: e.xp,
        }));
        set({ leaderboard: lb });
      }
    } catch (e) {
      console.warn("refreshLeaderboard error:", e);
    }
  },

  setPhase: (p) => set({ phase: p }),

  submitGuess: (hsb) => {
    const { round, weekColors, roundScores } = get();
    const target = weekColors[round];
    if (!target) return 0;
    const s = scoreRound(hsb, target);
    const next = [...roundScores, s];
    set({ roundScores: next, totalScore: next.reduce((a, b) => a + b, 0), lastPlayerHSB: hsb, lastScore: s, phase: "reveal" });
    return s;
  },

  nextRound: () => {
    set((st) => ({ round: st.round + 1, phase: "memorize", lastPlayerHSB: null, lastScore: null }));
  },

  resetGame: () =>
    set({ round: 0, phase: "idle", roundScores: [], totalScore: 0, lastPlayerHSB: null, lastScore: null }),
}));
