import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics as DubAnalytics } from '@dub/analytics/react';
import './globals.css';
import { DiscountBanner } from './discount-banner';
import { DUB_ANALYTICS_SCRIPT_URL } from './constants';

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
      <DiscountBanner />
      <DubAnalytics
        domainsConfig={{
          refer: 'getacme.link',
          site: 'getacme.link',
          outbound: 'example.com,other.com,sub.example.com,*.wildcard.com',
        }}
        scriptProps={{
          src: DUB_ANALYTICS_SCRIPT_URL,
        }}
        // optional – only needed for client-side conversion tracking
        // get your publishable key from https://app.dub.co/settings/analytics
        publishableKey="dub_pk_xxxxxxxx"
      />
    </html>
  );
}
