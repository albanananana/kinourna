import { Suspense } from "react";
import { HomeActions } from "@/components/home/HomeActions";
import { PosterWall } from "@/components/home/PosterWall";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { getDict, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { trendingTitles } from "@/lib/server/tmdb";

async function Wall({ lang }: { lang: Lang }) {
  return <PosterWall films={await trendingTitles(lang)} />;
}

export default async function Home() {
  const lang = await getLang();
  const t = getDict(lang);
  const [brandA, brandB] = t.brand;

  return (
    <main className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <Suspense fallback={null}>
        <Wall lang={lang} />
      </Suspense>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-10 pt-5 md:px-10">
        <header className="flex items-center justify-between gap-4">
          <span className="label text-cream/80">
            {t.home.tagline}
            <span className="hidden text-muted sm:inline"> · {t.home.noSignup}</span>
          </span>
          <LangSwitch />
        </header>

        <section className="mt-auto pt-24 md:mb-auto md:mt-20">
          <p className="label text-amber">{t.home.modes}</p>
          <h1 className="display mt-4 text-[clamp(104px,30vw,210px)] [text-shadow:0_8px_60px_rgb(0_0_0/0.6)]" translate="no">
            {brandA}
            <br />
            <span className="text-signal">{brandB}</span>
          </h1>
          <p className="mt-5 max-w-[34ch] text-[17px] leading-snug text-cream/75">{t.home.lead}</p>

          <HomeActions />

          <ol className="mt-10 grid max-w-[640px] gap-3 sm:grid-cols-3">
            {t.home.steps.map((text, i) => (
              <li key={i} className="flex gap-3 border-t border-line pt-3 text-[13px] leading-snug text-muted">
                <span className="font-mono text-[11px] text-amber">{String(i + 1).padStart(2, "0")}</span>
                {text}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
