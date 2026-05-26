'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import GamePlayer from '@/components/GamePlayer'
import { GameInfo } from '@/types'
import gameData from '../public/gameData.json'
import { MiniGameCard } from './GameCard'
import Navbar from './Navbar'
import { supabase } from '../src/supabaseClient'

export default function GameContent({ gameInfo }: { gameInfo: GameInfo }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerName, setPlayerName] = useState<string>('Guest')
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Fetch the logged-in user's true username from the database
  useEffect(() => {
    async function getProfileName() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Look up the unique username mapped in your custom profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', session.user.email?.split('@')[0]) // Fallback check strategy
            .maybeSingle()

          if (profile?.username) {
            setPlayerName(profile.username)
          } else if (session.user.user_metadata?.username) {
            // Backup fallback to metadata
            setPlayerName(session.user.user_metadata.username)
          }
        }
      } catch (err) {
        console.error('Error loading account profile name:', err)
      } finally {
        setLoadingProfile(false)
      }
    }

    getProfileName()
  }, [])

  const handlePlayClick = () => {
    setIsPlaying(true)
  }

  return (
    <>
      {isPlaying ? (
        <GamePlayer {...gameInfo} playerName={playerName} />
      ) : (
        <div className="px-4 container mx-auto">
          <Navbar />
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            {/* Image Section - Larger and Clickable */}
            <div className="lg:w-2/3 cursor-pointer" onClick={handlePlayClick}>
              <div className="relative group rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <img
                  src={gameInfo.imageUrl}
                  alt={`${gameInfo.title} cover`}
                  className="w-full h-64 md:h-[400px] object-cover transform transition-transform duration-300 group-hover:scale-105"
                />

                {/* Online Badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">Online</span>
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent" />
                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/10 rounded-full p-4 backdrop-blur-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section - Upgraded to read account data */}
            <div className="lg:w-1/3 flex flex-col justify-center space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">{gameInfo.title}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{gameInfo.metaDescription}</p>
              
              <div className="flex flex-col space-y-4">
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Playing As Account</p>
                  <p className="text-xl font-black text-blue-600 mt-1 animate-pulse">
                    {loadingProfile ? 'Loading character...' : playerName}
                  </p>
                </div>

                <button
                  onClick={handlePlayClick}
                  disabled={loadingProfile}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-block text-center shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:scale-100"
                >
                  {loadingProfile ? 'Syncing Profile...' : 'Play Now →'}
                </button>
              </div>
            </div>
          </div>

          {/* Related Games */}
          <section className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4 sm:px-0">More Games</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {gameData.map((game) => (
                <MiniGameCard {...game} key={game.slug} />
              ))}
            </div>
          </section>

          {/* Markdown Content */}
          <section className="w-full mt-12 bg-white p-4 md:p-8 rounded-2xl drop-shadow-sm border border-gray-200">
            <div className="prose max-w-none">
              <ReactMarkdown>{gameInfo.markdown}</ReactMarkdown>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
