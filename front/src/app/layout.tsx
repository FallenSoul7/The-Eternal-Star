import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
// FIXED: Points natively to the new globals.css file right inside this folder
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

// Clean, professional metadata configuration
export const metadata: Metadata = {
  title: 'Agentshire | Ultimate Browser Sandbox',
  description: 'Play high-performance 3D multiplayer browser games instantly with your friends. No downloads required.',
  icons: {
    icon: '/favicon.ico', 
  }
}

// INSANE MOBILE OPTIMIZATION: Prevents users from accidentally zooming or pinching 
// the web view while hitting buttons/joysticks in your game!
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
        {/* Main Application Shell Wrapper */}
        <main className="relative flex flex-col min-h-screen w-full">
          {children}
        </main>
      </body>
    </html>
  )
}
