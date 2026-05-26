import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

// THE ONLY BULLETPROOF WAY: Standard local file targeting
import './globals.css' 

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

// ... rest of your layout metadata and code remains exactly the same
export const metadata: Metadata = {
  title: 'Agentshire | Ultimate Browser Sandbox',
  description: 'Play high-performance 3D multiplayer browser games instantly with your friends. No downloads required.',
  icons: {
    icon: '/favicon.ico', 
  }
}

// Mobile rendering optimization layer to lock viewports and block sticky multi-touch zooming glitches
export const viewport: Viewport = {
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
    <html lang="en" className="dark scroll-smooth select-none">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#09090b] text-[#fafafa] min-h-screen w-screen overflow-x-hidden`}
      >
        <main className="relative flex flex-col min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  )
}
