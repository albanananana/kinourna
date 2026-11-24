import { isLang } from "@/lib/i18n/config";
import { handle } from "@/lib/server/http";
import { filmExtra } from "@/lib/server/tmdb";

/** GET /api/film?type=movie&id=603&lang=ru — extra facts for the film card. */
export async function GET(req: Request) {
  return handle(async () => {
    const params = new URL(req.url).searchParams;
    const type = params.get("type");
    const id = Number(params.get("id"));
    const lang = params.get("lang");
    if ((type !== "movie" && type !== "tv") || !Number.isSafeInteger(id) || id <= 0 || !isLang(lang)) {
      return { extra: null };
    }
    return { extra: await filmExtra(type, id, lang) };
  });
}
