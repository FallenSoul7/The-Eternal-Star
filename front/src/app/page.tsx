'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
// AuthGateway is in front/src/components/, so go up 1 level
import { AuthGateway } from '../components/AuthGateway'
// GameCard and Navbar are in front/components/, so go up 2 levels
import GameCard from '../../components/GameCard'
import Navbar from '../../components/Navbar'
import { Github, Twitter } from 'lucide-react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
// gameData.json is in front/public/, so go up 2 levels
import gameData from '../../public/gameData.json'

// Perfect type definition mapping your exact JSON layout
export interface GameInfo {
  title: string
  imageUrl: string
  slug: string
  websocketPort: number
  metaDescription: string
  markdown: string
  images: {
    url: string
    width: number
    height: number
    alt: string
    type: string
  }[]
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white font-sans">
        <div className="text-xl font-bold tracking-widest uppercase animate-pulse">
          Loading Account...
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthGateway onAuthSuccess={() => {}} />
  }

  const games = gameData as GameInfo[]
  return (
    <div className="space-y-8 flex flex-col items-center px-4 container">
      <Navbar />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {games &&
          games.map((game, index) => (
            <div
              className={`col-span-1 ${
                index === games.length - 1 && games.length % 2 !== 0 ? 'md:col-span-2' : ''
              }`}
              key={index}
            >
              <GameCard {...game} />
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 my-4">
        <Link
          href={'https://discord.gg/kPhgtj49U2'}
          target="_blank"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <span className="font-medium">Join Discord</span>
        </Link>

        <Link
          href={'https://github.com/iercann/notblox'}
          target="_blank"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Github size={20} />
          <span className="font-medium">View on GitHub</span>
        </Link>

        <Link
          href={'https://twitter.com/iercann'}
          target="_blank"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Twitter size={20} />
          <span className="font-medium">Follow Dev</span>
        </Link>
      </div>
    </div>
  )
}
