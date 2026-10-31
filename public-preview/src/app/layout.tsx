import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { DemoProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Grand ADP · Demo Control',
  description: 'Frontend-only hotel operations demo with nine staff roles, a guest portal and a public website. All data is simulated.',
};

export const viewport: Viewport = {
  themeColor: '#05070c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
