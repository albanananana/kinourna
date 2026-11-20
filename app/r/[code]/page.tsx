import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomApp, RoomLoading } from "@/components/room/RoomApp";

export const metadata: Metadata = {
  title: "Зал · Киноурна",
  description: "Заходи — выбираем, что смотреть.",
};

export default function RoomPage({ params }: PageProps<"/r/[code]">) {
  return (
    <Suspense fallback={<RoomLoading />}>
      {params.then(({ code }) => (
        <RoomApp code={code.toUpperCase()} />
      ))}
    </Suspense>
  );
}
