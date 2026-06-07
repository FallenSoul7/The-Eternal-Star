/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-undef */
import { useEffect, useRef, useState } from 'react'
import { Joystick } from 'react-joystick-component'
import { Game } from '@/game/Game'
import { SerializedMessageType } from '@shared/network/server/serialized'
import { MessageComponent } from '@shared/component/MessageComponent'
import { MicroGameCard } from './GameCard'
import { GameInfo } from '@/types'
import gameData from '../public/gameData.json'

export interface GameHudProps {
  messages: MessageComponent[]
  sendMessage: (message: string) => void
  gameInstance: Game
}

export default function GameHud({
  messages: messageComponents,
  sendMessage,
  gameInstance,
}: GameHudProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const refContainer = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<
    Array<{ id: number; content: string; author: string; timestamp: number }>
  >([])
  const processedMessagesRef = useRef<Set<number>>(new Set())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messageComponents])

  // Automatically trigger browser fullscreen mode on first mobile interaction
  useEffect(() => {
    const triggerFullscreen = () => {
      const element = document.documentElement as any
      const doc = document as any
      
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(() => {})
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen().catch(() => {})
        }
      }
    }

    window.addEventListener('touchstart', triggerFullscreen, { passive: true })
    window.addEventListener('click', triggerFullscreen, { passive: true })

    return () => {
      window.removeEventListener('touchstart', triggerFullscreen)
      window.removeEventListener('click', triggerFullscreen)
    }
  }, [])

  useEffect(() => {
    if (!messageComponents || messageComponents.length === 0) return

    messageComponents.forEach((messageComponent, index) => {
      const messageType = messageComponent.messageType
      const messageId = messageComponent.timestamp

      if (processedMessagesRef.current.has(messageId)) {
        return
      }

      if (
        messageType === SerializedMessageType.GLOBAL_NOTIFICATION ||
        (messageType === SerializedMessageType.TARGETED_NOTIFICATION &&
          gameInstance?.currentPlayerEntityId &&
          messageComponent.targetPlayerIds?.includes(gameInstance?.currentPlayerEntityId))
      ) {
        processedMessagesRef.current.add(messageId)

        const newNotification = {
          id: Date.now() + index,
          content: messageComponent.content,
          author: messageComponent.author,
          timestamp: Date.now(),
        }

        setNotifications([newNotification])

        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id))
        }, 5000)
      }
    })
  }, [messageComponents, gameInstance?.currentPlayerEntityId])

  const getFilteredMessages = () => {
    if (!messageComponents || messageComponents.length === 0) return []

    return messageComponents.filter((message) => {
      const messageType = message.messageType
      const targetPlayerIds = message.targetPlayerIds || []
      
      if (messageType === SerializedMessageType.GLOBAL_CHAT) return true

      if (
        messageType === SerializedMessageType.TARGETED_CHAT &&
        gameInstance?.currentPlayerEntityId
      ) {
        return targetPlayerIds.includes(gameInstance?.currentPlayerEntityId)
      }

      if (
        messageType === SerializedMessageType.GLOBAL_NOTIFICATION ||
        messageType === SerializedMessageType.TARGETED_NOTIFICATION
      ) {
        return false
      }

      return true
    })
  }

  return (
    <div
      id="hud"
      className="fixed inset-0 bg-gray-800 bg-opacity-0 text-white p-4 z-50 pointer-events-none"
      ref={refContainer}
    >
      {/* Global Notifications */}
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-black/60 text-white w-full max-w-sm p-3 rounded-lg shadow-xl text-center transition-opacity duration-500"
            style={{
              animation: 'bounceIn 0.4s ease-out, fadeOut 0.6s ease 4s forwards',
              transformOrigin: 'top center',
            }}
          >
            <div className="flex flex-col items-center">
              <p className="font-semibold font-sans text-yellow-400 text-lg sm:text-xl">
                {notification.author}
              </p>
              <p className="text-white text-base sm:text-lg">{notification.content}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 bg-black bg-opacity-20 rounded-xl p-4 z-50 hidden lg:flex flex-col w-[360px] pointer-events-auto space-y-2">
        <div className="grid grid-cols-4 gap-3">
          {gameData.slice(0, 4).map((game: GameInfo) => (
            <MicroGameCard
              key={game.slug}
              title={game.title}
              imageUrl={game.imageUrl}
              slug={game.slug}
            />
          ))}
        </div>

        <div className="overflow-y-auto max-h-64 h-64 space-y-2 pr-2">
          {getFilteredMessages().map((messageComponent, index) => {
            return (
              <div
                key={index}
                ref={index === getFilteredMessages().length - 1 ? messagesEndRef : null}
              >
                <div
                  className={`rounded-lg p-2 ${
                    messageComponent.messageType === SerializedMessageType.TARGETED_CHAT
                      ? 'bg-gray-900 bg-opacity-40 p-2'
                      : 'bg-gray-700 bg-opacity-30'
                  }`}
                >
                  <p className="text-sm break-words">
                    <span className="font-medium">
                      {messageComponent.author}
                    </span>
                    : {messageComponent.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          className="p-2 bg-gray-700 bg-opacity-30 text-white rounded-lg"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              sendMessage(e.currentTarget.value)
              e.currentTarget.value = ''
              e.currentTarget.blur()
            }
          }}
        />
      </div>

      <div className="flex lg:hidden pointer-events-auto">
        <div className="absolute bottom-12 left-12">
          <Joystick
            size={100}
            baseColor="rgba(255, 255, 255, 0.5)"
            stickColor="rgba(255, 255, 255, 0.2)"
            move={(props) => {
              // FIXED: Safe null check
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.handleJoystickMove(props)
              }
            }}
            stop={(props) => {
              // FIXED: Safe null check
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.handleJoystickStop(props)
              }
            }}
          />
        </div>
        <div className="absolute bottom-12 right-12">
          <button
            className="bg-gray-500 bg-opacity-20 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:bg-gray-600 hover:bg-opacity-100 focus:bg-green-600 focus:bg-opacity-100 focus:outline-none active:translate-y-1 w-24 h-24 flex items-center justify-center select-none touch-manipulation"
            
            // FIXED: Use new setJump() method with safe checks
            onTouchStart={(e) => {
              e.preventDefault()
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.setJump(true)
              }
            }}
            onMouseDown={() => {
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.setJump(true)
              }
            }}
            
            onTouchEnd={() => {
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.setJump(false)
              }
            }}
            onTouchCancel={() => {
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.setJump(false)
              }
            }}
            onMouseUp={() => {
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.setJump(false)
              }
            }}
            onMouseLeave={() => {
              if (gameInstance?.inputManager) {
                gameInstance.inputManager.setJump(false)
              }
            }}
          >
            <span className="pointer-events-none">Jump</span>
          </button>
        </div>
      </div>
    </div>
  )
}
