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

  const purgeGameEngineUI = () => {
    const targets = ['Car', 'Enter', 'Interact', 'JUMP']
    document.querySelectorAll('button, div, span, p').forEach((el) => {
      const text = el.textContent?.trim() || ''
      if (targets.some(t => text.includes(t)) && !el.closest('#hud')) {
        el.remove()
      }
    })

    const doc = document as any
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {})
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
        // Safe slug generation to ensure compatibility with your proxy path structure
        const mapSlug = gameInfo.slug || String(gameInfo.title || 'football').toLowerCase().replace(/\s+/g, '-')
        
        // Formats the precise path expected by your gateway server proxy router
        const gatewayPath = `${mapSlug}/${gameInfo.websocketPort}`

        const game = Game.getInstance(gatewayPath as any, refContainer)
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
        console.error('Network connection breakdown:', error)
        if (isMounted) {
          setIsLoading(false)
          setConnectionError(`Failed to connect to the Gateway Server. Ensure the proxy is running.`)
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
  }, [gameInfo.id, gameInfo.slug, gameInfo.title, gameInfo.websocketPort, playerName])

  const handleRetry = () => {
    window.location.reload()
  }

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
      console.error('Failed to trigger player respawn:', err)
    }
    setIsSettingsOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-[#07070c] text-white overflow-hidden select-none" style={{ width: '100vw', height: '100vh', overscrollBehavior: 'none', touchAction: 'none' }}>
      {isLoading && <LoadingScreen />}

      {connectionError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090f]/95 backdrop-blur-md px-6 text-center">
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full mb-4">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase">Connection Lost</h2>
          <p className="text-sm text-gray-400 max-w-sm mb-8">{connectionError}</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <button onClick={handleRetry} className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 font-bold rounded-xl"><RefreshCw size={18} />Retry</button>
            <Link href="/" className="flex items-center justify-center gap-2 w-full py-3.5 bg-neutral-900 text-gray-400 font-bold rounded-xl"><XCircle size={18} />Exit</Link>
          </div>
        </div>
      )}

      {gameInstance && !isLoading && !connectionError && !isSettingsOpen && (
        <button onClick={() => setIsSettingsOpen(true)} className="absolute top-4 left-4 z-30 p-2.5 bg-gray-900/80 text-gray-300 border border-gray-800 rounded-xl"><Settings size={22} /></button>
      )}

      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 left-4 p-2.5 bg-gray-900/90 border border-gray-800 rounded-xl text-gray-400">X</button>
          <div className="flex flex-col gap-4 w-full max-w-xs px-4">
            <Button variant="default" size="lg" onClick={handleResetCharacter} className="w-full py-6 font-bold uppercase text-base">Reset Character</Button>
            <Button variant="destructive" size="lg" onClick={handleLeaveGame} className="w-full py-6 font-bold uppercase text-base">Leave Game</Button>
          </div>
        </div>
      )}

      <div ref={refContainer} className="absolute inset-0 w-full h-full z-10" style={{ display: 'block' }} />

      {gameInstance && !isLoading && !connectionError && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <GameHud messages={messages} sendMessage={gameInstance.hud.sendMessageToServer} gameInstance={gameInstance} />
        </div>
      )}
    </div>
  )
}
