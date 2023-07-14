import './globals.scss'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Songversation',
  description: 'A NextJS port from Flask',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
