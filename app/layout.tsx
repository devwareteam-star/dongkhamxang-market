'use client';

import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { DataProvider } from '@/lib/contexts/DataContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}