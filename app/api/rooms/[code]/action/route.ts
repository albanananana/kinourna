import { sessionFromHeaders } from "@/lib/server/auth";
import { handle, readBody } from "@/lib/server/http";
import { ApiError, act } from "@/lib/server/rooms";
import type { Action } from "@/lib/types";

export async function POST(req: Request, ctx: RouteContext<"/api/rooms/[code]/action">) {
  return handle(async () => {
    const { code } = await ctx.params;
    const body = await readBody(req);
    const action = body.action as Action | undefined;
    if (!action || typeof action.type !== "string") throw new ApiError(400, "badAction");
    return act(code.toUpperCase(), sessionFromHeaders(req.headers), action);
  });
}
