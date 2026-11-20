import { handle, readBody } from "@/lib/server/http";
import { createRoom } from "@/lib/server/rooms";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readBody(req);
    return createRoom(body.name);
  });
}
