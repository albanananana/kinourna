export type MediaType = "movie" | "tv";

/** A title as it travels through the app (search result, pick, board entry). */
export type Film = {
  /** Stable identity: "movie:603", "tv:1396" or "manual:<normalized title>". */
  key: string;
  tmdbId?: number;
  mediaType?: MediaType;
  /** Localized (Russian) title, falls back to the original. */
  title: string;
  /** English title when it differs from `title`. */
  enTitle?: string;
  originalTitle?: string;
  year?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  animation?: boolean;
};

export type BoardFilm = Film & {
  /** How many players picked this title — doubles as tickets in the urn. */
  weight: number;
};

export type Phase = "lobby" | "collect" | "board" | "play" | "result";
export type Mode = "urn" | "vote" | "strike";

export type Player = {
  id: string;
  name: string;
  /** Index into the avatar palette. */
  hue: number;
  joinedAt: number;
};

export type Settings = {
  perPlayer: number;
  /** Allow voting for / proposing-and-backing your own picks. */
  allowOwn: boolean;
};

export type UrnPlay = { kind: "urn"; excluded: string[] };
export type VotePlay = { kind: "vote"; voters: string[]; voted: string[] };
export type StrikePlay = {
  kind: "strike";
  order: string[];
  turn: number;
  struck: { key: string; by: string }[];
};
export type Play = UrnPlay | VotePlay | StrikePlay;

export type Result = {
  key: string;
  via: Mode;
  at: number;
  /** filmKey → player ids who proposed it; revealed only at the result. */
  authors: Record<string, string[]>;
  tally?: Record<string, number>;
  /** Keys that were tied for first place (vote mode, broken by the urn). */
  tied?: string[];
};

export type RoomState = {
  code: string;
  rev: number;
  phase: Phase;
  hostId: string;
  settings: Settings;
  players: Player[];
  /** collect: player id → number of films submitted. */
  counts: Record<string, number>;
  board: BoardFilm[];
  mode?: Mode;
  play?: Play;
  result?: Result;
  round: number;
  createdAt: number;
};

export type Session = { playerId: string; token: string };

export type MeData = {
  films: Film[];
  vote: string[] | null;
  /** Keys of board films this player proposed (after reveal). */
  own: string[];
};

export type Action =
  | { type: "settings"; settings: Partial<Settings> }
  | { type: "startCollect" }
  | { type: "addFilm"; film: Film }
  | { type: "removeFilm"; key: string }
  | { type: "reveal" }
  | { type: "startMode"; mode: Mode }
  | { type: "draw" }
  | { type: "redraw" }
  | { type: "vote"; keys: string[] }
  | { type: "closeVote" }
  | { type: "strike"; key: string }
  | { type: "skipTurn" }
  | { type: "backToBoard" }
  | { type: "newRound" }
  | { type: "kick"; playerId: string }
  | { type: "rename"; name: string };
