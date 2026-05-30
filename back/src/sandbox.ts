import 'dotenv/config'
import uWS, { WebSocket, HttpRequest, HttpResponse } from 'uWebSockets.js'
import { unpack } from 'msgpackr'
import { RateLimiterMemory } from 'rate-limiter-flexible'

import { RoomManager } from './RoomManager.js'
import { NetworkSystem } from './ecs/system/network/NetworkSystem.js'
import { EventSystem } from '@shared/system/EventSystem.js'
import { EntityManager } from '@shared/system/EntityManager.js'
import { PlayerComponent } from '@shared/component/PlayerComponent.js'
import { TextComponent } from '@shared/component/TextComponent.js'
import { WebSocketComponent } from './ecs/component/WebsocketComponent.js'
import { EntityDestroyedEvent } from '@shared/component/events/EntityDestroyedEvent.js'
import { MessageEvent } from './ecs/component/events/MessageEvent.js'
import { ProximityPromptInteractEvent } from './ecs/component/events/ProximityPromptInteractEvent.js'
import { InputProcessingSystem } from './ecs/system/InputProcessingSystem.js'
import {
  ClientMessageType,
  ClientMessage,
  InputMessage,
  ChatMessage,
  ProximityPromptInteractMessage,
  SetPlayerNameMessage,
} from '@shared/network/client/index.js'
import {
  ServerMessageType,
  ConnectionMessage,
} from '@shared/network/server/index.js'
import { config } from '@shared/network/config.js'
import { Room } from './Room.js'
import { Player } from './ecs/entity/Player.js'

// Per-connection user data attached to each WebSocket
type SocketData = {
  slug: string
  player?: Player
}

const roomManager = RoomManager.getInstance()
const inputProcessingSystem = new InputProcessingSystem()

const limiter = new RateLimiterMemory({ points: 10, duration: 1 })

async function isRateLimited(ip: string): Promise<boolean> {
  try {
    await limiter.consume(ip)
    return false
  } catch {
    return true
  }
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production'
  const acceptedOrigin = process.env.FRONTEND_URL
  const sslKeyFile = process.env.SSL_KEY_FILE || '/etc/letsencrypt/live/npm-3/privkey.pem'
  const sslCertFile = process.env.SSL_CERT_FILE || '/etc/letsencrypt/live/npm-3/cert.pem'

  const app = isProduction
    ? uWS.SSLApp({ key_file_name: sslKeyFile, cert_file_name: sslCertFile })
    : uWS.App()

  // ─── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (res) => {
    res.writeHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      rooms: roomManager.stats,
      activeRooms: roomManager.activeRoomCount,
    }))
  })

  // ─── WebSocket handler ───────────────────────────────────────────────────────
  // URL format: ws://server/football  or  wss://server/obby
  // The slug is extracted from the URL path.
  app.ws<SocketData>('/*', {
    idleTimeout: 60,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
    compression: uWS.DEDICATED_COMPRESSOR_3KB,

    upgrade: (res: HttpResponse, req: HttpRequest, context) => {
      // CORS check in production
      const origin = req.getHeader('origin')
      if (isProduction && acceptedOrigin && origin !== acceptedOrigin) {
        res.writeStatus('403 Forbidden').end()
        return
      }

      // Extract slug from URL — e.g. "/football" → "football"
      const url = req.getUrl()
      const slug = url.replace(/^\//, '').split('/')[0] || 'test'

      res.upgrade<SocketData>(
        { slug },
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      )
    },

    open: async (ws: WebSocket<SocketData>) => {
      const { slug } = ws.getUserData()

      // Rate limit check
      const ipBuffer = ws.getRemoteAddressAsText() as ArrayBuffer
      const ip = Buffer.from(ipBuffer).toString()
      if (await isRateLimited(ip)) {
        console.warn(`[Gateway] Rate limited: ${ip}`)
        ws.close()
        return
      }

      try {
        // Get or boot the room for this slug
        const room = await roomManager.getOrCreate(slug)

        // Run player creation inside the room's ECS context
        room.withContext(() => {
          const player = room.addPlayer(ws, 0, 15, 0)
          ws.getUserData().player = player

          // Send FIRST_CONNECTION message
          const connectionMessage: ConnectionMessage = {
            t: ServerMessageType.FIRST_CONNECTION,
            id: player.entity.id,
            tickRate: config.SERVER_TICKRATE,
          }
          ws.send(NetworkSystem.compress(connectionMessage), true)

          // Welcome notification in chat
          EventSystem.addEvent(
            new MessageEvent(
              player.entity.id,
              '🖥️ [SERVER]',
              `Welcome to ${slug}! Connected at ${new Date().toLocaleString()}`
            )
          )
        })

        // Subscribe to this room's topic for broadcast
        ws.subscribe(slug)

        console.log(`[Gateway] Player connected to room: "${slug}"`)
      } catch (err) {
        console.error(`[Gateway] Failed to connect player to room "${slug}":`, err)
        ws.close()
      }
    },

    message: (ws: WebSocket<SocketData>, message: ArrayBuffer) => {
      const { slug, player } = ws.getUserData()
      if (!player) return

      const room = roomManager.getRoom(slug)
      if (!room) return

      room.withContext(() => {
        const clientMessage: ClientMessage = unpack(Buffer.from(message))
        handleMessage(ws, clientMessage, player, room)
      })
    },

    close: (ws: WebSocket<SocketData>) => {
      const { slug, player } = ws.getUserData()
      if (!player) return

      const room = roomManager.getRoom(slug)
      if (!room) return

      room.withContext(() => {
        const entity = player.entity
        EventSystem.addNetworkEvent(new EntityDestroyedEvent(entity.id))
        entity.removeComponent(WebSocketComponent)
        room.removePlayer(player)
      })

      roomManager.onPlayerLeft(slug)
      console.log(`[Gateway] Player disconnected from room: "${slug}"`)
    },
  })

  // ─── Boot ────────────────────────────────────────────────────────────────────
  const PORT = Number(process.env.PORT) || 8000

  app.listen(PORT, (token) => {
    if (token) {
      console.log(`\n🚀 Eternal Star Master Server running on port ${PORT}`)
      console.log(`   Connect via: ws://your-server/${'{'}slug{'}'}`)
      console.log(`   e.g. ws://localhost:${PORT}/football\n`)
    } else {
      console.error(`❌ Failed to listen on port ${PORT}`)
      process.exit(1)
    }
  })
}

