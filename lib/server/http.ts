import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ApiError } from "./rooms";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export async function handle(fn: () => Promise<unknown>) {
  try {
    return json(await fn());
  } catch (err) {
    // Let Next.js handle its own control-flow errors (e.g. "this route is dynamic").
    unstable_rethrow(err);
    if (err instanceof ApiError) return json({ error: err.message }, err.status);
    console.error("[kinourna]", err);
    return json({ error: "Что-то сломалось на сервере. Попробуй ещё раз." }, 500);
  }
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
