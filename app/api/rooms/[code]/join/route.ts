import { handle, readBody } from "@/lib/server/http";
import { joinRoom } from "@/lib/server/rooms";
import type { Session } from "@/lib/types";

export async function POST(req: Request, ctx: RouteContext<"/api/rooms/[code]/join">) {
  return handle(async () => {
    const { code } = await ctx.params;
    const body = await readBody(req);
    return joinRoom(code.toUpperCase(), body.name, body.session as Partial<Session> | undefined);
  });
}
