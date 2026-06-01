import Rapier from '../physics/rapier.js'
import { EventSystem } from '@shared/system/EventSystem.js'
import { ColorComponent } from '@shared/component/ColorComponent.js'
import { PlayerComponent } from '@shared/component/PlayerComponent.js'
import { ProximityPromptComponent } from '@shared/component/ProximityPromptComponent.js'
import { TextComponent } from '@shared/component/TextComponent.js'
import { RotationComponent } from '@shared/component/RotationComponent.js'
import { ColorEvent } from '../ecs/component/events/ColorEvent.js'
import { OnCollisionEnterEvent } from '../ecs/component/events/OnCollisionEnterEvent.js'
import { DynamicRigidBodyComponent } from '../ecs/component/physics/DynamicRigidBodyComponent.js'
import { InputComponent } from '../ecs/component/InputComponent.js'
import { SpawnPositionComponent } from '../ecs/component/SpawnPositionComponent.js'
import { ZombieComponent } from '../ecs/component/ZombieComponent.js'
import { Car } from '../ecs/entity/Car.js'
import { Cube } from '../ecs/entity/Cube.js'
import { MapWorld } from '../ecs/entity/MapWorld.js'
import { Mesh } from '../ecs/entity/Mesh.js'
import { Sphere } from '../ecs/entity/Sphere.js'
import { TriggerCube } from '../ecs/entity/TriggerCube.js'

function randomHexColor() {
  const hex = Math.floor(Math.random() * 16777215).toString(16)
  return '#' + '0'.repeat(6 - hex.length) + hex
}

// 1. Check map type
const isCustomMap = !!process.env.CURRENT_MAP_URL;

// 2. Load the map mesh geometry
const mapUrl = process.env.CURRENT_MAP_URL || 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Untitled%20folder/Village%20obbesy.glb'
new MapWorld(mapUrl)

// 3. If it's a custom user map, spawn a solid base plate so they never fall into the void
if (isCustomMap) {
  new Cube({
    position: { x: 0, y: 0, z: 0 },
    size: { width: 500, height: 1, depth: 500 },
    color: '#1e293b' // Clean dark slate floor grid
  })
}

