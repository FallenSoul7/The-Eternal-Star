'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/game/Game'
import GameHud from '@/components/GameHud'
import LoadingScreen from '@/components/LoadingScreen'
import { MessageComponent } from '@shared/component/MessageComponent'
import { GameInfo } from '@/types'
import { AlertCircle, RefreshCw, XCircle, Settings, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '../src/supabaseClient' // Verify this matches your project'

interface GamePlayerProps extends GameInfo {
  playerName?: string
}

export default function GamePlayer({ playerName, ...gameInfo }: GamePlayerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageComponent[]>([])
  const [gameInstance, setGameInstance] = useState<Game | null>(null)
  
  // Settings Menu states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeMapPlayers, setActiveMapPlayers] = useState<any[]>([])

  const refContainer = useRef<HTMLDivElement | null>(null)
  const retryCount = useRef(0)

  const purgeGameEngineUI = () => {
    const targets = ['Car', 'Enter', 'Interact', 'JUMP']
    document.querySelectorAll('button, div, span, p').forEach((el) => {
      const text = el.textContent?.trim() || ''
      if (targets.some(t => text.includes(t)) && !el.closest('#hud')) el.remove()
    })
    const doc = document as any
    if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {})
  }

  // Live lookup for online map members
  useEffect(() => {
    if (isSettingsOpen && gameInfo.slug) {
      supabase
        .from('profiles')
        .select('username, current_room')
        .eq('current_room', gameInfo.slug)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setActiveMapPlayers(data)
          } else {
            setActiveMapPlayers([{ username: playerName || 'Guest' }])
          }
        })
        .catch((err) => {
          console.error('Failed to look up room players:', err)
          setActiveMapPlayers([{ username: playerName || 'Guest' }])
        })
    }
  }, [isSettingsOpen, gameInfo.slug, playerName])

  useEffect(() => {
    let activeGame: Game | null = null
    let isMounted = true

    async function initializeGame() {
      if (!refContainer.current) return

      setIsLoading(true)
      setConnectionError(null)

      try {
        const slug = gameInfo.slug || 'test'

        const game = Game.getInstance(slug, refContainer)
        game.hud.passChatState(setMessages)

        if (isMounted) {
          setGameInstance(game)
          activeGame = game
        }

        await game.start()

        setTimeout(() => {
          const finalName = playerName?.trim() || 'Guest'
          game.setPlayerName(finalName)
        }, 300)

        if (isMounted) {
          setIsLoading(false)
          retryCount.current = 0
        }
      } catch (error) {
        console.error('Connection error:', error)
        if (isMounted) {
          setIsLoading(false)
          setConnectionError('Failed to connect to the game server. The server may be starting up — try again in a moment.')
        }
      }
    }

    initializeGame()

    return () => {
      isMounted = false
      if (activeGame) {
        const gameObj = activeGame as any
        if (typeof gameObj.disconnect === 'function') gameObj.disconnect()
      }
      purgeGameEngineUI()
    }
  }, [gameInfo.id, gameInfo.slug, playerName])

  const handleRetry = () => window.location.reload()

  const handleLeaveGame = () => {
    if (gameInstance) {
      const gameObj = gameInstance as any
      if (typeof gameObj.disconnect === 'function') gameObj.disconnect()
    }
    purgeGameEngineUI()
    router.push('/')
  }

  const handleResetCharacter = () => {
    if (!gameInstance) return
    try {
      const gameObj = gameInstance as any
      if (typeof gameObj.resetPlayer === 'function') gameObj.resetPlayer()
    } catch (err) {
      console.error('Failed to reset player position:', err)
    }
    setIsSettingsOpen(false)
  }

  const handleSendFriendRequest = (targetUser: string) => {
    alert(`Friend request sent to ${targetUser}!`)
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {isLoading && <LoadingScreen />}

      {connectionError && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-8 max-w-md text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-white text-xl font-bold">Connection Lost</h2>
            <p className="text-gray-400 text-sm">{connectionError}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
              <Button onClick={handleLeaveGame} variant="destructive" className="gap-2">
                <XCircle className="w-4 h-4" /> Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Gears/Settings icon button */}
      {gameInstance && !isLoading && !connectionError && !isSettingsOpen && (
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="absolute top-4 left-4 z-30 p-2.5 bg-gray-900/80 text-gray-300 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      )}

      {/* Full-screen overlay configuration */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col p-6 animate-in fade-in">
          
          {/* Top Actions layout layout */}
          <div className="flex justify-between items-start w-full mb-8">
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex gap-4">
              <Button 
                onClick={handleLeaveGame} 
                variant="destructive" 
                className="font-bold px-6 py-4 h-auto text-sm rounded-xl"
              >
                Leave Game
              </Button>
              <Button 
                onClick={handleResetCharacter} 
                variant="outline" 
                className="font-bold px-6 py-4 h-auto text-sm rounded-xl bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
              >
                Reset Character
              </Button>
            </div>
          </div>

          {/* Directory Box layout layout */}
          <div className="w-full max-w-3xl mx-auto mt-4 bg-slate-900/60 border border-slate-700 rounded-2xl flex flex-col min-h-[400px] shadow-2xl">
            <div className="p-5 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                Players on this Map
              </h2>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3">
               {activeMapPlayers.length > 0 ? (
                 activeMapPlayers.map((player, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold uppercase">
                          {player.username ? player.username.substring(0, 2) : '??'}
                        </div>
                        <div>
                          <span className="text-white font-bold text-base">{player.username || 'Unknown'}</span>
                          {player.username === playerName && (
                            <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">You</span>
                          )}
                        </div>
                     </div>
                     
                     {player.username !== playerName && (
                       <Button 
                         onClick={() => handleSendFriendRequest(player.username)} 
                         className="bg-amber-400 hover:bg-amber-500 text-black font-bold h-auto py-2.5 px-4 rounded-xl"
                       >
                         Send Friend Request
                       </Button>
                     )}
                   </div>
                 ))
               ) : (
                 <div className="text-center text-slate-500 py-10 font-medium">Loading players...</div>
               )}
            </div>
          </div>

        </div>
      )}

      {/* Render Canvas Engine Viewport */}
      <div ref={refContainer} className="w-full h-full" />

      {/* Attach overlays */}
      {gameInstance && !isLoading && !connectionError && (
        <div id="hud">
          <GameHud messages={messages} gameInstance={gameInstance} />
        </div>
      )}
    </div>
  )
}
