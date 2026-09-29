'use client';

import { Languages } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/config';

export default function LanguageSwitcher({
  variant = 'default',
}: {
  variant?: 'default' | 'compact';
}) {
  const { locale, setLocale, t } = useTranslation();

  const switchTo = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center rounded-xl border-2 border-gray-200 bg-white p-0.5 shadow-sm"
        role="group"
        aria-label={t('common.language')}
      >
        <button
          type="button"
          onClick={() => switchTo('ar')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
            locale === 'ar'
              ? 'bg-primary-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          ع
        </button>
        <button
          type="button"
          onClick={() => switchTo('en')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
            locale === 'en'
              ? 'bg-primary-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-2 py-1.5 shadow-sm"
      role="group"
      aria-label={t('common.language')}
    >
      <Languages className="w-4 h-4 text-primary-600 shrink-0" />
      <button
        type="button"
        onClick={() => switchTo('ar')}
        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
          locale === 'ar'
            ? 'bg-primary-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t('common.arabic')}
      </button>
      <button
        type="button"
        onClick={() => switchTo('en')}
        className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
          locale === 'en'
            ? 'bg-primary-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        {t('common.english')}
      </button>
    </div>
  );
}
