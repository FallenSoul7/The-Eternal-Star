import Rapier from '../physics/rapier.js'
import { EntityManager } from '@shared/system/EntityManager.js'
import { EventSystem } from '@shared/system/EventSystem.js'
import { PlayerComponent } from '@shared/component/PlayerComponent.js'
import { TextComponent } from '@shared/component/TextComponent.js'
import { PositionComponent } from '@shared/component/PositionComponent.js'
import { SerializedMessageType } from '@shared/network/server/serialized.js'
import { ComponentAddedEvent } from '@shared/component/events/ComponentAddedEvent.js'
import { ComponentRemovedEvent } from '@shared/component/events/ComponentRemovedEvent.js'
import { MessageEvent } from '../ecs/component/events/MessageEvent.js'
import { SpawnPositionComponent } from '../ecs/component/SpawnPositionComponent.js'
import { DynamicRigidBodyComponent } from '../ecs/component/physics/DynamicRigidBodyComponent.js'
import { ScriptableSystem } from '../ecs/system/ScriptableSystem.js'
import { ChatComponent } from '../ecs/component/tag/TagChatComponent.js'
import { MapWorld } from '../ecs/entity/MapWorld.js'
import { TriggerCube } from '../ecs/entity/TriggerCube.js'

const MAP_URL = 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Untitled%20folder/Village%20obbesy.glb'

new MapWorld(MAP_URL)

const chatEntity = EntityManager.getFirstEntityWithComponent(
  EntityManager.getInstance().getAllEntities(),
  ChatComponent
)!

function sendGlobalChat(author: string, message: string) {
  EventSystem.addEvent(
    new MessageEvent(chatEntity.id, author, message, SerializedMessageType.GLOBAL_CHAT)
  )
}

function sendTargetedNotification(author: string, message: string, targetPlayerIds: number[]) {
  EventSystem.addEvent(
    new MessageEvent(
      chatEntity.id,
      author,
      message,
      SerializedMessageType.TARGETED_NOTIFICATION,
      targetPlayerIds
    )
  )
}

function sendTargetedChat(author: string, message: string, targetPlayerIds: number[]) {
  EventSystem.addEvent(
    new MessageEvent(
      chatEntity.id,
      author,
      message,
      SerializedMessageType.TARGETED_CHAT,
      targetPlayerIds
    )
  )
}

// Death zone — if player falls below Y=-50 they respawn at start
new TriggerCube(
  0, -60, 0,
  2000, 10, 2000,
  (entity) => {
    if (entity.getComponent(PlayerComponent)) {
      const body = entity.getComponent(DynamicRigidBodyComponent)?.body
      const spawn = entity.getComponent(SpawnPositionComponent)
      if (body && spawn) {
        body.setTranslation(new Rapier.Vector3(spawn.x, spawn.y, spawn.z), true)
        body.setLinvel(new Rapier.Vector3(0, 0, 0), true)
      } else if (body) {
        body.setTranslation(new Rapier.Vector3(0, 10, 0), true)
        body.setLinvel(new Rapier.Vector3(0, 0, 0), true)
      }
      const name = entity.getComponent(TextComponent)?.text ?? 'Player'
      sendGlobalChat('💀', `${name} fell off!`)
    }
  },
  () => {},
  false
)

sendGlobalChat('🏡', 'Welcome to Village Obby!')

ScriptableSystem.update = (dt, entities) => {
  // Player joined
  const playerAddedEvents = EventSystem.getEventsWrapped(ComponentAddedEvent, PlayerComponent)
  for (const event of playerAddedEvents) {
    const playerId = event.entityId
    const playerEntity = EntityManager.getEntityById(entities, playerId)
    if (!playerEntity) continue

    const pos = playerEntity.getComponent(PositionComponent)
    if (pos) {
      playerEntity.addComponent(
        new SpawnPositionComponent(playerId, pos.x, pos.y, pos.z)
      )
    }

    const name = playerEntity.getComponent(PlayerComponent)?.name ?? 'Player'
    sendGlobalChat('👋', `${name} joined Village Obby!`)
    sendTargetedNotification('🏡 Village Obby', 'Try to explore the village! Use /cp to set a checkpoint.', [playerId])
  }

  // Player left
  const playerRemovedEvents = EventSystem.getEventsWrapped(ComponentRemovedEvent, PlayerComponent)
  for (const event of playerRemovedEvents) {
    sendGlobalChat('👋', `A player left Village Obby.`)
  }

  // Chat commands
  const messageEvents = EventSystem.getEvents(MessageEvent)
  for (const event of messageEvents) {
    if (event.messageType !== SerializedMessageType.GLOBAL_CHAT) continue
    const content = event.content.trim()

    if (content === '/cp' || content === '/checkpoint') {
      const playerEntity = EntityManager.getEntityById(entities, event.entityId)
      const pos = playerEntity?.getComponent(PositionComponent)
      if (playerEntity && pos) {
        const spawn = playerEntity.getComponent(SpawnPositionComponent)
        if (spawn) {
          spawn.x = pos.x
          spawn.y = pos.y
          spawn.z = pos.z
        } else {
          playerEntity.addComponent(
            new SpawnPositionComponent(event.entityId, pos.x, pos.y, pos.z)
          )
        }
        sendTargetedChat('✅ Checkpoint', 'Checkpoint saved!', [event.entityId])
        sendTargetedNotification('✅', 'Checkpoint saved!', [event.entityId])
      }
    } else if (content === '/help') {
      sendTargetedChat('📖 Help', 'Commands: /cp or /checkpoint — save your position', [event.entityId])
    }
  }
}
