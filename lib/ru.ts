/** Russian plural: plural(3, ["фильм", "фильма", "фильмов"]) → "фильма". */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export const filmsWord = (n: number) => plural(n, ["фильм", "фильма", "фильмов"]);

/** Joins names the Russian way: "Аня", "Аня и Боря", "Аня, Боря и Вика". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} и ${names[names.length - 1]}`;
}
