import { handle } from "@/lib/server/http";
import { getRoom } from "@/lib/server/rooms";

export async function GET(_req: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  return handle(async () => {
    const { code } = await ctx.params;
    return { state: await getRoom(code.toUpperCase()) };
  });
}
