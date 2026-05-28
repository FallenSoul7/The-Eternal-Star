import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Eternal Star',
  description: 'Multiplayer 3D Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* We removed all the old hardcoded header/nav links from here */}
      <body className="bg-slate-900 text-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