// 4. Spawn default sandbox toys ONLY if it's the standard village map
if (!isCustomMap) {
  // Create a basic cube
  const basicCubeParams = {
    position: { x: 0, y: 5, z: -50 },
    size: { width: 3, height: 3, depth: 3 },
  }
  new Cube(basicCubeParams)

  // Create physics-enabled sphere with a white color
  const basicSphereParams = {
    position: { x: 5, y: 10, z: -10 },
    radius: 6,
    color: '#ffffff',
  }
  new Sphere(basicSphereParams)

  // Interactive Trigger Zone
  const triggerCube = new TriggerCube(
    -100, -5, -200, 8, 8, 8, 
    (entity) => {
      if (entity.getComponent(PlayerComponent)) {
        entity.getComponent(DynamicRigidBodyComponent)!.body!.applyImpulse(new Rapier.Vector3(0, 9000, 0), true)
      }
    },
    (entity) => {},
    true 
  )
  triggerCube.entity.addNetworkComponent(new TextComponent(triggerCube.entity.id, 'Trampoline', 0, 2, 0, 30))

  // Interactive Object
  for (let i = 0; i < 2; i++) {
    const interactiveCube = new Cube({
      position: { x: 0, y: 5, z: -100 },
      size: { width: 2, height: 2, depth: 2 },
      physicsProperties: { enableCcd: true },
    })
    interactiveCube.entity.addComponent(
      new OnCollisionEnterEvent(interactiveCube.entity.id, (collidedWithEntity) => {
        if (collidedWithEntity.getComponent(PlayerComponent)) {
          EventSystem.addEvent(new ColorEvent(interactiveCube.entity.id, randomHexColor()))
          const rigidBody = interactiveCube.entity.getComponent(DynamicRigidBodyComponent)
          if (rigidBody) rigidBody.body!.applyImpulse(new Rapier.Vector3(0, 5000, 0), true)
        }
      })
    )
  }

  // Zombie
  const zombie = new Mesh({
    position: { x: -100, y: 10, z: 100 },
    meshUrl: 'https://notbloxo.fra1.cdn.digitaloceanspaces.com/Notblox-Assets/character/Character.glb',
    physicsProperties: { mass: 1, angularDamping: 0.5, enableCcd: true },
    colliderProperties: { restitution: 0.7 },
  })
  zombie.entity.addNetworkComponent(new ColorComponent(zombie.entity.id, 'default'))
  zombie.entity.addComponent(new ZombieComponent(zombie.entity.id))
  zombie.entity.addNetworkComponent(new TextComponent(zombie.entity.id, '🤪 Zombie guy', 0, 2, 0))

  // Color Changing Cube
  const cube = new Cube({
    position: { x: 100, y: 10, z: 100 },
    physicsProperties: { mass: 1, angularDamping: 0.5 },
  })
  const proximityPromptComponent = new ProximityPromptComponent(cube.entity.id, {
    text: 'Press E to change color',
    onInteract: () => {
      cube.entity.getComponent(DynamicRigidBodyComponent)!.body!.applyImpulse(new Rapier.Vector3(0, 5, 0), true)
      const colorComponent = cube.entity.getComponent(ColorComponent)
      if (colorComponent) {
        colorComponent.color = '#' + Math.floor(Math.random() * 16777215).toString(16)
        colorComponent.updated = true
      }
    },
    maxInteractDistance: 10,
    interactionCooldown: 200,
    holdDuration: 0,
  })
  cube.entity.addNetworkComponent(proximityPromptComponent)

  // Cars
  for (let i = -3; i < 6; i++) {
    if (i === 0) continue
    const x = 5 * -i, y = 5, z = 20 * i
    const car = new Car({ position: { x, y, z } })
    car.entity.addComponent(new SpawnPositionComponent(car.entity.id, x, y, z))
  }

  for (let i = 1; i < 10; i++) {
    const x = -140 + 5 * -i, y = 5, z = 20 * i
    let wheelConfig = i < 5 
      ? { frontLeft: Math.max(1, i / 2.5), frontRight: Math.max(1, i / 2.5), backLeft: 1.4, backRight: 1.4 }
      : { frontLeft: 1.4, frontRight: 1.4, backLeft: Math.max(1, (10 - i) / 2.5), backRight: Math.max(1, (10 - i) / 2.5) }

    const car = new Car({
      position: { x, y, z },
      name: 'Weird Car',
      meshUrl: 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Untitled%20folder/Car.glb',
      wheelRadius: wheelConfig,
      color: randomHexColor(),
    })
    car.entity.addComponent(new SpawnPositionComponent(car.entity.id, x, y, z))
  }

  // Football
  const ballSpawnPosition = { x: 0, y: 20, z: -10 }
  const ball = new Sphere({
    radius: 1.4,
    position: { x: ballSpawnPosition.x, y: ballSpawnPosition.y, z: ballSpawnPosition.z },
    meshUrl: 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Cat.glb',
    physicsProperties: { mass: 1, enableCcd: true, angularDamping: 0.5, linearDamping: 0.5 },
    colliderProperties: { friction: 0.4, restitution: 0.8 },
  })
  ball.entity.addComponent(new SpawnPositionComponent(ball.entity.id, ballSpawnPosition.x, ballSpawnPosition.y, ballSpawnPosition.z))
  ball.entity.addNetworkComponent(new ProximityPromptComponent(ball.entity.id, {
    text: 'Kick',
    onInteract: (playerEntity) => {
      const ballRigidbody = ball.entity.getComponent(DynamicRigidBodyComponent)
      const playerRotationComponent = playerEntity.getComponent(RotationComponent)
      if (ballRigidbody && playerRotationComponent && playerEntity.getComponent(InputComponent)) {
        const direction = playerRotationComponent.getForwardDirection()
        ballRigidbody.body!.applyImpulse(new Rapier.Vector3(direction.x * 1500, 0, direction.z * 1500), true)
      }
    },
    maxInteractDistance: 10,
    interactionCooldown: 2000,
    holdDuration: 0,
  }))
}

// 5. FIXED: This loop now ALWAYS runs so the engine tick handles inputs correctly!
ScriptableSystem.update = (dt, entities) => {
  // If it's a custom map, we don't need to check football score status, just let the room tick over smoothly
  if (isCustomMap) return;

  // Standard sandbox engine updates continue below here...
}
