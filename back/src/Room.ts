import 'dotenv/config'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { WebSocket } from 'uWebSockets.js'

import { EntityManager } from '@shared/system/EntityManager.js'
import { EventSystem } from '@shared/system/EventSystem.js'
import { config } from '@shared/network/config.js'
import { PlayerComponent } from '@shared/component/PlayerComponent.js'

import { PhysicsSystem } from './ecs/system/physics/PhysicsSystem.js'
import { AnimationSystem } from './ecs/system/AnimationSystem.js'
import { MovementSystem } from './ecs/system/MovementSystem.js'
import { RandomizeSystem } from './ecs/system/RandomizeSystem.js'
import { MessageEventSystem } from './ecs/system/events/MessageEventSystem.js'
import { ColorEventSystem } from './ecs/system/events/ColorEventSystem.js'
import { DestroyEventSystem } from './ecs/system/events/DestroyEventSystem.js'
import { SingleSizeEventSystem } from './ecs/system/events/SingleSizeEventSystem.js'
import { SizeEventSystem } from './ecs/system/events/SizeEventSystem.js'
import { NetworkSystem } from './ecs/system/network/NetworkSystem.js'
import { BoundaryCheckSystem } from './ecs/system/physics/BoundaryCheckSystem.js'
import { BoxColliderSystem } from './ecs/system/physics/BoxColliderSystem.js'
import { CapsuleColliderSystem } from './ecs/system/physics/CapsuleColliderSystem.js'
import { DynamicRigidBodySystem } from './ecs/system/physics/DynamicRigidBodySystem.js'
import { GroundedCheckSystem } from './ecs/system/physics/GroundedCheckSystem.js'
import { KinematicRigidBodySystem } from './ecs/system/physics/KinematicRigidBodySystem.js'
import { LockRotationSystem } from './ecs/system/physics/LockRotationSystem.js'
import { SleepCheckSystem } from './ecs/system/physics/SleepCheckSystem.js'
import { SphereColliderSystem } from './ecs/system/physics/SphereColliderSystem.js'
import { SyncPositionSystem } from './ecs/system/physics/SyncPositionSystem.js'
import { SyncRotationSystem } from './ecs/system/physics/SyncRotationSystem.js'
import { TrimeshColliderSystem } from './ecs/system/physics/TrimeshColliderSystem.js'
import { ConvexHullColliderSystem } from './ecs/system/physics/ConvexHullColliderSystem.js'
import { ZombieSystem } from './ecs/system/ZombieSystem.js'
import { FollowTargetSystem } from './ecs/system/FollowTargetSystem.js'
import { ProximityPromptSystem } from './ecs/system/events/ProximityPromptEventSystem.js'
import { VehicleSystem } from './ecs/system/VehicleSystem.js'
import { ScriptableSystem } from './ecs/system/ScriptableSystem.js'
import { Chat } from './ecs/entity/Chat.js'
import { Player } from './ecs/entity/Player.js'
import { TrimeshCollidersComponent } from './ecs/component/physics/TrimeshColliderComponent.js'

// Maps slug → script filename
const SLUG_TO_SCRIPT: Record<string, string> = {
  football: 'footballScript.ts',
  obby: 'parkourScript.ts',
  'pet-simulator': 'petSimulatorScript.ts',
  test: 'defaultScript.ts',
}

let _activeRoom: Room | null = null
export function getActiveRoom(): Room | null { return _activeRoom }

export class Room {
  readonly slug: string
  players: Player[] = []

  entityManager: EntityManager
  eventSystem: EventSystem
  physicsSystem: PhysicsSystem

  // Flag: true once the map trimesh collider is fully built
  private mapReady = false

