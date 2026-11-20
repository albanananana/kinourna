import type { ErrorCode } from "../i18n/dict/ru";

/**
 * An expected failure the player should see. Carries a code, not text — the
 * browser shows it in the player's own language.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    public params?: Record<string, string | number>,
  ) {
    super(code);
  }
}
