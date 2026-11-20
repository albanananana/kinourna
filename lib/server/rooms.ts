import "server-only";
import { randomInt } from "node:crypto";
import {
  MAX_PER_PLAYER,
  MAX_PLAYERS,
  applyStrike,
  cleanName,
  currentStriker,
  drawFromUrn,
  dropFromOrder,
  initialState,
  isValidCode,
  makeCode,
  manualKey,
  mergePicks,
  pickHue,
  remainingAfterStrikes,
  shuffle,
  tallyVotes,
  type Rng,
} from "../game";
import type { Action, Film, MeData, Player, RoomState, Session } from "../types";
import { newPlayerId, signSession, verifySession } from "./auth";
import { ApiError } from "./errors";
import { getStore } from "./store";

const rng: Rng = (n) => (n <= 1 ? 0 : randomInt(n));

/** Secret row that stores film authorship for the whole room. */
const ROOM_ROW = "__room";

export { ApiError };

const NOT_FOUND = () => new ApiError(404, "Комната не найдена — проверь код.");

async function load(code: string): Promise<RoomState> {
  if (!isValidCode(code)) throw NOT_FOUND();
  const row = await getStore().get(code);
  if (!row) throw NOT_FOUND();
  return row.state;
}

/**
 * Optimistic-concurrency update: re-reads and re-applies `fn` until the write
 * lands. `fn` gets a private copy; returning `null` means "nothing to change"
 * (e.g. a double tap that lost the race) and yields the current state.
 */
async function mutate(code: string, fn: (state: RoomState) => RoomState | null): Promise<RoomState> {
  const store = getStore();
  for (let attempt = 0; attempt < 10; attempt++) {
    const row = await store.get(code);
    if (!row) throw NOT_FOUND();
    const next = fn(structuredClone(row.state));
    if (next === null) return row.state;
    next.rev = row.state.rev + 1;
    if (await store.replace(code, row.version, next)) return next;
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 60));
  }
  throw new ApiError(503, "Слишком много одновременных действий, попробуй ещё раз.");
}

function requireName(raw: unknown): string {
  const name = typeof raw === "string" ? cleanName(raw) : "";
  if (!name) throw new ApiError(400, "Как тебя зовут?");
  return name;
}

export async function createRoom(rawName: unknown): Promise<{ state: RoomState; session: Session }> {
  const name = requireName(rawName);
  const store = getStore();
  for (let i = 0; i < 12; i++) {
    const code = makeCode(rng);
    const host: Player = { id: newPlayerId(), name, hue: rng(8), joinedAt: Date.now() };
    const state = initialState(code, host, Date.now());
    if (await store.create(code, state)) return { state, session: signSession(code, host.id) };
  }
  throw new ApiError(503, "Не получилось создать комнату, попробуй ещё раз.");
}

export async function getRoom(code: string): Promise<RoomState> {
  return load(code);
}

export async function joinRoom(
  code: string,
  rawName: unknown,
  existing?: Partial<Session>,
): Promise<{ state: RoomState; session: Session }> {
  const current = await load(code);
  if (verifySession(code, existing) && current.players.some((p) => p.id === existing.playerId)) {
    return { state: current, session: existing };
  }
  const name = requireName(rawName);
  const id = newPlayerId();
  const state = await mutate(code, (s) => {
    if (s.players.length >= MAX_PLAYERS) throw new ApiError(409, "В комнате уже нет мест.");
    const taken = new Set(s.players.map((p) => p.name.toLowerCase()));
    let finalName = name;
    for (let n = 2; taken.has(finalName.toLowerCase()); n++) finalName = `${name} ${n}`;
    s.players.push({ id, name: finalName, hue: pickHue(s.players, rng), joinedAt: Date.now() });
    return s;
  });
  return { state, session: signSession(code, id) };
}

function authorize(code: string, state: RoomState, session: Partial<Session>): string {
  if (!verifySession(code, session)) throw new ApiError(401, "Сессия не найдена — зайди в комнату заново.");
  if (!state.players.some((p) => p.id === session.playerId)) {
    throw new ApiError(403, "Тебя нет в этой комнате — зайди заново.");
  }
  return session.playerId;
}

