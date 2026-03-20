import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'PostPika — LinkedIn AI for Indian Professionals',
  description:
    'Generate compelling LinkedIn posts tailored for Indian professionals. Powered by AI, in your language.',
  metadataBase: new URL('https://postpika.com'),
  openGraph: {
    title: 'PostPika — LinkedIn AI for Indian Professionals',
    description: 'Generate compelling LinkedIn posts tailored for Indian professionals.',
    url: 'https://postpika.com',
    siteName: 'PostPika',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-poppins antialiased">{children}</body>
    </html>
  )
}
