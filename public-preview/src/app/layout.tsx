import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DemoProvider } from '@/lib/store';
import { I18nProvider } from '@/lib/i18n';
import { GoogleTranslate } from '@/components/shared/GoogleTranslate';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Grand ADP · Demo Control',
  description: 'Frontend-only hotel operations demo with nine staff roles, a guest portal and a public website. All data is simulated.',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#05070c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('grand-azure-demo-v1');if(s){var d=JSON.parse(s);if(d&&d.theme){document.documentElement.dataset.theme=d.theme;if(d.theme==='light'){document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');}}}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <I18nProvider>
          <DemoProvider>
            {children}
            <GoogleTranslate />
          </DemoProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
