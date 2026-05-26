'use client'

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/game/Game'
import GameHud from '@/components/GameHud'
import LoadingScreen from '@/components/LoadingScreen'
import { MessageComponent } from '@shared/component/MessageComponent'
import { GameInfo } from '@/types'
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react'
import Link from 'next/link'

interface GamePlayerProps extends GameInfo {
  playerName?: string
}

export default function GamePlayer({ playerName, ...gameInfo }: GamePlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageComponent[]>([])
  const [gameInstance, setGameInstance] = useState<Game | null>(null)
  const refContainer = useRef<HTMLDivElement>(null)
  const retryCount = useRef(0)

  useEffect(() => {
    let activeGame: Game | null = null
    let isMounted = true

    async function initializeGame() {
      if (!refContainer.current) return
      
      setIsLoading(true)
      setConnectionError(null)

      try {
        // 1. Fetch or boot up the singleton 3D engine instance mapped to the game server port
        const game = Game.getInstance(gameInfo.websocketPort, refContainer)
        game.hud.passChatState(setMessages)
        
        if (isMounted) {
          setGameInstance(game)
          activeGame = game
        }

        // 2. Fire the network handshake loop to join the cluster
        await game.start()

        // 3. Inject the authenticated account username into the engine state machine
        const finalName = playerName?.trim() || 'Guest'
        game.setPlayerName(finalName)

        if (isMounted) {
          setIsLoading(false)
          retryCount.current = 0 // Reset retries on successful handshake
        }
      } catch (error) {
        console.error('Fatal network connection breakdown:', error)
        if (isMounted) {
          setIsLoading(false)
          setConnectionError(
            `Failed to connect to the server instance on port ${gameInfo.websocketPort}. The cluster node might be sleeping or full.`
          )
        }
      }
    }

    initializeGame()

    // 4. CLEANUP LIFECYCLE: Gracefully disconnect when the user leaves the server
    return () => {
      isMounted = false
      if (activeGame) {
        console.log('Component unmounting. Killing active websocket layers...')
        // If your engine file has a built-in exit/disconnect route, invoke it here:
        // activeGame.disconnect?.() or activeGame.destroy?.()
      }
    }
  }, [gameInfo.websocketPort, playerName])

  const handleRetry = () => {
    retryCount.current += 1
    // Forces a hard re-run of the initial hook setup sequence by cycling state parameters
    window.location.reload()
  }

  return (
    <div 
      className="fixed inset-0 bg-[#07070c] text-white overflow-hidden select-none"
      style={{ 
        width: '100vw', 
        height: '100vh',
        overscrollBehavior: 'none', // STOPS mobile chrome/safari pull-to-refresh gesture entirely!
        touchAction: 'none'         // STOPS accidental double-tap tracking or page panning delays
      }}
    >
      {/* LOADING CONTROLLER STAGE */}
      {isLoading && <LoadingScreen />}

      {/* ERROR HANDLERS OVERLAY STAGE */}
      {connectionError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090f]/95 backdrop-blur-md px-6 text-center animate-fade-in">
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full mb-4">
            <AlertCircle size={40} className="animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black tracking-wide mb-2 uppercase text-white">
            Connection Lost
          </h2>
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-8">
            {connectionError}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl active:scale-95 transition-transform shadow-lg shadow-blue-600/20"
            >
              <RefreshCw size={18} />
              <span>Retry Connection</span>
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              <XCircle size={18} />
              <span>Exit Lobby</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3D WEBGL GRAPHICS VIEWPORT CANVAS CONTAINER
          Forced to render smoothly at full resolution sizes with inline styling safety guardrails */}
      <div 
        ref={refContainer} 
        className="absolute inset-0 w-full h-full z-10"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* HEADS UP HUD INTERFACE DISPLAY LAYER (Z-20 Overlaps Graphics Canvas) */}
      {gameInstance && !isLoading && !connectionError && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <GameHud
            messages={messages}
            sendMessage={gameInstance.hud.sendMessageToServer}
            gameInstance={gameInstance}
          />
        </div>
      )}
    </div>
  )
}
