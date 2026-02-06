import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RidesWith - Find Your Next Cycling Group Ride',
    template: '%s | RidesWith',
  },
  description:
    'Discover cycling group rides near you, join with one click, and get routes on any GPS platform. For riders and organizers.',
  keywords: ['cycling', 'group rides', 'bike rides', 'cycling events', 'GPS routes'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://rideswith.com'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RidesWith',
  },
  openGraph: {
    title: 'RidesWith - Find Your Next Cycling Group Ride',
    description: 'Discover cycling group rides near you, join with one click, and get routes on any GPS platform.',
    type: 'website',
    url: '/',
    siteName: 'RidesWith',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'RidesWith - Find Your Next Cycling Group Ride',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RidesWith - Find Your Next Cycling Group Ride',
    description: 'Discover cycling group rides near you, join with one click, and get routes on any GPS platform.',
    images: ['/og-default.png'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KY2SNQ8DJB"
          strategy="afterInteractive"
        />
        <Script id="ga-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KY2SNQ8DJB');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
