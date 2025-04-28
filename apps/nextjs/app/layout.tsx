import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics as DubAnalytics } from '@dub/analytics/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dub Analytics',
  description: 'Dub Analytics Example App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
      <DubAnalytics
        domainsConfig={{
          refer: 'getacme.link',
          site: 'getacme.link',
        }}
      />
    </html>
  );
}
