import { sessionFromHeaders } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import { getMe } from "@/lib/server/rooms";

export async function GET(req: Request, ctx: RouteContext<"/api/rooms/[code]/me">) {
  return handle(async () => {
    const { code } = await ctx.params;
    return getMe(code.toUpperCase(), sessionFromHeaders(req.headers));
  });
}
