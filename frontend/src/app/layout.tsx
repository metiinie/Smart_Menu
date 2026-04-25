import type { Metadata, Viewport } from 'next';
import './globals.css';
import './navigation.css';
import dynamic from 'next/dynamic';

const Providers = dynamic(
  () => import('@/components/providers/Providers').then((mod) => mod.Providers),
  { ssr: true }
);

export const metadata: Metadata = {
  title: 'ArifSmart Menu',
  description: 'Scan. Order. Enjoy. QR-based smart restaurant ordering.',
  applicationName: 'ArifSmart',
  authors: [{ name: 'ArifSmart Team' }],
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ArifSmart',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#08AE75',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