// ─── Message handlers ──────────────────────────────────────────────────────────

function handleMessage(
  ws: WebSocket<SocketData>,
  msg: ClientMessage,
  player: Player,
  room: Room
) {
  switch (msg.t) {
    case ClientMessageType.INPUT:
      handleInput(ws, msg as InputMessage, player)
      break
    case ClientMessageType.CHAT_MESSAGE:
      handleChat(msg as ChatMessage, player)
      break
    case ClientMessageType.PROXIMITY_PROMPT_INTERACT:
      handleProximityPrompt(msg as ProximityPromptInteractMessage, player)
      break
    case ClientMessageType.SET_PLAYER_NAME:
      handleSetName(msg as SetPlayerNameMessage, player, room)
      break
  }
}

function handleInput(ws: WebSocket<SocketData>, msg: InputMessage, player: Player) {
  const { u, d, l, r, s, y, i } = msg
  if (
    typeof u !== 'boolean' || typeof d !== 'boolean' ||
    typeof l !== 'boolean' || typeof r !== 'boolean' ||
    typeof s !== 'boolean' || typeof y !== 'number' ||
    typeof i !== 'boolean'
  ) return
  inputProcessingSystem.receiveInputPacket(player.entity, msg)
}

function handleChat(msg: ChatMessage, player: Player) {
  const { content } = msg
  if (!content || typeof content !== 'string' || content.length === 0) return
  const playerName = player.entity.getComponent(PlayerComponent)?.name
  if (!playerName) return
  EventSystem.addEvent(new MessageEvent(player.entity.id, playerName, content))
}

function handleProximityPrompt(msg: ProximityPromptInteractMessage, player: Player) {
  EventSystem.addEvent(new ProximityPromptInteractEvent(player.entity.id, msg.eId))
}

function handleSetName(msg: SetPlayerNameMessage, player: Player, room: Room) {
  const { name } = msg
  if (!name || typeof name !== 'string') return

  const playerComponent = player.entity.getComponent(PlayerComponent)
  if (playerComponent && !playerComponent.name.startsWith('Player')) return

  let sanitized = name.trim().substring(0, 20).replace(/<[^>]*>|[<>]/g, '').replace(/\s+/g, '')
  if (!sanitized) sanitized = `Player${player.entity.id}`

  // Duplicate name check within this room only
  const isDuplicate = room.players.some(
    p => p.entity.id !== player.entity.id &&
         p.entity.getComponent(PlayerComponent)?.name === sanitized
  )
  if (isDuplicate) sanitized += player.entity.id

  if (playerComponent) playerComponent.name = sanitized

  const textComponent = player.entity.getComponent(TextComponent)
  if (textComponent) {
    textComponent.text = sanitized
    textComponent.updated = true
    console.log(`[Room] Player ${player.entity.id} name set to: ${sanitized}`)
  }
}

startServer().catch(err => {
  console.error('[FATAL]', err)
  process.exit(1)
})
