/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import GamePlayer from '@/components/GamePlayer'
import { GameInfo } from '@/types'
import gameData from '../public/gameData.json'
import { MiniGameCard } from './GameCard'
import Navbar from './Navbar'
import { supabase } from '../src/supabaseClient'
import { Game } from '@/game/Game'

export default function GameContent({ gameInfo }: { gameInfo: GameInfo }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerName, setPlayerName] = useState<string>('Guest')
  
  // Controls the dark transparent full-screen overlay
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [activeMapPlayers, setActiveMapPlayers] = useState<any[]>([])
  const [customMapUrl, setCustomMapUrl] = useState<string | null>(null)

  // Fetch live cloud GLB URL for custom user-created maps
  useEffect(() => {
    const isStatic = gameData.some(g => g.slug === gameInfo.slug)
    if (!isStatic) {
      supabase
        .from('maps')
        .select('map_url')
        .eq('slug', gameInfo.slug)
        .single()
        .then(({ data }) => {
          if (data?.map_url) {
            setCustomMapUrl(data.map_url)
            if (typeof window !== 'undefined') {
              (window as any).CURRENT_MAP_URL = data.map_url
            }
          }
        })
    }
  }, [gameInfo.slug])

  // Fetch the logged-in user's true username silently
  useEffect(() => {
    async function getProfileName() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', session.user.email?.split('@')[0])
            .maybeSingle()

          if (profile?.username) {
            setPlayerName(profile.username)
          } else if (session.user.user_metadata?.username) {
            setPlayerName(session.user.user_metadata.username)
          }
        }
      } catch (err) {
        console.error('Error loading account profile name:', err)
      }
    }

    getProfileName()
  }, [])

  // Listen for the top-left settings click event from inside GamePlayer
  useEffect(() => {
    if (!isPlaying) return

    const handleOpenSettings = () => {
      setShowSettingsMenu(true)
    }

    window.addEventListener('open-game-settings', handleOpenSettings)
    return () => {
      window.removeEventListener('open-game-settings', handleOpenSettings)
    }
  }, [isPlaying])

  // Only fetch and listen to players who are active inside this specific map room
  useEffect(() => {
    if (isPlaying && showSettingsMenu) {
      // Pull users currently linked to this map room instance
      supabase
        .from('profiles')
        .select('username, current_room')
        .eq('current_room', gameInfo.slug)
        .then(({ data }) => {
          if (data) {
            setActiveMapPlayers(data)
          } else {
            setActiveMapPlayers([{ username: playerName }])
          }
        })
    }
  }, [isPlaying, showSettingsMenu, gameInfo.slug, playerName])

  const handlePlayClick = () => {
    try {
      const globalGame = Game as any
      if (globalGame.instance) {
        if (typeof globalGame.instance.disconnect === 'function') {
          globalGame.instance.disconnect()
        }
        globalGame.instance = null
      }
    } catch (e) {
      console.warn('Game singleton instance cleanup skipped.', e)
    }

    const element = document.documentElement as any
    if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {})
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen().catch(() => {})
      }
    }

    setIsPlaying(true)
  }

  // Closes game loops, breaks mobile screen locks, and routes user out
  const handleLeaveGame = () => {
    try {
      const globalGame = Game as any
      if (globalGame.instance) {
        if (typeof globalGame.instance.disconnect === 'function') {
          globalGame.instance.disconnect()
        }
        globalGame.instance = null
      }
    } catch (e) {
      console.warn('Error closing engine room lifecycle:', e)
    }

    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen()
      }
    }

    setIsPlaying(false)
    setShowSettingsMenu(false)
  }

  // Triggers character base coordinate respawn inside game stream canvas
  const handleResetCharacter = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).gameInstance?.player) {
        (window as any).gameInstance.player.resetPosition()
      }
    } catch (err) {
      console.error('Character reset failed:', err)
    }
    setShowSettingsMenu(false) // Close overlay back to gameplay
  }

  const handleSendFriendRequest = (targetUser: string) => {
    alert(`Friend request sent to ${targetUser}!`)
    // Put your friend system insert query here when ready
  }

  return (
    <>
      {isPlaying ? (
        <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
          
          {/* Main Core Game Engine Canvas Viewport */}
          <GamePlayer 
            {...gameInfo} 
            mapUrl={customMapUrl || undefined} 
            playerName={playerName} 
          />

          {/* FULL SCREEN TRANSPARENT DARK OVERLAY */}
          {showSettingsMenu && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col p-6 animate-fadeIn">
              
              {/* Top Action Row Content Area */}
              <div className="w-full flex justify-between items-center mb-8">
                {/* Click outside to resume safely */}
                <button 
                  onClick={() => setShowSettingsMenu(false)}
                  className="text-white/60 hover:text-white flex items-center gap-2 text-sm font-semibold bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                >
                  ← Resume Game
                </button>

                <div className="flex items-center gap-4">
                  {/* Reset Character Action Trigger Button */}
                  <button 
                    onClick={handleResetCharacter}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm rounded-xl border border-white/10 active:scale-95 transition-all shadow-lg"
                  >
                    Reset Character
                  </button>

                  {/* Leave Game Action Trigger Button */}
                  <button 
                    onClick={handleLeaveGame}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl active:scale-95 transition-all shadow-lg shadow-red-950/20"
                  >
                    Leave Game
                  </button>
                </div>
              </div>

              {/* Server User Base Directory Container Box Layout */}
              <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col min-h-0 bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Players on this map ({activeMapPlayers.length})
                  </h3>
                </div>

                {/* List items mapping list profiles */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {activeMapPlayers.map((player, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                          {player.username.substring(0, 2)}
                        </div>
                        <span className="text-white text-sm font-semibold">{player.username}</span>
                        {player.username === playerName && (
                          <span className="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold px-1.5 py-0.5 rounded">You</span>
                        )}
                      </div>

                      {player.username !== playerName && (
                        <button 
                          onClick={() => handleSendFriendRequest(player.username)}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-xl active:scale-95 transition-all"
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : (
        <div className="px-4 container mx-auto">
          <Navbar />
          <div className="flex flex-col lg:flex-row gap-8 mb-12">
            
            <div className="lg:w-2/3 cursor-pointer" onClick={handlePlayClick}>
              <div className="relative group rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <img
                  src={gameInfo.imageUrl}
                  alt={`${gameInfo.title} cover`}
                  className="w-full h-64 md:h-[400px] object-cover transform transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">Online</span>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent" />
                
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

            <div className="lg:w-1/3 flex flex-col justify-center space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">{gameInfo.title}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">{gameInfo.metaDescription}</p>
              
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handlePlayClick}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-block text-center shadow-lg hover:shadow-xl"
                >
                  Play Now →
                </button>
              </div>
            </div>
          </div>

          <section className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 px-4 sm:px-0">More Games</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {gameData.map((game) => (
                <MiniGameCard {...game} key={game.slug} />
              ))}
            </div>
          </section>

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