export async function getMe(code: string, session: Partial<Session>): Promise<MeData> {
  const state = await load(code);
  const playerId = authorize(code, state, session);
  const store = getStore();
  const [films, vote, authors] = await Promise.all([
    store.getSecret<Film[]>(code, playerId, "films"),
    store.getSecret<string[]>(code, playerId, "vote"),
    store.getSecret<Record<string, string[]>>(code, ROOM_ROW, "authors"),
  ]);
  const own = Object.entries(authors ?? {})
    .filter(([, ids]) => ids.includes(playerId))
    .map(([key]) => key);
  return { films: films ?? [], vote, own };
}

const POSTER_RE = /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/;
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/** Never trust a film object coming from the browser. */
function sanitizeFilm(raw: unknown): Film {
  const f = (raw ?? {}) as Record<string, unknown>;
  const title = str(f.title, 120);
  if (!title) throw new ApiError(400, "У фильма нет названия.");
  const mediaType = f.mediaType === "movie" || f.mediaType === "tv" ? f.mediaType : undefined;
  const tmdbId = typeof f.tmdbId === "number" && Number.isInteger(f.tmdbId) && f.tmdbId > 0 ? f.tmdbId : undefined;
  const key = mediaType && tmdbId ? `${mediaType}:${tmdbId}` : manualKey(title);
  if (key === "manual:") throw new ApiError(400, "Название слишком странное.");
  const poster = typeof f.poster === "string" && POSTER_RE.test(f.poster) ? f.poster : undefined;
  const backdrop = typeof f.backdrop === "string" && POSTER_RE.test(f.backdrop) ? f.backdrop : undefined;
  const year = typeof f.year === "string" && /^\d{4}$/.test(f.year) ? f.year : undefined;
  const rating = typeof f.rating === "number" && f.rating >= 0 && f.rating <= 10 ? Math.round(f.rating * 10) / 10 : undefined;
  return {
    key,
    tmdbId,
    mediaType,
    title,
    enTitle: str(f.enTitle, 120),
    originalTitle: str(f.originalTitle, 120),
    year,
    poster,
    backdrop,
    overview: str(f.overview, 700),
    rating,
    animation: f.animation === true ? true : undefined,
  };
}

async function authorsOf(code: string) {
  return (await getStore().getSecret<Record<string, string[]>>(code, ROOM_ROW, "authors")) ?? {};
}

async function finalizeVote(code: string): Promise<RoomState> {
  const [ballots, authors] = await Promise.all([getStore().listSecrets<string[]>(code, "vote"), authorsOf(code)]);
  return mutate(code, (s) => {
    if (s.phase !== "play" || s.play?.kind !== "vote") return null;
    const counted = ballots.filter((b) => s.play?.kind === "vote" && s.play.voters.includes(b.playerId));
    const { key, tally, tied } = tallyVotes(
      s.board,
      counted.map((b) => b.data),
      rng,
    );
    s.phase = "result";
    s.result = { key, via: "vote", at: Date.now(), authors, tally, tied };
    return s;
  });
}

export type ActResult = { state: RoomState; me?: MeData };

