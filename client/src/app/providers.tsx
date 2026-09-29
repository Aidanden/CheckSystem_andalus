'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ReactNode } from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <I18nProvider>{children}</I18nProvider>
    </Provider>
  );
}
