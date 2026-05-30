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

  useEffect(() => {
    let activeGame: Game | null = null
    let isMounted = true

    async function initializeGame() {
      if (!refContainer.current) return

      setIsLoading(true)
      setConnectionError(null)

      try {
        // The slug is all we need — the server handles routing by URL path.
        // No more ports, no gateway path tricks.
        const slug = gameInfo.slug || 'test'

        const game = Game.getInstance(slug, refContainer)
        game.hud.passChatState(setMessages)

        if (isMounted) {
          setGameInstance(game)
          activeGame = game
        }

        await game.start()

        // Wait one tick for FIRST_CONNECTION to be processed before sending name
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
      console.error('Failed to reset player:', err)
    }
    setIsSettingsOpen(false)
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
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

      {gameInstance && !isLoading && !connectionError && !isSettingsOpen && (
        <button onClick={() => setIsSettingsOpen(true)} className="absolute top-4 left-4 z-30 p-2.5 bg-gray-900/80 text-gray-300 border border-gray-800 rounded-xl">
          <Settings className="w-5 h-5" />
        </button>
      )}

      {isSettingsOpen && (
        <div className="absolute top-4 left-4 z-40 bg-gray-900/95 border border-gray-800 rounded-2xl p-4 space-y-2 min-w-40">
          <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 left-4 p-2.5 bg-gray-900/90 border border-gray-800 rounded-xl text-gray-400">X</button>
          <Button onClick={handleResetCharacter} variant="outline" className="w-full">Reset Character</Button>
          <Button onClick={handleLeaveGame} variant="destructive" className="w-full">Leave Game</Button>
        </div>
      )}

      <div ref={refContainer} className="w-full h-full" />

      {gameInstance && !isLoading && !connectionError && (
        <div id="hud">
          <GameHud messages={messages} gameInstance={gameInstance} />
        </div>
      )}
    </div>
  )
}
