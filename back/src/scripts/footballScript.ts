import Rapier from '../physics/rapier.js'
import { EntityManager } from '@shared/system/EntityManager.js'
import { EventSystem } from '@shared/system/EventSystem.js'
import { PlayerComponent } from '@shared/component/PlayerComponent.js'
import { TextComponent } from '@shared/component/TextComponent.js'
import { RotationComponent } from '@shared/component/RotationComponent.js'
import { ProximityPromptComponent } from '@shared/component/ProximityPromptComponent.js'
import { SerializedMessageType } from '@shared/network/server/serialized.js'
import { ComponentAddedEvent } from '@shared/component/events/ComponentAddedEvent.js'
import { ColorEvent } from '../ecs/component/events/ColorEvent.js'
import { MessageEvent } from '../ecs/component/events/MessageEvent.js'
import { DynamicRigidBodyComponent } from '../ecs/component/physics/DynamicRigidBodyComponent.js'
import { InputComponent } from '../ecs/component/InputComponent.js'
import { ScriptableSystem } from '../ecs/system/ScriptableSystem.js'
import { ChatComponent } from '../ecs/component/tag/TagChatComponent.js'
import { FloatingText } from '../ecs/entity/FloatingText.js'
import { MapWorld } from '../ecs/entity/MapWorld.js'
import { Sphere } from '../ecs/entity/Sphere.js'
import { TriggerCube } from '../ecs/entity/TriggerCube.js'
import { Mesh } from '../ecs/entity/Mesh.js' // ✅ Added Mesh import to spawn your cat/character

// ✅ FIXED: Loaded the FlatMap so your player has ground to stand on
new MapWorld('https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/FlatMap.glb')

// ✅ FIXED: Spawning your Custom Character in the world
const customCharacter = new Mesh({
  position: { x: 5, y: 5, z: -10 }, 
  meshUrl: 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Character.glb',
  physicsProperties: { mass: 1, enableCcd: true },
})
customCharacter.entity.addNetworkComponent(new TextComponent(customCharacter.entity.id, 'Custom Character', 0, 2, 0))

// ✅ FIXED: Spawning your Cat pet!
const petCat = new Mesh({
  position: { x: -5, y: 5, z: -10 },
  meshUrl: 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Cat.glb',
  physicsProperties: { mass: 0.5, enableCcd: true },
})
petCat.entity.addNetworkComponent(new TextComponent(petCat.entity.id, 'Meow', 0, 2, 0))

// ✅ FIXED: Brought the ball to the center so it doesn't fall off the flat map
const ballSpawnPosition = { x: 0, y: 10, z: -10 }

const ball = new Sphere({
  radius: 1.4,
  position: {
    x: ballSpawnPosition.x,
    y: ballSpawnPosition.y,
    z: ballSpawnPosition.z,
  },
  // ✅ FIXED: Restored the proper Ball URL
  meshUrl: 'https://notbloxo.fra1.cdn.digitaloceanspaces.com/Notblox-Assets/base/Ball.glb',
  physicsProperties: {
    mass: 1.5,
    enableCcd: true,
    angularDamping: 0.3,
    linearDamping: 0.2,
  },
  colliderProperties: {
    friction: 0.2,
    restitution: 0.8,
  },
})

// Score display and management
const scoreText = new FloatingText('🔴 0 - 0 🔵', 0, 10, -50, 200)
let redScore = 0
let blueScore = 0

// Chat functionality
const chatEntity = EntityManager.getFirstEntityWithComponent(
  EntityManager.getInstance().getAllEntities(),
  ChatComponent
)!

function sendGlobalChatMessage(author: string, message: string) {
  EventSystem.addEvent(
    new MessageEvent(chatEntity.id, author, message, SerializedMessageType.GLOBAL_CHAT)
  )
}

