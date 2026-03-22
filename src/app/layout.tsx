import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://postpika.com'),
  title: {
    default: 'PostPika — AI LinkedIn Posts for Indian Professionals',
    template: '%s | PostPika',
  },
  description:
    'Generate 3 viral LinkedIn post variations in 30 seconds. AI-powered content tool for Indian founders, consultants and professionals. Start free, no card needed.',
  keywords: [
    'LinkedIn AI tool India',
    'LinkedIn post generator India',
    'AI content creator LinkedIn India',
    'PostPika',
    'personal brand LinkedIn India',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://postpika.com',
    siteName: 'PostPika',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-poppins antialiased">{children}</body>
    </html>
  )
}
