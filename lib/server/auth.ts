import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Session } from "../types";

/**
 * Players have no accounts. On join the server hands out an id and an HMAC
 * token bound to (room, player); the browser keeps both in localStorage and
 * sends them with every action.
 */
function secret(): string {
  return process.env.ROOM_SECRET ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "kinourna-dev-secret";
}

export function newPlayerId(): string {
  return randomBytes(6).toString("base64url");
}

export function signSession(code: string, playerId: string): Session {
  return { playerId, token: sign(code, playerId) };
}

function sign(code: string, playerId: string): string {
  return createHmac("sha256", secret()).update(`${code}:${playerId}`).digest("base64url");
}

export function verifySession(code: string, session: Partial<Session> | null | undefined): session is Session {
  if (!session?.playerId || !session.token) return false;
  const expected = Buffer.from(sign(code, session.playerId));
  const given = Buffer.from(session.token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function sessionFromHeaders(headers: Headers): Partial<Session> {
  return {
    playerId: headers.get("x-player") ?? undefined,
    token: headers.get("x-token") ?? undefined,
  };
}