  private kinematicPhysicsBodySystem = new KinematicRigidBodySystem()
  private rigidPhysicsBodySystem = new DynamicRigidBodySystem()
  private trimeshColliderSystem = new TrimeshColliderSystem()
  private boxColliderSystem = new BoxColliderSystem()
  private capsuleColliderSystem = new CapsuleColliderSystem()
  private sphereColliderSystem = new SphereColliderSystem()
  private convexHullColliderSystem = new ConvexHullColliderSystem()
  private groundedCheckSystem = new GroundedCheckSystem()
  private lockedRotationSystem = new LockRotationSystem()
  private colorEventSystem = new ColorEventSystem()
  private singleSizeEventSystem = new SingleSizeEventSystem()
  private sizeEventSystem = new SizeEventSystem()
  private syncPositionSystem = new SyncPositionSystem()
  private syncRotationSystem = new SyncRotationSystem()
  private messageEventSystem = new MessageEventSystem()
  private destroyEventSystem = new DestroyEventSystem()
  private proximityPromptSystem = new ProximityPromptSystem()
  private movementSystem = new MovementSystem()
  private vehicleSystem = new VehicleSystem()
  private networkSystem = new NetworkSystem()
  private animationSystem = new AnimationSystem()
  private sleepCheckSystem = new SleepCheckSystem()
  private randomizeSystem = new RandomizeSystem()
  private boundaryCheckSystem = new BoundaryCheckSystem()
  private zombieSystem = new ZombieSystem()
  private followTargetSystem = new FollowTargetSystem()

  private lastFrameTime = Date.now()
  private accumulator = 0
  private loopHandle: ReturnType<typeof setTimeout> | null = null
  private isRunning = false

  constructor(slug: string) {
    this.slug = slug
    this.entityManager = new (EntityManager as any)() as EntityManager
    this.eventSystem = new (EventSystem as any)() as EventSystem
    this.physicsSystem = new (PhysicsSystem as any)() as PhysicsSystem
  }

  withContext<T>(fn: () => T): T {
    const prevEM = (EntityManager as any).instance
    const prevES = (EventSystem as any).instance
    const prevPS = (PhysicsSystem as any).instance
    const prevActive = _activeRoom

    ;(EntityManager as any).instance = this.entityManager
    ;(EventSystem as any).instance = this.eventSystem
    ;(PhysicsSystem as any).instance = this.physicsSystem
    _activeRoom = this

    try {
      return fn()
    } finally {
      ;(EntityManager as any).instance = prevEM
      ;(EventSystem as any).instance = prevES
      ;(PhysicsSystem as any).instance = prevPS
      _activeRoom = prevActive
    }
  }

  async initialize() {
    await this.withContext(async () => {
      new Chat()

      const scriptFile = SLUG_TO_SCRIPT[this.slug] ?? 'defaultScript.ts'
      const scriptPath = resolve(import.meta.dirname, 'scripts', scriptFile)
      try {
        await import(pathToFileURL(scriptPath).href)
        console.log(`[Room:${this.slug}] Loaded script: ${scriptFile}`)
      } catch (err) {
        console.error(`[Room:${this.slug}] Failed to load script "${scriptFile}":`, err)
        const fallback = resolve(import.meta.dirname, 'scripts', 'defaultScript.ts')
        await import(pathToFileURL(fallback).href)
      }
    })
  }

  /**
   * Starts the game loop and waits until the map trimesh collider
   * is fully built before resolving. Players should not be added
   * until this resolves — otherwise they fall through the floor.
   */
  async startAndWaitForMap(): Promise<void> {
    this.start()

    const MAX_WAIT_MS = 20_000
    const CHECK_INTERVAL_MS = 300
    const started = Date.now()

    console.log(`[Room:${this.slug}] Waiting for map collider to load...`)

    await new Promise<void>((resolve) => {
      const check = () => {
        // Check if any entity has a fully-built TrimeshCollidersComponent
        const ready = this.withContext(() => {
          const entities = this.entityManager.getAllEntities()
          return entities.some((e) => {
            const t = e.getComponent(TrimeshCollidersComponent)
            return t && t.colliders && t.colliders.length > 0
          })
        })

        if (ready) {
          this.mapReady = true
          console.log(`[Room:${this.slug}] Map collider ready ✅`)
          resolve()
        } else if (Date.now() - started > MAX_WAIT_MS) {
          // Timeout — let players in anyway, better than hanging forever
          console.warn(`[Room:${this.slug}] Map collider timeout after ${MAX_WAIT_MS}ms, proceeding anyway`)
          resolve()
        } else {
          setTimeout(check, CHECK_INTERVAL_MS)
        }
      }
      // Give the first game loop tick(s) time to run the TrimeshColliderSystem
      setTimeout(check, 500)
    })
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.lastFrameTime = Date.now()
    this.scheduleLoop()
    console.log(`[Room:${this.slug}] Game loop started`)
  }

