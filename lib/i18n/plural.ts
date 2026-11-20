export type Forms = { one: string; few?: string; many?: string; other: string };

const rules = new Map<string, Intl.PluralRules>();

/** CLDR plural category → word form, e.g. pl: 1 film, 2 filmy, 5 filmów. */
export function plural(locale: string, n: number, forms: Forms): string {
  let r = rules.get(locale);
  if (!r) {
    r = new Intl.PluralRules(locale);
    rules.set(locale, r);
  }
  const cat = r.select(n) as keyof Forms;
  return forms[cat] ?? forms.other;
}
