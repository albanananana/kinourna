import { handle, json } from "@/lib/server/http";
import { getStore } from "@/lib/server/store";

/**
 * Daily Vercel Cron: removes rooms idle for 3+ days. The query itself also
 * keeps a free Supabase project from being paused for inactivity.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  return handle(async () => {
    const removed = await getStore().deleteRoomsOlderThan(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
    return { ok: true, removed };
  });
}
