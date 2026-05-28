'use client'

import { useEffect, useRef, useState } from 'react'
import { Game } from '@/game/Game'
import GameHud from '@/components/GameHud'
import LoadingScreen from '@/components/LoadingScreen'
import { MessageComponent } from '@shared/component/MessageComponent'
import { GameInfo } from '@/types'
import { AlertCircle, RefreshCw, XCircle, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface GamePlayerProps extends GameInfo {
  playerName?: string
}

export default function GamePlayer({ playerName, ...gameInfo }: GamePlayerProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageComponent[]>([])
  const [gameInstance, setGameInstance] = useState<Game | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
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
        const game = Game.getInstance(gameInfo.websocketPort, refContainer)
        game.hud.passChatState(setMessages)
        
        if (isMounted) {
          setGameInstance(game)
          activeGame = game
        }

        await game.start()

        const finalName = playerName?.trim() || 'Guest'
        game.setPlayerName(finalName)

        if (isMounted) {
          setIsLoading(false)
          retryCount.current = 0 
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

    return () => {
      isMounted = false
      if (activeGame) {
        console.log('Component unmounting. Killing active websocket layers...')
        // Bypass strict TS checking for optional engine disconnect methods
        const gameObj = activeGame as any
        if (typeof gameObj.disconnect === 'function') {
          gameObj.disconnect()
        }
      }
    }
  }, [gameInfo.websocketPort, playerName])

  const handleRetry = () => {
    retryCount.current += 1
    window.location.reload()
  }

  const handleLeaveGame = () => {
    if (gameInstance) {
      const gameObj = gameInstance as any
      if (typeof gameObj.disconnect === 'function') {
        gameObj.disconnect()
      }
    }
    router.push('/')
  }

  const handleResetCharacter = () => {
    if (!gameInstance) return
    
    try {
      // Bypass strict TS checking for dynamic engine reset fallbacks
      const gameObj = gameInstance as any
      if (typeof gameObj.resetPlayer === 'function') {
        gameObj.resetPlayer()
      } else if (gameObj.player && typeof gameObj.player.reset === 'function') {
        gameObj.player.reset()
      } else if (typeof gameObj.sendMessageToServer === 'function') {
        gameObj.sendMessageToServer('player:reset', {})
      } else if (gameObj.hud && typeof gameObj.hud.sendMessageToServer === 'function') {
        gameObj.hud.sendMessageToServer('player:reset', {})
      }
    } catch (err) {
      console.error('Failed to trigger player respawn lifecycle:', err)
    }
    
    setIsSettingsOpen(false)
  }

  const sendJumpSignal = (isActive: boolean) => {
    if (!gameInstance) return
    
    try {
      // Bypass strict TS checking for dynamic input hooks
      const gameObj = gameInstance as any
      if (gameObj.player && gameObj.player.input) {
        gameObj.player.input.jump = isActive
      } else if (typeof gameObj.setJumpInput === 'function') {
        gameObj.setJumpInput(isActive)
      } else if (gameObj.hud && typeof gameObj.hud.sendMessageToServer === 'function') {
        gameObj.hud.sendMessageToServer('input:jump', { active: isActive })
      }
    } catch (err) {
      console.error('Input system matching error:', err)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-[#07070c] text-white overflow-hidden select-none"
      style={{ 
        width: '100vw', 
        height: '100vh',
        overscrollBehavior: 'none', 
        touchAction: 'none'         
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

      {/* SYSTEM GEAR BUTTON (TOP LEFT) */}
      {gameInstance && !isLoading && !connectionError && !isSettingsOpen && (
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 left-4 z-30 p-2.5 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-xl pointer-events-auto transition-colors active:scale-95"
        >
          <Settings size={22} className="transition-transform duration-500 hover:rotate-45" />
        </button>
      )}

      {/* FULLSCREEN TRANSPARENT DARK SETTINGS OVERLAY */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in">
          {/* SYSTEM BUTTON X (TOP LEFT OF SCREEN OVERLAY) */}
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="absolute top-4 left-4 p-2.5 bg-gray-900/90 border border-gray-800 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white font-medium transition-colors"
          >
            X
          </button>

          {/* ACTION BUTTONS MAIN HUB CONTAINER */}
          <div className="flex flex-col gap-4 w-full max-w-xs px-4">
            <Button
              variant="default"
              size="lg"
              onClick={handleResetCharacter}
              className="w-full py-6 font-bold tracking-wide uppercase text-base border border-white/10 shadow-md"
            >
              Reset Character
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={handleLeaveGame}
              className="w-full py-6 font-bold tracking-wide uppercase text-base shadow-md"
            >
              Leave Game
            </Button>
          </div>
        </div>
      )}

      {/* 3D WEBGL GRAPHICS VIEWPORT CANVAS CONTAINER */}
      <div 
        ref={refContainer} 
        className="absolute inset-0 w-full h-full z-10"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* HEADS UP HUD INTERFACE DISPLAY LAYER */}
      {gameInstance && !isLoading && !connectionError && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <GameHud
            messages={messages}
            sendMessage={gameInstance.hud.sendMessageToServer}
            gameInstance={gameInstance}
          />
          
          {/* FLOATING ACTION INTERFACE FOR MOBILE HANDLERS (JUMP BUG SAFETY PATCH) */}
          <div className="absolute bottom-6 right-6 pointer-events-auto sm:hidden">
            <button
              onTouchStart={() => sendJumpSignal(true)}
              onTouchEnd={() => sendJumpSignal(false)}
              onTouchCancel={() => sendJumpSignal(false)}
              onMouseDown={() => sendJumpSignal(true)}
              onMouseUp={() => sendJumpSignal(false)}
              onMouseLeave={() => sendJumpSignal(false)}
              className="w-16 h-16 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-full flex items-center justify-center font-black tracking-tighter text-sm uppercase select-none transition-transform active:scale-90"
              style={{ touchAction: 'none' }}
            >
              Jump
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