export async function act(code: string, session: Partial<Session>, action: Action): Promise<ActResult> {
  const snapshot = await load(code);
  const me = authorize(code, snapshot, session);
  const store = getStore();

  const hostOnly = (s: RoomState) => {
    if (s.hostId !== me) throw new ApiError(403, "Это может сделать только ведущий.");
  };

  switch (action.type) {
    case "rename": {
      const name = requireName(action.name);
      return {
        state: await mutate(code, (s) => {
          const p = s.players.find((x) => x.id === me);
          if (p) p.name = name;
          return s;
        }),
      };
    }

    case "settings": {
      hostOnly(snapshot);
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "lobby" && s.phase !== "collect") throw new ApiError(409, "Настройки уже не поменять.");
          const { perPlayer, allowOwn } = action.settings ?? {};
          if (typeof perPlayer === "number") {
            s.settings.perPlayer = Math.min(MAX_PER_PLAYER, Math.max(1, Math.round(perPlayer)));
          }
          if (typeof allowOwn === "boolean") s.settings.allowOwn = allowOwn;
          return s;
        }),
      };
    }

    case "startCollect": {
      hostOnly(snapshot);
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "lobby") return null;
          s.phase = "collect";
          s.counts = {};
          return s;
        }),
      };
    }

    case "addFilm":
    case "removeFilm": {
      if (snapshot.phase !== "collect") throw new ApiError(409, "Сейчас нельзя менять фильмы.");
      const films = (await store.getSecret<Film[]>(code, me, "films")) ?? [];
      let next = films;
      if (action.type === "addFilm") {
        const film = sanitizeFilm(action.film);
        if (films.some((f) => f.key === film.key)) throw new ApiError(409, "Этот фильм уже в твоём списке.");
        if (films.length >= snapshot.settings.perPlayer) {
          throw new ApiError(409, `Можно загадать не больше ${snapshot.settings.perPlayer}.`);
        }
        next = [...films, film];
      } else {
        next = films.filter((f) => f.key !== action.key);
      }
      await store.putSecret(code, me, "films", next);
      const state = await mutate(code, (s) => {
        if (s.phase !== "collect") throw new ApiError(409, "Урну уже открыли.");
        s.counts[me] = next.length;
        return s;
      });
      return { state, me: { films: next, vote: null, own: [] } };
    }

    case "reveal": {
      hostOnly(snapshot);
      if (snapshot.phase !== "collect") return { state: snapshot };
      const subs = await store.listSecrets<Film[]>(code, "films");
      const players = new Set(snapshot.players.map((p) => p.id));
      const { board, authors } = mergePicks(
        subs.filter((s) => players.has(s.playerId)).map((s) => ({ playerId: s.playerId, films: s.data })),
        rng,
      );
      if (board.length < 2) throw new ApiError(409, "В урне меньше двух фильмов — загадайте ещё.");
      await store.putSecret(code, ROOM_ROW, "authors", authors);
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "collect") return null;
          s.phase = "board";
          s.board = board;
          s.mode = undefined;
          s.play = undefined;
          s.result = undefined;
          return s;
        }),
      };
    }

    case "startMode": {
      hostOnly(snapshot);
      const mode = action.mode;
      if (mode !== "urn" && mode !== "vote" && mode !== "strike") throw new ApiError(400, "Неизвестный режим.");
      if (mode === "vote") await store.deleteSecrets(code, ["vote"]);
      const authors = mode === "strike" ? await authorsOf(code) : {};
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "board") throw new ApiError(409, "Сначала откройте урну.");
          s.mode = mode;
          s.result = undefined;
          if (mode === "urn") {
            s.play = { kind: "urn", excluded: [] };
          } else if (mode === "vote") {
            s.play = { kind: "vote", voters: s.players.map((p) => p.id), voted: [] };
          } else {
            s.play = { kind: "strike", order: shuffle(s.players.map((p) => p.id), rng), turn: 0, struck: [] };
            if (s.board.length === 1) {
              s.phase = "result";
              s.result = { key: s.board[0].key, via: "strike", at: Date.now(), authors };
              return s;
            }
          }
          s.phase = "play";
          return s;
        }),
      };
    }

    case "draw":
    case "redraw": {
      const authors = await authorsOf(code);
      return {
        state: await mutate(code, (s) => {
          if (s.play?.kind !== "urn") return null;
          if (action.type === "draw") {
            if (s.phase !== "play") return null;
          } else {
            hostOnly(s);
            if (s.phase !== "result" || !s.result) return null;
            s.play.excluded = [...s.play.excluded, s.result.key];
          }
          const key = drawFromUrn(s.board, s.play.excluded, rng);
          if (!key) throw new ApiError(409, "В урне больше не осталось билетов.");
          s.phase = "result";
          s.result = { key, via: "urn", at: Date.now(), authors };
          return s;
        }),
      };
    }

    case "vote": {
      if (snapshot.phase !== "play" || snapshot.play?.kind !== "vote") {
        throw new ApiError(409, "Голосование уже закончилось.");
      }
      if (!snapshot.play.voters.includes(me)) throw new ApiError(403, "Голосование началось до твоего прихода.");
      const boardKeys = new Set(snapshot.board.map((f) => f.key));
      let keys = [...new Set((action.keys ?? []).filter((k) => typeof k === "string" && boardKeys.has(k)))];
      if (!snapshot.settings.allowOwn) {
        const authors = await authorsOf(code);
        keys = keys.filter((k) => !(authors[k] ?? []).includes(me));
      }
      await store.putSecret(code, me, "vote", keys);
      let state = await mutate(code, (s) => {
        if (s.phase !== "play" || s.play?.kind !== "vote") throw new ApiError(409, "Голосование уже закончилось.");
        if (!s.play.voted.includes(me)) s.play.voted.push(me);
        return s;
      });
      if (state.play?.kind === "vote" && state.play.voters.every((id) => state.play?.kind === "vote" && state.play.voted.includes(id))) {
        state = await finalizeVote(code);
      }
      const meData = await getMe(code, session);
      return { state, me: meData };
    }

    case "closeVote": {
      hostOnly(snapshot);
      return { state: await finalizeVote(code) };
    }

    case "strike": {
      const authors = await authorsOf(code);
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "play" || s.play?.kind !== "strike") throw new ApiError(409, "Вычёркивание уже закончилось.");
          if (currentStriker(s.play) !== me) throw new ApiError(409, "Сейчас не твой ход.");
          if (!remainingAfterStrikes(s.board, s.play).some((f) => f.key === action.key)) {
            throw new ApiError(409, "Этот фильм уже вычеркнули.");
          }
          const { play, winner } = applyStrike(s.board, s.play, action.key, me);
          s.play = play;
          if (winner) {
            s.phase = "result";
            s.result = { key: winner, via: "strike", at: Date.now(), authors };
          }
          return s;
        }),
      };
    }

    case "skipTurn": {
      hostOnly(snapshot);
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "play" || s.play?.kind !== "strike") throw new ApiError(409, "Сейчас нечего пропускать.");
          s.play.turn = (s.play.turn + 1) % Math.max(1, s.play.order.length);
          return s;
        }),
      };
    }

    case "backToBoard": {
      hostOnly(snapshot);
      return {
        state: await mutate(code, (s) => {
          if (s.phase !== "play" && s.phase !== "result") throw new ApiError(409, "Сейчас нельзя вернуться к доске.");
          s.phase = "board";
          s.play = undefined;
          s.result = undefined;
          s.mode = undefined;
          return s;
        }),
      };
    }

    case "newRound": {
      hostOnly(snapshot);
      await store.deleteSecrets(code, ["films", "vote", "authors"]);
      return {
        state: await mutate(code, (s) => {
          s.phase = "collect";
          s.counts = {};
          s.board = [];
          s.play = undefined;
          s.result = undefined;
          s.mode = undefined;
          s.round += 1;
          return s;
        }),
      };
    }

    case "kick": {
      hostOnly(snapshot);
      if (action.playerId === me) throw new ApiError(400, "Себя выгнать нельзя.");
      let state = await mutate(code, (s) => {
        s.players = s.players.filter((p) => p.id !== action.playerId);
        delete s.counts[action.playerId];
        if (s.play?.kind === "strike") s.play = dropFromOrder(s.play, action.playerId);
        if (s.play?.kind === "vote") {
          s.play.voters = s.play.voters.filter((id) => id !== action.playerId);
          s.play.voted = s.play.voted.filter((id) => id !== action.playerId);
        }
        return s;
      });
      const play = state.play;
      if (state.phase === "play" && play?.kind === "vote" && play.voters.length && play.voters.every((id) => play.voted.includes(id))) {
        state = await finalizeVote(code);
      }
      return { state };
    }

    default:
      throw new ApiError(400, "Неизвестное действие.");
  }
}
