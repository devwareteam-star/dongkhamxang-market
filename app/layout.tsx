'use client';

import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { DataProvider } from '@/lib/contexts/DataContext';
import { Noto_Sans_Lao_Looped } from 'next/font/google';

const notoSansLaoLooped = Noto_Sans_Lao_Looped({
  subsets: ['lao'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lo">
      <body className={notoSansLaoLooped.className}>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}