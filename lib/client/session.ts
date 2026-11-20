import type { Session } from "../types";

const roomKey = (code: string) => `kinourna:room:${code}`;
const NAME_KEY = "kinourna:name";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function loadSession(code: string): Session | null {
  return safe(() => {
    const raw = localStorage.getItem(roomKey(code));
    const parsed = raw ? (JSON.parse(raw) as Session) : null;
    return parsed?.playerId && parsed.token ? parsed : null;
  }, null);
}

export function saveSession(code: string, session: Session) {
  safe(() => localStorage.setItem(roomKey(code), JSON.stringify(session)), undefined);
}

export function clearSession(code: string) {
  safe(() => localStorage.removeItem(roomKey(code)), undefined);
}

export function loadName(): string {
  return safe(() => localStorage.getItem(NAME_KEY) ?? "", "");
}

export function saveName(name: string) {
  safe(() => localStorage.setItem(NAME_KEY, name), undefined);
}
