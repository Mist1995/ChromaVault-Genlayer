// HSB color utilities + scoring

export type HSB = { h: number; s: number; b: number };

export const weekKey = () => String(Math.floor(Date.now() / 1000 / 604800));

export function hsbToHex({ h, s, b }: HSB): string {
  const sat = s / 100;
  const val = b / 100;
  const c = val * sat;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, bl = 0;
  if (hp < 1) [r, g, bl] = [c, x, 0];
  else if (hp < 2) [r, g, bl] = [x, c, 0];
  else if (hp < 3) [r, g, bl] = [0, c, x];
  else if (hp < 4) [r, g, bl] = [0, x, c];
  else if (hp < 5) [r, g, bl] = [x, 0, c];
  else [r, g, bl] = [c, 0, x];
  const m = val - c;
  const to = (v: number) =>
    Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(bl)}`;
}

export function hsbToCss({ h, s, b }: HSB): string {
  return hsbToHex({ h, s, b });
}

/** Score 0..100 for one round comparing player vs target HSB. */
export function scoreRound(player: HSB, target: HSB): number {
  // hue distance is circular
  const dh = Math.min(Math.abs(player.h - target.h), 360 - Math.abs(player.h - target.h));
  const ds = Math.abs(player.s - target.s);
  const db = Math.abs(player.b - target.b);
  // normalize to 0..1 (lower better)
  const nh = dh / 180; // 0..1
  const ns = ds / 100;
  const nb = db / 100;
  // weighted average (hue weighs slightly more)
  const err = (nh * 1.2 + ns + nb) / 3.2;
  return Math.max(0, Math.round((1 - err) * 100));
}

export function truncateAddr(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Deterministic color avatar from any string. */
export function addrHue(addr: string): number {
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** Deterministic pseudo-random weekly colors (used if no contract). */
export function generateWeeklyColors(seed: string, count = 7): HSB[] {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 131 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  return Array.from({ length: count }, () => ({
    h: Math.floor(rand() * 360),
    s: 40 + Math.floor(rand() * 60),
    b: 45 + Math.floor(rand() * 55),
  }));
}

export function shortRoomCode(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 6; i++) r += a[Math.floor(Math.random() * a.length)];
  return r;
}
