import bg from "@/locales/bg.json";
import en from "@/locales/en.json";

export const LANGUAGES = ["bg", "en"] as const;
export type Lang = (typeof LANGUAGES)[number];

type Dict = { [key: string]: string | Dict };
const DICTIONARIES: Record<Lang, Dict> = { bg, en };

function lookup(lang: Lang, key: string): string | undefined {
  let node: string | Dict | undefined = DICTIONARIES[lang];
  for (const part of key.split(".")) {
    if (node === undefined || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Returns a translate function for a language. Missing keys fall back to the key itself. */
export function createT(lang: Lang): Translate {
  return (key, vars) => {
    let text = lookup(lang, key) ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

export function hasKey(lang: Lang, key: string): boolean {
  return lookup(lang, key) !== undefined;
}
