import 'dotenv/config'
import uWS, { HttpRequest, HttpResponse, WebSocket } from 'uWebSockets.js'
import { unpack } from 'msgpackr'
import { RateLimiterMemory } from 'rate-limiter-flexible'

import { RoomManager } from './RoomManager.js'
import { Room } from './Room.js'
import { Player } from './ecs/entity/Player.js'
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
import { ServerMessageType, ConnectionMessage } from '@shared/network/server/index.js'
import { config } from '@shared/network/config.js'

type SocketData = {
  slug: string
  player?: Player
}

const roomManager = RoomManager.getInstance()
const inputProcessingSystem = new InputProcessingSystem()
const limiter = new RateLimiterMemory({ points: 10, duration: 1 })

async function isRateLimited(ip: string): Promise<boolean> {
  try { await limiter.consume(ip); return false }
  catch { return true }
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production'
  const acceptedOrigin = process.env.FRONTEND_URL

  console.log(`NODE_ENV : Running in ${isProduction ? 'production' : 'development'} mode`)

  const app = isProduction
    ? uWS.SSLApp({
        key_file_name: process.env.SSL_KEY_FILE ?? '/etc/letsencrypt/live/npm-3/privkey.pem',
        cert_file_name: process.env.SSL_CERT_FILE ?? '/etc/letsencrypt/live/npm-3/cert.pem',
      })
    : uWS.App()

  // Health check endpoint
  app.get('/health', (res: HttpResponse) => {
    res.writeHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      status: 'ok',
      rooms: roomManager.stats,
      activeRooms: roomManager.activeRoomCount,
      uptime: process.uptime(),
    }))
  })

  app.ws<SocketData>('/*', {
    idleTimeout: 60,
    maxBackpressure: 1024,
    maxPayloadLength: 512,
    compression: uWS.DEDICATED_COMPRESSOR_3KB,

    upgrade: (res: HttpResponse, req: HttpRequest, context) => {
      const origin = req.getHeader('origin')
      if (isProduction && acceptedOrigin && origin !== acceptedOrigin) {
        res.writeStatus('403 Forbidden').end()
        return
      }

      // Extract slug from URL path e.g. "/football" → "football"
      const slug = req.getUrl().replace(/^\//, '').split('/')[0] || 'test'

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

      const ipBuffer = ws.getRemoteAddressAsText() as ArrayBuffer
      const ip = Buffer.from(ipBuffer).toString()
      if (await isRateLimited(ip)) {
        console.warn(`[Gateway] Rate limited: ${ip}`)
        ws.close()
        return
      }

      try {
        const room = await roomManager.getOrCreate(slug)

        // activate() points singletons at this room then add player
        room.activate()
        const player = room.addPlayer(ws, 0, 450, 0)
        ws.getUserData().player = player

        // Send FIRST_CONNECTION
        const connectionMessage: ConnectionMessage = {
          t: ServerMessageType.FIRST_CONNECTION,
          id: player.entity.id,
          tickRate: config.SERVER_TICKRATE,
        }
        ws.send(NetworkSystem.compress(connectionMessage), true)

        // Welcome chat message
        EventSystem.addEvent(
          new MessageEvent(
            player.entity.id,
            '🖥️ [SERVER]',
            `Welcome to ${slug}!`
          )
        )

        ws.subscribe(slug)
        console.log(`[Gateway] Player connected to "${slug}"`)
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

      room.activate()
      const clientMessage: ClientMessage = unpack(Buffer.from(message))
      handleMessage(clientMessage, player, room)
    },

    close: (ws: WebSocket<SocketData>) => {
      const { slug, player } = ws.getUserData()
      if (!player) return
      const room = roomManager.getRoom(slug)
      if (!room) return

      room.activate()
      EventSystem.addNetworkEvent(new EntityDestroyedEvent(player.entity.id))
      player.entity.removeComponent(WebSocketComponent)
      room.removePlayer(player)
      roomManager.onPlayerLeft(slug)

      console.log(`[Gateway] Player disconnected from "${slug}"`)
    },
  })

  const PORT = Number(process.env.PORT) || 8000
  app.listen(PORT, (token: unknown) => {
    if (token) {
      console.log(`\n🚀 Eternal Star Master Server running on port ${PORT}`)
      console.log(`   Connect via: ws://your-server/{slug}`)
      console.log(`   e.g. ws://localhost:${PORT}/football\n`)
    } else {
      console.error(`❌ Failed to listen on port ${PORT}`)
      process.exit(1)
    }
  })
}

function handleMessage(msg: ClientMessage, player: Player, room: Room) {
  switch (msg.t) {
    case ClientMessageType.INPUT: {
      const inputMsg = msg as InputMessage
      const { u, d, l, r, s, y, i } = inputMsg
      
      // FIXED: Accept both boolean AND numeric input (joystick sends numbers)
      // Validate that we have direction inputs or jump/interact
      const hasDirectionInput = typeof u === 'boolean' || typeof d === 'boolean' || 
                               typeof l === 'boolean' || typeof r === 'boolean'
      const hasActionInput = typeof s === 'boolean' || typeof i === 'boolean'
      const hasJoystickInput = typeof y === 'number' // Joystick Y value
      
      if (hasDirectionInput || hasActionInput || hasJoystickInput) {
        inputProcessingSystem.receiveInputPacket(player.entity, inputMsg)
      }
      break
    }
    case ClientMessageType.CHAT_MESSAGE: {
      const { content } = msg as ChatMessage
      if (!content || typeof content !== 'string') break
      const name = player.entity.getComponent(PlayerComponent)?.name
      if (name) EventSystem.addEvent(new MessageEvent(player.entity.id, name, content))
      break
    }
    case ClientMessageType.PROXIMITY_PROMPT_INTERACT: {
      const { eId } = msg as ProximityPromptInteractMessage
      EventSystem.addEvent(new ProximityPromptInteractEvent(player.entity.id, eId))
      break
    }
    case ClientMessageType.SET_PLAYER_NAME: {
      const { name } = msg as SetPlayerNameMessage
      if (!name || typeof name !== 'string') break

      const playerComp = player.entity.getComponent(PlayerComponent)
      if (playerComp && !playerComp.name.startsWith('Player')) break

      let sanitized = name.trim().substring(0, 20).replace(/<[^>]*>|[<>]/g, '').replace(/\s+/g, '')
      if (!sanitized) sanitized = `Player${player.entity.id}`

      const isDupe = room.players.some(
        p => p.entity.id !== player.entity.id &&
             p.entity.getComponent(PlayerComponent)?.name === sanitized
      )
      if (isDupe) sanitized += player.entity.id

      if (playerComp) playerComp.name = sanitized
      const textComp = player.entity.getComponent(TextComponent)
      if (textComp) { textComp.text = sanitized; textComp.updated = true }
      console.log(`[Room:${room.slug}] Player name set: ${sanitized}`)
      break
    }
  }
}

startServer().catch(err => {
  console.error('[FATAL]', err)
  process.exit(1)
})
