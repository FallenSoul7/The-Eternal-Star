'use client'

import React, { useState, useEffect } from 'react'
import { Joystick } from 'react-joystick-component'
import { MessageComponent } from '@shared/component/MessageComponent'
import { Game } from '@/game/Game'
import styles from '@/styles/GameHud.module.css'

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
    <div className={styles.gameHud}>
      {/* Chat Messages Display */}
      <div className={styles.chatContainer}>
        {messages && messages.length > 0 && (
          <div className={styles.messageList}>
            {messages.map((msg, idx) => (
              <div key={idx} className={styles.message}>
                <span className={styles.sender}>{msg.sender}:</span>
                <span className={styles.content}>{msg.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className={styles.chatInput}>
        <input
          type="text"
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
          placeholder="Press T to chat..."
          className={styles.inputField}
        />
        <button onClick={handleSendChat} className={styles.sendButton}>
          Send
        </button>
      </div>

      {/* Mobile Controls */}
      {isMobile && (
        <div className={styles.mobileControls}>
          {/* Joystick (Left Side) */}
          <div className={styles.joystickContainer}>
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
          <div className={styles.actionButtonsContainer}>
            {/* Jump Button */}
            <button
              className={`${styles.actionButton} ${styles.jumpButton}`}
              onTouchStart={handleJumpStart}
              onTouchEnd={handleJumpEnd}
              onMouseDown={handleJumpStart}
              onMouseUp={handleJumpEnd}
              onMouseLeave={handleJumpEnd}
            >
              <span className={styles.buttonLabel}>JUMP</span>
            </button>

            {/* Interact Button */}
            <button
              className={`${styles.actionButton} ${styles.interactButton}`}
              onTouchStart={handleInteractStart}
              onTouchEnd={handleInteractEnd}
              onMouseDown={handleInteractStart}
              onMouseUp={handleInteractEnd}
              onMouseLeave={handleInteractEnd}
            >
              <span className={styles.buttonLabel}>INTERACT</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
