import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomApp, RoomLoading } from "@/components/room/RoomApp";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLang());
  return { title: t.meta.roomTitle, description: t.meta.roomDescription };
}

export default function RoomPage({ params }: PageProps<"/r/[code]">) {
  return (
    <Suspense fallback={<RoomLoading />}>
      {params.then(({ code }) => (
        <RoomApp code={code.toUpperCase()} />
      ))}
    </Suspense>
  );
}
