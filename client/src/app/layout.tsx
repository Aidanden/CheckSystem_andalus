import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'نظام طباعة الشيكات | Check Printing System',
  description: 'نظام طباعة الشيكات',
};

// Prevent static prerender crashes with Redux/i18n client providers on some hosts
export const dynamic = 'force-dynamic';

const localeBootScript = `
(function(){
  try {
    var locale = localStorage.getItem('check-system-locale');
    if (locale !== 'ar' && locale !== 'en') locale = 'en';
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootScript }} />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
