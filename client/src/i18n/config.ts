export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const LOCALE_STORAGE_KEY = 'check-system-locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'ar' || value === 'en';
}
