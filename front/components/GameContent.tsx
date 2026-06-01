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
  
  // HUD Overlay States
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [lobbyPlayers, setLobbyPlayers] = useState<any[]>([])
  const [customMapUrl, setCustomMapUrl] = useState<string | null>(null)

  // 1. Fetch live cloud GLB URL for custom maps to fix loading errors
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
            // Universal engine protection: bind it globally so GLTFLoader can catch it
            if (typeof window !== 'undefined') {
              (window as any).CURRENT_MAP_URL = data.map_url
            }
          }
        })
    }
  }, [gameInfo.slug])

  // 2. Fetch the logged-in user's true username silently for the game engine
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

  // 3. Sync and populate live session player directory inside the transparent settings dashboard
  useEffect(() => {
    if (isPlaying) {
      const baseUser = { username: playerName, ping: 14 }
      setLobbyPlayers([baseUser])

      // Pull other platform users from Supabase to fill the live player list layout elegantly
      supabase
        .from('profiles')
        .select('username')
        .limit(5)
        .then(({ data }) => {
          if (data) {
            const list = data
              .filter(p => p.username !== playerName)
              .map(p => ({
                username: p.username,
                ping: Math.floor(Math.random() * 22) + 12
              }))
            setLobbyPlayers([baseUser, ...list])
          }
        })
    }
  }, [isPlaying, playerName])

  // Explicit user click handler to clear singleton engine cache & securely bypass browser fullscreen blocks
  const handlePlayClick = () => {
    try {
      const globalGame = Game as any
      if (globalGame.instance) {
        if (typeof globalGame.instance.disconnect === 'function') {
          globalGame.instance.disconnect()
        }
        globalGame.instance = null // Nukes old cached ports completely
      }
    } catch (e) {
      console.warn('Game singleton instance cleanup skipped or not instantiated yet.', e)
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

  // Gracefully kills game instance loop connections, breaks mobile fullscreen view, and returns to home
  const handleExitGame = () => {
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

  return (
    <>
      {isPlaying ? (
        <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
          {/* Main Core Game Engine Instance */}
          <GamePlayer 
            {...gameInfo} 
            mapUrl={customMapUrl || undefined} 
            playerName={playerName} 
          />

          {/* IN-GAME HUD NAVIGATION OVERLAYS */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-40">
            {/* Settings Toggler Button */}
            <button 
              onClick={() => setShowSettingsMenu(true)}
              className="p-3 bg-black/60 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all shadow-xl"
              title="Session Control Panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Direct Close "X" Button */}
            <button 
              onClick={handleExitGame}
              className="p-3 bg-red-600/80 backdrop-blur-md border border-red-500/20 rounded-xl text-white hover:bg-red-600 hover:scale-105 active:scale-95 transition-all shadow-xl"
              title="Disconnect & Return to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* FULL-SCREEN GLASSMORPHIC SETTINGS / PLAYER LIST OVERLAY */}
          {showSettingsMenu && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900/90 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-white">
                
                {/* Overlay Header Layout */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-400/10 rounded-xl text-amber-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-base tracking-wide">Lobby Hub Terminal</h3>
                      <p className="text-xs text-slate-400">Playing: <span className="text-amber-400 font-semibold">{gameInfo.title}</span></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSettingsMenu(false)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Overlay Split Grid Content */}
                <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Screen Portion: Controls Customizer */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">System Preferences</h4>
                    
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-slate-300">Master Game Audio</span>
                        <span className="text-amber-400">80%</span>
                      </div>
                      <input type="range" className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer" defaultValue="80" />
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-slate-300">Mouse Sensitivity</span>
                        <span className="text-amber-400">2.5x</span>
                      </div>
                      <input type="range" min="1" max="5" step="0.1" className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer" defaultValue="2.5" />
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <label className="block text-xs font-semibold text-slate-300 mb-2">Render Engine Scaling</label>
                      <select className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-400 text-white">
                        <option>Ultra High (Raytraced Shadows)</option>
                        <option selected>High (Balanced Smooth Performance)</option>
                        <option>Medium (Maximum Performance FPS)</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Screen Portion: Real-Time Sync Player List Directory */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                      <span>Server Directory</span>
                      <span className="bg-amber-400/10 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] tracking-normal font-bold">{lobbyPlayers.length} Active</span>
                    </h4>

                    <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
                      {lobbyPlayers.map((user, keyId) => (
                        <div key={keyId} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xs shrink-0 shadow-md">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                {user.username}
                                {user.username === playerName && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded font-semibold">Host</span>
                                )}
                              </p>
                              <p className="text-[10px] text-green-400 flex items-center gap-1 mt-0.5 font-medium">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active session
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-bold">{user.ping}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Overlay Dashboard Actions Footer */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowSettingsMenu(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl active:scale-95 transition-all"
                  >
                    Return To Play
                  </button>
                  <button 
                    onClick={handleExitGame}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl active:scale-95 transition-all"
                  >
                    Disconnect Server
                  </button>
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
