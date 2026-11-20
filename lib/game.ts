import type { BackTarget, BoardFilm, Film, Phase, Player, RoomState, StrikePlay } from "./types";

/** Returns a uniformly random integer in [0, n). */
export type Rng = (n: number) => number;

export const mathRng: Rng = (n) => Math.floor(Math.random() * n);

/** No 0/O, 1/I/L — codes are read aloud and typed on phones. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 4;

export function makeCode(rng: Rng): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[rng(CODE_ALPHABET.length)];
  return code;
}

export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
}

export function isValidCode(code: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(code);
}

export const PLAYER_HUES = 8;
export const MAX_PLAYERS = 12;
export const MAX_PER_PLAYER = 5;

/** Stages in the order a room walks through them. */
export const PHASES: readonly Phase[] = ["lobby", "collect", "board", "play", "result"];

/** True when `to` is a stage the room has already passed and can return to. */
export function canGoBack(from: Phase, to: unknown): to is BackTarget {
  if (to !== "lobby" && to !== "collect" && to !== "board") return false;
  return PHASES.indexOf(to) < PHASES.indexOf(from);
}

/**
 * Steps the room back to an earlier stage. Everyone's picks survive (they live
 * in secrets and `counts`); whatever was built on top of them is dropped.
 */
export function rewind(s: RoomState, to: BackTarget): RoomState {
  s.phase = to;
  s.mode = undefined;
  s.play = undefined;
  s.result = undefined;
  if (to !== "board") s.board = [];
  return s;
}

export function initialState(code: string, host: Player, now: number): RoomState {
  return {
    code,
    rev: 1,
    phase: "lobby",
    hostId: host.id,
    settings: { perPlayer: 3, allowOwn: false },
    players: [host],
    counts: {},
    board: [],
    round: 1,
    createdAt: now,
  };
}

export function pickHue(players: Player[], rng: Rng): number {
  const used = new Set(players.map((p) => p.hue));
  const free = Array.from({ length: PLAYER_HUES }, (_, i) => i).filter((h) => !used.has(h));
  return free.length ? free[rng(free.length)] : rng(PLAYER_HUES);
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 20);
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function manualKey(title: string): string {
  return `manual:${normalizeTitle(title)}`;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Merges every player's secret picks into one board. Duplicates collapse into
 * one entry with a higher weight; the order is shuffled so the board doesn't
 * leak who proposed what.
 */
export function mergePicks(
  submissions: { playerId: string; films: Film[] }[],
  rng: Rng,
): { board: BoardFilm[]; authors: Record<string, string[]> } {
  const byKey = new Map<string, BoardFilm>();
  const authors: Record<string, string[]> = {};
  for (const { playerId, films } of submissions) {
    for (const film of films) {
      const existing = byKey.get(film.key);
      if (existing) {
        if (!authors[film.key].includes(playerId)) {
          existing.weight += 1;
          authors[film.key].push(playerId);
        }
      } else {
        byKey.set(film.key, { ...film, weight: 1 });
        authors[film.key] = [playerId];
      }
    }
  }
  return { board: shuffle([...byKey.values()], rng), authors };
}

export function weightedPick<T extends { weight: number }>(items: readonly T[], rng: Rng): T | null {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) return null;
  let ticket = rng(total);
  for (const item of items) {
    const w = Math.max(0, item.weight);
    if (ticket < w) return item;
    ticket -= w;
  }
  return null;
}

export function drawFromUrn(board: readonly BoardFilm[], excluded: readonly string[], rng: Rng): string | null {
  const pool = board.filter((f) => !excluded.includes(f.key));
  return weightedPick(pool, rng)?.key ?? null;
}

/** Approval voting: most approvals wins, ties are settled by the urn. */
export function tallyVotes(
  board: readonly BoardFilm[],
  ballots: readonly string[][],
  rng: Rng,
): { key: string; tally: Record<string, number>; tied: string[] } {
  const tally: Record<string, number> = Object.fromEntries(board.map((f) => [f.key, 0]));
  for (const ballot of ballots) {
    for (const key of new Set(ballot)) if (key in tally) tally[key] += 1;
  }
  const best = Math.max(...Object.values(tally));
  const tied = board.filter((f) => tally[f.key] === best).map((f) => f.key);
  const key = tied.length === 1 ? tied[0] : tied[rng(tied.length)];
  return { key, tally, tied: tied.length > 1 ? tied : [] };
}

export function remainingAfterStrikes(board: readonly BoardFilm[], play: StrikePlay): BoardFilm[] {
  const struck = new Set(play.struck.map((s) => s.key));
  return board.filter((f) => !struck.has(f.key));
}

export function currentStriker(play: StrikePlay): string | undefined {
  return play.order.length ? play.order[play.turn % play.order.length] : undefined;
}

/** Applies one strike; returns the next play state and the winner once one film is left. */
export function applyStrike(
  board: readonly BoardFilm[],
  play: StrikePlay,
  key: string,
  by: string,
): { play: StrikePlay; winner: string | null } {
  const next: StrikePlay = {
    ...play,
    struck: [...play.struck, { key, by }],
    turn: (play.turn + 1) % Math.max(1, play.order.length),
  };
  const left = remainingAfterStrikes(board, next);
  return { play: next, winner: left.length === 1 ? left[0].key : null };
}

/** Removes a player from the strike rotation without skipping anyone else's turn. */
export function dropFromOrder(play: StrikePlay, playerId: string): StrikePlay {
  const idx = play.order.indexOf(playerId);
  if (idx === -1) return play;
  const order = play.order.filter((id) => id !== playerId);
  const current = play.turn % Math.max(1, play.order.length);
  let turn = current > idx ? current - 1 : current;
  if (order.length) turn %= order.length;
  else turn = 0;
  return { ...play, order, turn };
}
