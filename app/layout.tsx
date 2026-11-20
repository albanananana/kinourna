import type { Metadata, Viewport } from "next";
import { Alumni_Sans, Martian_Mono, Onest } from "next/font/google";
import { preconnect } from "react-dom";
import "./globals.css";

const alumni = Alumni_Sans({
  variable: "--font-alumni",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Киноурна — что смотрим сегодня",
  description: "Каждый тайно загадывает фильмы, а урна, голосование или вычёркивание решают, что смотреть.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  preconnect("https://image.tmdb.org");
  return (
    <html lang="ru" className={`${alumni.variable} ${onest.variable} ${martian.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col [overflow-x:clip]">{children}</div>
        <footer className="px-5 pb-[calc(16px+var(--safe-bottom))] pt-10 text-[11px] leading-relaxed text-dim">
          Данные о фильмах — <a className="underline decoration-line-strong underline-offset-2 hover:text-muted" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>.
          Этот продукт использует TMDB API, но не одобрен и не сертифицирован TMDB.
        </footer>
      </body>
    </html>
  );
}
