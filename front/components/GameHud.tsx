'use client'

import React, { useState, useEffect } from 'react'
import { Joystick } from 'react-joystick-component'
import { MessageComponent } from '@shared/component/MessageComponent'
import { Game } from '@/game/Game'

interface GameHudProps {
  messages: MessageComponent[]
  gameInstance: Game | null
}

export default function GameHud({ messages, gameInstance }: GameHudProps) {
  const [chatText, setChatText] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect if mobile on mount
  useEffect(() => {
    setIsMobile(/iPhone|iPad|Android|Mobile/.test(navigator.userAgent))
  }, [])

  // FIXED: Direct input state setters for mobile buttons
  const handleJumpStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (gameInstance?.inputManager) {
      gameInstance.inputManager.setJump(true)
    }
  }

  const handleJumpEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (gameInstance?.inputManager) {
      gameInstance.inputManager.setJump(false)
    }
  }

  const handleInteractStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (gameInstance?.inputManager) {
      gameInstance.inputManager.setInteract(true)
    }
  }

  const handleInteractEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (gameInstance?.inputManager) {
      gameInstance.inputManager.setInteract(false)
    }
  }

  // FIXED: Joystick handlers with safety checks
  const handleJoystickMove = (e: any) => {
    if (gameInstance?.inputManager) {
      gameInstance.inputManager.handleJoystickMove(e)
    }
  }

  const handleJoystickStop = (e: any) => {
    if (gameInstance?.inputManager) {
      gameInstance.inputManager.handleJoystickStop(e)
    }
  }

  const handleSendChat = () => {
    if (!chatText.trim() || !gameInstance) return

    try {
      // Send message through the websocket manager
      gameInstance.websocketManager.send({
        t: 1, // ClientMessageType.CHAT_MESSAGE
        content: chatText.trim(),
      })
      setChatText('')
    } catch (error) {
      console.error('Failed to send chat message:', error)
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      {/* Chat Messages Display */}
      <div className="absolute top-4 left-4 max-w-xs bg-black/50 rounded-lg p-3 max-h-40 overflow-y-auto pointer-events-auto">
        {messages && messages.length > 0 && (
          <div className="space-y-1">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-xs text-white">
                <span className="font-bold text-blue-400">{msg.sender}:</span>
                <span className="ml-1 text-gray-200">{msg.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="absolute bottom-4 left-4 max-w-sm bg-black/70 rounded-lg p-2 pointer-events-auto flex gap-2">
        <input
          type="text"
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
          placeholder="Press T to chat..."
          className="flex-1 bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSendChat}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded font-bold transition-colors"
        >
          Send
        </button>
      </div>

      {/* Mobile Controls */}
      {isMobile && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Joystick (Left Side) */}
          <div className="absolute bottom-6 left-6 pointer-events-auto">
            <Joystick
              size={100}
              baseColor="rgba(255, 255, 255, 0.15)"
              stickColor="rgba(255, 255, 255, 0.4)"
              move={handleJoystickMove}
              stop={handleJoystickStop}
              throttle={50}
            />
          </div>

          {/* Action Buttons (Right Side) */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
            {/* Jump Button */}
            <button
              className="w-16 h-16 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 active:from-blue-600 active:to-blue-800 text-white font-bold text-xs rounded-lg shadow-lg border-2 border-blue-400 transition-all flex items-center justify-center"
              onTouchStart={handleJumpStart}
              onTouchEnd={handleJumpEnd}
              onMouseDown={handleJumpStart}
              onMouseUp={handleJumpEnd}
              onMouseLeave={handleJumpEnd}
            >
              JUMP
            </button>

            {/* Interact Button */}
            <button
              className="w-16 h-16 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 active:from-green-600 active:to-green-800 text-white font-bold text-xs rounded-lg shadow-lg border-2 border-green-400 transition-all flex items-center justify-center"
              onTouchStart={handleInteractStart}
              onTouchEnd={handleInteractEnd}
              onMouseDown={handleInteractStart}
              onMouseUp={handleInteractEnd}
              onMouseLeave={handleInteractEnd}
            >
              E
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
