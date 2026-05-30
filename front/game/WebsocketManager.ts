import { unpack, pack } from 'msgpackr'
import { ServerMessage, ServerMessageType } from '@shared/network/server/base'
import { SnapshotMessage } from '@shared/network/server/serialized'
import { Game } from './Game'
import { ConnectionMessage } from '@shared/network/server/connection'
import { ClientMessage } from '@shared/network/client/base'
import { isNativeAccelerationEnabled } from 'msgpackr'
import pako from 'pako'
import { config } from '@shared/network/config'

if (!isNativeAccelerationEnabled)
  console.warn('Native acceleration not enabled, verify that install finished properly')

type MessageHandler = (message: ServerMessage) => void

export class WebSocketManager {
  private websocket: WebSocket | null = null
  private messageHandlers: Map<ServerMessageType, MessageHandler> = new Map()
  private serverUrl: string

  timeSinceLastServerUpdate: number = 0

  /**
   * slug: the map slug e.g. "football", "obby", "my-custom-map"
   * The server URL comes from NEXT_PUBLIC_SERVER_URL env var.
   * All maps now live on the same server, differentiated by URL path.
   *
   * Dev:  ws://localhost:8000/football
   * Prod: wss://your-render-server.onrender.com/football
   */
  constructor(game: Game, slug: string) {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'ws://localhost:8000'
    // Strip any trailing slash, then append the slug as the path
    this.serverUrl = `${baseUrl.replace(/\/$/, '')}/${slug}`

    this.addMessageHandler(ServerMessageType.FIRST_CONNECTION, (message) => {
      const connectionMessage = message as ConnectionMessage
      game.currentPlayerEntityId = connectionMessage.id
      config.SERVER_TICKRATE = connectionMessage.tickRate
      console.log(
        `[WS] Connected to "${slug}" — player ID: ${game.currentPlayerEntityId}, tickRate: ${connectionMessage.tickRate}`
      )
    })

    this.addMessageHandler(ServerMessageType.SNAPSHOT, (message) => {
      this.timeSinceLastServerUpdate = 0
      game.syncComponentSystem.addSnapshotMessage(message as SnapshotMessage)
    })
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        console.log(`[WS] Connecting to ${this.serverUrl}`)
        this.websocket = new WebSocket(this.serverUrl)

        this.websocket.addEventListener('open', () => {
          console.log(`[WS] Connected to ${this.serverUrl}`)
          resolve()
        })
        this.websocket.addEventListener('message', this.onMessage.bind(this))
        this.websocket.addEventListener('error', (errorEvent) => {
          console.error('[WS] Connection error:', errorEvent)
          reject(errorEvent)
        })
        this.websocket.addEventListener('close', (closeEvent) => {
          if (closeEvent.wasClean) {
            console.log(`[WS] Closed cleanly (code=${closeEvent.code})`)
          } else {
            console.error('[WS] Connection abruptly closed')
          }
        })
      } else {
        resolve()
      }
    })
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }

  addMessageHandler(type: ServerMessageType, handler: MessageHandler) {
    this.messageHandlers.set(type, handler)
  }

  removeMessageHandler(type: ServerMessageType) {
    this.messageHandlers.delete(type)
  }

  send(message: ClientMessage) {
    if (!this.isConnected() || !this.websocket) {
      console.error("[WS] Not connected, can't send message", message)
      return
    }
    try {
      const packed = pack(message)
      this.websocket.send(packed)
    } catch (error) {
      console.error('[WS] Failed to send message:', error, message)
    }
  }

  private isConnected(): boolean {
    return this.websocket != null && this.websocket.readyState === WebSocket.OPEN
  }

  private async onMessage(event: MessageEvent) {
    const buffer = await event.data.arrayBuffer()
    const decompressed = pako.inflate(buffer)
    const message: ServerMessage = unpack(decompressed)
    const handler = this.messageHandlers.get(message.t)
    if (handler) handler(message)
  }
}