  private scheduleLoop() {
    this.loopHandle = setTimeout(() => this.tick(), config.SERVER_TICKRATE / 2)
  }

  private async tick() {
    if (!this.isRunning) return

    await this.withContext(async () => {
      const now = Date.now()
      const deltaTime = now - this.lastFrameTime
      this.lastFrameTime = now
      this.accumulator += deltaTime

      const entities = this.entityManager.getAllEntities()
      const hasPlayers = entities.some((e) => e.getComponent(PlayerComponent))

      // Keep ticking even without players so the map collider gets built
      const fixedTimestep = 1000 / config.SERVER_TICKRATE
      while (this.accumulator >= fixedTimestep) {
        await this.updateGameState(fixedTimestep)
        this.accumulator -= fixedTimestep
      }

      // Slow down to 1 tick/sec when empty to save CPU
      if (!hasPlayers && this.mapReady) {
        this.accumulator = 0
      }
    })

    this.scheduleLoop()
  }

  private async updateGameState(dt: number) {
    const entities = this.entityManager.getAllEntities()

    this.destroyEventSystem.update(entities)
    this.physicsSystem.update(entities)
    this.boundaryCheckSystem.update(entities)
    ScriptableSystem.update(dt, entities)
    this.proximityPromptSystem.update(entities, dt)

    this.kinematicPhysicsBodySystem.update(entities, this.physicsSystem.world)
    this.rigidPhysicsBodySystem.update(entities, this.physicsSystem.world)

    await this.trimeshColliderSystem.update(entities, this.physicsSystem.world)
    await this.convexHullColliderSystem.update(entities, this.physicsSystem.world)
    this.boxColliderSystem.update(entities, this.physicsSystem.world)
    this.capsuleColliderSystem.update(entities, this.physicsSystem.world)
    this.sphereColliderSystem.update(entities, this.physicsSystem.world)

    this.zombieSystem.update(dt, entities)
    this.followTargetSystem.update(dt, entities)
    this.randomizeSystem.update(entities)
    this.sizeEventSystem.update(entities)
    this.singleSizeEventSystem.update(entities)
    this.colorEventSystem.update(entities)

    this.groundedCheckSystem.update(entities, this.physicsSystem.world)
    this.movementSystem.update(dt, entities)
    this.vehicleSystem.update(entities, this.physicsSystem.world, dt)

    this.animationSystem.update(entities)
    this.syncRotationSystem.update(entities)
    this.syncPositionSystem.update(entities)

    this.messageEventSystem.update(entities)
    this.lockedRotationSystem.update(entities)
    this.networkSystem.update(entities)
    this.sleepCheckSystem.update(entities)

    this.destroyEventSystem.afterUpdate(entities)
    this.eventSystem.afterUpdate(entities)
  }

  addPlayer(ws: WebSocket, x = 0, y = 50, z = 0): Player {
    return this.withContext(() => {
      const player = new Player(ws, x, y, z)
      this.players.push(player)
      console.log(`[Room:${this.slug}] Player joined. Total: ${this.players.length}`)
      return player
    })
  }

  removePlayer(player: Player) {
    this.players = this.players.filter((p) => p !== player)
    console.log(`[Room:${this.slug}] Player left. Total: ${this.players.length}`)
  }

  destroy() {
    this.isRunning = false
    if (this.loopHandle) clearTimeout(this.loopHandle)
    console.log(`[Room:${this.slug}] Destroyed`)
  }

  get playerCount() { return this.players.length }
}