function sendGlobalNotification(author: string, message: string) {
  EventSystem.addEvent(
    new MessageEvent(chatEntity.id, author, message, SerializedMessageType.GLOBAL_NOTIFICATION)
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

const updateScore = () => {
  sendGlobalChatMessage('⚽', `Score: 🔴 Red ${redScore} - ${blueScore} Blue 🔵`)
  scoreText.updateText(`🔴 ${redScore} - ${blueScore} 🔵`)
}

sendGlobalChatMessage('⚽', 'Football NotBlox.Online')
updateScore()

function createTeamTrigger(x: number, y: number, z: number, color: string, spawnX: number) {
  return new TriggerCube(
    x,
    y,
    z,
    12,
    2,
    12,
    (collidedWithEntity) => {
      if (collidedWithEntity.getComponent(PlayerComponent)) {
        EventSystem.addEvent(new ColorEvent(collidedWithEntity.id, color))
        const playerBody = collidedWithEntity.getComponent(DynamicRigidBodyComponent)!.body!
        
        // ✅ FIXED: Changed spawn to center so players don't teleport into the void
        playerBody.setTranslation(new Rapier.Vector3(spawnX, 5, 0), true)
        playerBody.setLinvel(new Rapier.Vector3(0, 0, 0), true)

        const isRedTeam = color === '#f0513c'
        const teamColor = isRedTeam ? 'red' : 'blue'
        const teamEmoji = isRedTeam ? '🔴' : '🔵'
        const playerName = collidedWithEntity.getComponent(TextComponent)?.text ?? 'Player'

        sendGlobalNotification(
          `${teamEmoji} New Player`,
          `${playerName} joined the ${teamColor} team`
        )
      }
    },
    () => {},
    false
  )
}

// ✅ FIXED: Brought team triggers closer to center map
createTeamTrigger(-24, 0, -10, '#f0513c', -30) // Red team
createTeamTrigger(24, 0, -10, '#3c9cf0', 30) // Blue team

function handleGoal(scoringTeam: 'red' | 'blue') {
  if (scoringTeam === 'blue') blueScore++
  else redScore++

  sendGlobalChatMessage('⚽', `${scoringTeam === 'blue' ? '🔵 Blue' : '🔴 Red'} team scores! 🎉`)
  sendGlobalNotification(
    '⚽ GOAL!',
    `${scoringTeam === 'blue' ? '🔵 Blue' : '🔴 Red'} team scores!`
  )
  updateScore()

  const body = ball.entity.getComponent(DynamicRigidBodyComponent)!.body!
  body.setTranslation(
    new Rapier.Vector3(ballSpawnPosition.x, ballSpawnPosition.y, ballSpawnPosition.z),
    true
  )
  body.setRotation(new Rapier.Quaternion(0, 0, 0, 1), true)
  body.setLinvel(new Rapier.Vector3(0, 0, 0), true)
}

// ✅ FIXED: Brought goal zones closer to the center
new TriggerCube(
  -80,
  -5,
  -10,
  5,
  10,
  13,
  (collidedWithEntity) => collidedWithEntity.id === ball.entity.id && handleGoal('blue'),
  () => {},
  false
)
new TriggerCube(
  80,
  -5,
  -10,
  5,
  10,
  13,
  (collidedWithEntity) => collidedWithEntity.id === ball.entity.id && handleGoal('red'),
  () => {},
  false
)

const proximityPromptComponent = new ProximityPromptComponent(ball.entity.id, {
  text: 'Kick',
  onInteract: (playerEntity) => {
    const ballRigidbody = ball.entity.getComponent(DynamicRigidBodyComponent)
    const playerRotationComponent = playerEntity.getComponent(RotationComponent)

    if (ballRigidbody && playerRotationComponent && playerEntity.getComponent(InputComponent)) {
      const direction = playerRotationComponent.getForwardDirection()
      sendTargetedNotification('', 'You kicked the ball!', [playerEntity.id])

      const playerLookingDirectionVector = new Rapier.Vector3(
        direction.x * 750,
        0,
        direction.z * 750
      )
      ballRigidbody.body!.applyImpulse(playerLookingDirectionVector, true)
    }
  },
  maxInteractDistance: 10,
  interactionCooldown: 2000,
  holdDuration: 0,
})
ball.entity.addNetworkComponent(proximityPromptComponent)

ScriptableSystem.update = (dt, entities) => {
  const playerAddedEvents = EventSystem.getEventsWrapped(ComponentAddedEvent, PlayerComponent)
  for (const event of playerAddedEvents) {
    sendTargetedNotification('⚽ Welcome to Football NotBlox!', 'Choose a team to get started', [
      event.entityId,
    ])
  }

  const hasPlayers = entities.some((entity) => entity.getComponent(PlayerComponent))

  if (!hasPlayers) {
    const ballBody = ball.entity.getComponent(DynamicRigidBodyComponent)!.body!
    ballBody.setTranslation(
      new Rapier.Vector3(ballSpawnPosition.x, ballSpawnPosition.y, ballSpawnPosition.z),
      true
    )
    ballBody.setRotation(new Rapier.Quaternion(0, 0, 0, 1), true)
    ballBody.setLinvel(new Rapier.Vector3(0, 0, 0), true)

    redScore = 0
    blueScore = 0
    updateScore()
  }
}
