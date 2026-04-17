import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyFitLife',
  description: 'Seu sistema operacional de saúde',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyFitLife',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1F4E79',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
