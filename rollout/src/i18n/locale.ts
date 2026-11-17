// FM-23: i18n locale resolver. URL param ?locale=fr → visitor IP → default 'en'.
// Falls back to English if a string is missing (the catalog handles fallback).

export const SUPPORTED_LOCALES = [
  'en','fr','de','es','it','nl','sv','pl','ja','zh','pt','hi','ar','tr','ko','ru','id','th','vi','cs','da','fi',
] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function resolveLocale(args: { urlParam?: string | null; ipCountry?: string | null; preferred?: string | null }): Locale {
  if (args.urlParam && isSupported(args.urlParam)) return args.urlParam as Locale;
  if (args.preferred && isSupported(args.preferred)) return args.preferred as Locale;
  if (args.ipCountry) {
    const map: Record<string, Locale> = { US: 'en', GB: 'en', FR: 'fr', DE: 'de', ES: 'es', IT: 'it', JP: 'ja', CN: 'zh', BR: 'pt', IN: 'hi' };
    const loc = map[args.ipCountry.toUpperCase()];
    if (loc) return loc;
  }
  return DEFAULT_LOCALE;
}

function isSupported(s: string): boolean {
  return (SUPPORTED_LOCALES as readonly string[]).includes(s);
}
