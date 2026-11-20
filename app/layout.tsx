import type { Metadata, Viewport } from "next";
import { Alumni_Sans, Martian_Mono, Onest } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { preconnect } from "react-dom";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { DEFAULT_LANG, getDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

// latin-ext carries Polish letters (ą, ę, ł, ż…), cyrillic — Russian.
const alumni = Alumni_Sans({
  variable: "--font-alumni",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLang());
  return { title: t.meta.title, description: t.meta.description };
}

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  preconnect("https://image.tmdb.org");
  return (
    // The real language is set on <html> by I18nProvider once it's known.
    <html lang={DEFAULT_LANG} className={`${alumni.variable} ${onest.variable} ${martian.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <Localized>{children}</Localized>
        </Suspense>
      </body>
    </html>
  );
}

/** Reads the viewer's language (cookie / Accept-Language) — request-time data, hence the Suspense above. */
async function Localized({ children }: { children: ReactNode }) {
  const lang = await getLang();
  const t = getDict(lang);
  return (
    <I18nProvider lang={lang}>
      <div className="flex flex-1 flex-col [overflow-x:clip]">{children}</div>
      <footer className="px-5 pb-[calc(16px+var(--safe-bottom))] pt-10 text-[11px] leading-relaxed text-dim">
        {t.footer.data}
        <a className="underline decoration-line-strong underline-offset-2 hover:text-muted" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
          TMDB
        </a>
        . {t.footer.disclaimer}
      </footer>
    </I18nProvider>
  );
}
