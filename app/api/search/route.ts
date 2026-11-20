import { handle } from "@/lib/server/http";
import { isLang } from "@/lib/i18n/config";
import { searchTitles } from "@/lib/server/tmdb";

export async function GET(req: Request) {
  return handle(async () => {
    const params = new URL(req.url).searchParams;
    const lang = params.get("lang");
    // Pages loaded before languages existed don't send `lang`; they were Russian.
    return searchTitles(params.get("q") ?? "", isLang(lang) ? lang : "ru");
  });
}
