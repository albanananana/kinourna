import { handle } from "@/lib/server/http";
import { searchTitles } from "@/lib/server/tmdb";

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    return searchTitles(q);
  });
}
