import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ClassWaves Student',
  description: 'Join your classroom session and participate in group discussions',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClassWaves Student',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'ClassWaves Student',
    title: 'ClassWaves Student',
    description: 'Join your classroom session and participate in group discussions',
  },
  twitter: {
    card: 'summary',
    title: 'ClassWaves Student',
    description: 'Join your classroom session and participate in group discussions',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className={inter.className}>
        <div className="safe-area-inset min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  )
}