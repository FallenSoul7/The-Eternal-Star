'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/supabaseClient'
import { AuthGateway } from '@/components/AuthGateway'
import GameCard from '@/components/GameCard'
import Navbar from '@/components/Navbar'
import { ExternalLink, Github, Twitter } from 'lucide-react'
import Link from 'next/link'
import type { Session } from '@supabase/supabase-js'
import { GameInfo } from '@/types'
import gameData from '@/public/gameData.json'

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

  // Authenticated: Show the game list interface
  const games = gameData as GameInfo[]
  return (
    <div className="space-y-8 flex flex-col items-center px-4 container">
      <Navbar />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {games &&
          games.map((game, index) => (
            <div
              className={`col-span-1 ${
                // Only make the last item span full width when total count is odd
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 512"
            className="h-5 w-5 text-white fill-white"
          >
            <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,47.519,441.139,441.139,0,0,0-66.541-6.595,440.562,440.562,0,0,0-66.541,6.595A368.063,368.063,0,0,0,231.715,32.9a1.814,1.814,0,0,0-1.924-.91A483.680,483.680,0,0,0,116.121,69.137a1.494,1.494,0,0,0-.765.7C39.071,183.651,8.251,294.953,13.89,404.884a1.816,1.816,0,0,0,.723,1.325A487.680,487.680,0,0,0,176.02,479.792a1.9,1.9,0,0,0,2.063-.676A348.462,348.462,0,0,0,207.052,436.693a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.900-.256c96.229,43.917,200.41,43.917,295.834,0a1.811,1.811,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,406.209a1.823,1.823,0,0,0,.72-1.324C625.873,279.572,597.773,167.365,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
          </svg>
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
