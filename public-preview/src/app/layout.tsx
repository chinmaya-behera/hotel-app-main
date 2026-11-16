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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('grand-azure-demo-v1');if(s){var d=JSON.parse(s);if(d&&d.theme){document.documentElement.dataset.theme=d.theme;if(d.theme==='light'){document.documentElement.classList.add('light');}else{document.documentElement.classList.add('dark');}}}}catch(e){}try{var gt=localStorage.getItem('grand_adp_guest_theme_option');if(gt){document.documentElement.dataset.guestTheme=gt;}}catch(e){}})();`,
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
