import "server-only";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, isLang, matchAcceptLanguage, type Lang } from "./config";

/** The viewer's chosen language (cookie), else the browser's preference. */
export async function getLang(): Promise<Lang> {
  const chosen = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(chosen)) return chosen;
  return matchAcceptLanguage((await headers()).get("accept-language"));
}
