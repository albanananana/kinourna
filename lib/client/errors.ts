import { errorText, type Dict } from "../i18n";
import { RequestError } from "./api";

/** Human message for any thrown error, in the viewer's language. */
export function errorOf(t: Dict, err: unknown): string {
  if (err instanceof RequestError) return errorText(t, err.code, err.params);
  return t.errors.generic;
}
