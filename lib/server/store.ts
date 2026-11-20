import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RoomState } from "../types";
import { ApiError } from "./errors";

/**
 * Persistence for rooms. Public room state lives in `rooms` (readable by
 * clients, pushed over Supabase Realtime); per-player secrets (hidden picks,
 * ballots, authorship) live in `room_secrets`, which only the server can read.
 *
 * Without Supabase env vars an in-memory store is used so the app runs
 * locally with zero setup (single process only — not for production).
 */
export interface Store {
  readonly kind: "supabase" | "memory";
  get(code: string): Promise<{ state: RoomState; version: number } | null>;
  create(code: string, state: RoomState): Promise<boolean>;
  /** Compare-and-swap on `version`; false when someone else wrote first. */
  replace(code: string, version: number, state: RoomState): Promise<boolean>;
  getSecret<T>(code: string, playerId: string, kind: string): Promise<T | null>;
  putSecret(code: string, playerId: string, kind: string, data: unknown): Promise<void>;
  listSecrets<T>(code: string, kind: string): Promise<{ playerId: string; data: T }[]>;
  deleteSecrets(code: string, kinds: string[]): Promise<void>;
  deleteRoomsOlderThan(date: Date): Promise<number>;
}

class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  constructor(private db: SupabaseClient) {}

  async get(code: string) {
    const { data, error } = await this.db.from("rooms").select("state, version").eq("code", code).maybeSingle();
    if (error) throw error;
    return data ? { state: data.state as RoomState, version: data.version as number } : null;
  }

  async create(code: string, state: RoomState) {
    const { error } = await this.db.from("rooms").insert({ code, state, version: 1 });
    if (error?.code === "23505") return false;
    if (error) throw error;
    return true;
  }

  async replace(code: string, version: number, state: RoomState) {
    const { data, error } = await this.db
      .from("rooms")
      .update({ state, version: version + 1, updated_at: new Date().toISOString() })
      .eq("code", code)
      .eq("version", version)
      .select("version");
    if (error) throw error;
    return (data?.length ?? 0) === 1;
  }

  async getSecret<T>(code: string, playerId: string, kind: string) {
    const { data, error } = await this.db
      .from("room_secrets")
      .select("data")
      .eq("code", code)
      .eq("player_id", playerId)
      .eq("kind", kind)
      .maybeSingle();
    if (error) throw error;
    return (data?.data as T) ?? null;
  }

  async putSecret(code: string, playerId: string, kind: string, data: unknown) {
    const { error } = await this.db
      .from("room_secrets")
      .upsert({ code, player_id: playerId, kind, data }, { onConflict: "code,player_id,kind" });
    if (error) throw error;
  }

  async listSecrets<T>(code: string, kind: string) {
    const { data, error } = await this.db.from("room_secrets").select("player_id, data").eq("code", code).eq("kind", kind);
    if (error) throw error;
    return (data ?? []).map((row) => ({ playerId: row.player_id as string, data: row.data as T }));
  }

  async deleteSecrets(code: string, kinds: string[]) {
    const { error } = await this.db.from("room_secrets").delete().eq("code", code).in("kind", kinds);
    if (error) throw error;
  }

  async deleteRoomsOlderThan(date: Date) {
    const { data, error } = await this.db.from("rooms").delete().lt("updated_at", date.toISOString()).select("code");
    if (error) throw error;
    return data?.length ?? 0;
  }
}

type MemoryRoom = { state: RoomState; version: number; updatedAt: number };

class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private rooms = new Map<string, MemoryRoom>();
  private secrets = new Map<string, unknown>();

  private clone<T>(value: T): T {
    return structuredClone(value);
  }

  async get(code: string) {
    const room = this.rooms.get(code);
    return room ? { state: this.clone(room.state), version: room.version } : null;
  }

  async create(code: string, state: RoomState) {
    if (this.rooms.has(code)) return false;
    this.rooms.set(code, { state: this.clone(state), version: 1, updatedAt: Date.now() });
    return true;
  }

  async replace(code: string, version: number, state: RoomState) {
    const room = this.rooms.get(code);
    if (!room || room.version !== version) return false;
    this.rooms.set(code, { state: this.clone(state), version: version + 1, updatedAt: Date.now() });
    return true;
  }

  async getSecret<T>(code: string, playerId: string, kind: string) {
    const value = this.secrets.get(`${code}|${kind}|${playerId}`);
    return value === undefined ? null : (this.clone(value) as T);
  }

  async putSecret(code: string, playerId: string, kind: string, data: unknown) {
    this.secrets.set(`${code}|${kind}|${playerId}`, this.clone(data));
  }

  async listSecrets<T>(code: string, kind: string) {
    const prefix = `${code}|${kind}|`;
    return [...this.secrets.entries()]
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, data]) => ({ playerId: k.slice(prefix.length), data: this.clone(data) as T }));
  }

  async deleteSecrets(code: string, kinds: string[]) {
    for (const k of [...this.secrets.keys()]) {
      const [c, kind] = k.split("|");
      if (c === code && kinds.includes(kind)) this.secrets.delete(k);
    }
  }

  async deleteRoomsOlderThan(date: Date) {
    let n = 0;
    for (const [code, room] of this.rooms) {
      if (room.updatedAt < date.getTime()) {
        this.rooms.delete(code);
        await this.deleteSecrets(code, ["films", "vote", "authors"]);
        n++;
      }
    }
    return n;
  }
}

const globalForStore = globalThis as unknown as { __kinournaStore?: Store };

export function getStore(): Store {
  if (globalForStore.__kinournaStore) return globalForStore.__kinournaStore;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  let store: Store;
  if (url && key) {
    store = new SupabaseStore(createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }));
  } else {
    // On Vercel every request may hit a different server instance, so an
    // in-memory store would make rooms flicker between "found" and "not
    // found". Refuse loudly instead of half-working.
    if (process.env.VERCEL) {
      console.error("[kinourna] Supabase env vars are missing on Vercel.");
      throw new ApiError(
        503,
        "Сервер не подключён к базе: добавь ключи Supabase в Vercel → Settings → Environment Variables и пересобери проект.",
      );
    }
    store = new MemoryStore();
  }
  globalForStore.__kinournaStore = store;
  return store;
}
