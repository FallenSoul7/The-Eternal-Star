'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

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

  // Forcefully sweeps away any raw HTML tags injected by the engine
  const purgeGameEngineUI = () => {
    const targets = ['Car', 'Enter', 'Interact', 'JUMP']
    
    document.querySelectorAll('button, div, span, p').forEach((el) => {
      const text = el.textContent?.trim() || ''
      if (targets.some(t => text.includes(t)) && !el.closest('#hud')) {
        el.remove()
      }
    })

    // Drop fullscreen mode when exiting to home screen
    const doc = document as any
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {})
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    let activeGame: Game | null = null
    let isMounted = true

    async function initializeGame() {
      if (!refContainer.current) return
      
      setIsLoading(true)
      setConnectionError(null)

      try {
        // --- GATEWAY ARCHITECTURE UPDATE ---
        // Grab the map ID/Title (fallback to 'football' if missing)
        // Convert to lowercase and replace spaces with hyphens for the URL
        const rawMapName = (gameInfo as any).id || (gameInfo as any).title || 'football'
        const mapSlug = String(rawMapName).toLowerCase().replace(/\s+/g, '-')
        
        // This sends BOTH the map name and the specific port to the gateway dynamically
        const gatewayPath = `${mapSlug}/${gameInfo.websocketPort}`

        // Passing as `any` to bypass TypeScript in case Game.getInstance strictly expects a number
        const game = Game.getInstance(gatewayPath as any, refContainer)
        // -----------------------------------

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
            `Failed to connect to the Gateway Server. Ensure the proxy is running.`
          )
        }
      }
    }

    initializeGame()

    return () => {
      isMounted = false
      if (activeGame) {
        console.log('Component unmounting. Killing active websocket layers...')
        const gameObj = activeGame as any
        if (typeof gameObj.disconnect === 'function') {
          gameObj.disconnect()
        }
      }
      purgeGameEngineUI()
    }
  }, [gameInfo, playerName])

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
    purgeGameEngineUI()
    router.push('/')
  }

  const handleResetCharacter = () => {
    if (!gameInstance) return
    
    try {
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
      {isLoading && <LoadingScreen />}

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

      {gameInstance && !isLoading && !connectionError && !isSettingsOpen && (
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 left-4 z-30 p-2.5 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-xl pointer-events-auto transition-colors active:scale-95"
        >
          <Settings size={22} className="transition-transform duration-500 hover:rotate-45" />
        </button>
      )}

      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto animate-fade-in">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="absolute top-4 left-4 p-2.5 bg-gray-900/90 border border-gray-800 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white font-medium transition-colors"
          >
            X
          </button>

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

      <div 
        ref={refContainer} 
        className="absolute inset-0 w-full h-full z-10"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

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
