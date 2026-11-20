import { Suspense } from "react";
import { HomeActions } from "@/components/home/HomeActions";
import { PosterWall } from "@/components/home/PosterWall";
import { trendingTitles } from "@/lib/server/tmdb";

async function Wall() {
  return <PosterWall films={await trendingTitles()} />;
}

const STEPS = [
  ["01", "Каждый тайно загадывает фильмы"],
  ["02", "Открываете урну — все билеты на столе"],
  ["03", "Жребий, голосование или вычёркивание"],
];

export default function Home() {
  return (
    <main className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <Suspense fallback={null}>
        <Wall />
      </Suspense>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-10 pt-5 md:px-10">
        <header className="flex items-center justify-between">
          <span className="label text-cream/80">Сеанс для своих</span>
          <span className="label">Без регистрации</span>
        </header>

        <section className="mt-auto pt-24 md:mb-auto md:mt-20">
          <p className="label text-amber">Жребий · Голосование · Вычёркивание</p>
          <h1 className="display mt-4 text-[clamp(104px,30vw,210px)] [text-shadow:0_8px_60px_rgb(0_0_0/0.6)]">
            Кино
            <br />
            <span className="text-signal">урна</span>
          </h1>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-snug text-cream/75">
            Помните, как писали фильмы на бумажках и тянули из шапки? Теперь то же самое, только с обложками и без споров.
          </p>

          <HomeActions />

          <ol className="mt-10 grid max-w-[640px] gap-3 sm:grid-cols-3">
            {STEPS.map(([n, text]) => (
              <li key={n} className="flex gap-3 border-t border-line pt-3 text-[13px] leading-snug text-muted">
                <span className="font-mono text-[11px] text-amber">{n}</span>
                {text}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
