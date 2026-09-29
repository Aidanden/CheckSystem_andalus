export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const LOCALE_STORAGE_KEY = 'check-system-locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'ar' || value === 'en';
}
