import type { Lang } from "../i18n/config";
import type { Action, Film, MeData, RoomState, Session } from "../types";

/** A failed request; `code` is a key of the dictionary's `errors`. */
export class RequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    public params?: Record<string, string | number>,
  ) {
    super(code);
  }
}

async function request<T>(url: string, init?: RequestInit & { session?: Session | null }): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("content-type", "application/json");
  if (init?.session) {
    headers.set("x-player", init.session.playerId);
    headers.set("x-token", init.session.token);
  }
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, cache: "no-store" });
  } catch {
    throw new RequestError(0, "network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { error, params } = data as { error?: string; params?: Record<string, string | number> };
    throw new RequestError(res.status, error ?? "generic", params);
  }
  return data as T;
}

export const api = {
  create: (name: string) =>
    request<{ state: RoomState; session: Session }>("/api/rooms", { method: "POST", body: JSON.stringify({ name }) }),

  join: (code: string, name: string, session?: Session | null) =>
    request<{ state: RoomState; session: Session }>(`/api/rooms/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ name, session }),
    }),

  room: (code: string) => request<{ state: RoomState }>(`/api/rooms/${code}`),

  me: (code: string, session: Session) => request<MeData>(`/api/rooms/${code}/me`, { session }),

  act: (code: string, session: Session, action: Action) =>
    request<{ state: RoomState; me?: MeData }>(`/api/rooms/${code}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
      session,
    }),

  search: (q: string, lang: Lang, signal?: AbortSignal) =>
    request<{ results: Film[]; demo: boolean }>(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`, { signal }),
};
