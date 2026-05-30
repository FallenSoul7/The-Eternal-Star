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
import { NetworkSystem as NS } from './ecs/system/network/NetworkSystem.js'

// Maps slug → script filename
const SLUG_TO_SCRIPT: Record<string, string> = {
  football: 'footballScript.ts',
  obby: 'parkourScript.ts',
  'pet-simulator': 'petSimulatorScript.ts',
  test: 'defaultScript.ts',
}

/**
 * RoomContext holds the per-room singleton state.
 * Before each tick we swap the global singletons to point at this room's data,
 * run the tick, then swap back. This avoids touching shared/ code.
 */
export interface RoomContext {
  entityManager: EntityManager
  eventSystem: EventSystem
  physicsSystem: PhysicsSystem
}

// The global "active room" pointer used by singleton swap trick
let _activeRoom: Room | null = null
export function getActiveRoom(): Room | null { return _activeRoom }

export class Room {
  readonly slug: string
  players: Player[] = []

  // Per-room singleton instances (created fresh for this room)
  entityManager: EntityManager
  eventSystem: EventSystem
  physicsSystem: PhysicsSystem

  // Systems (stateless, safe to reuse per-room instance)
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

    // Create fresh instances for this room — NOT the global singletons
    this.entityManager = new (EntityManager as any)() as EntityManager
    this.eventSystem = new (EventSystem as any)() as EventSystem
    this.physicsSystem = new (PhysicsSystem as any)() as PhysicsSystem
  }

  /**
   * Swap global singletons to point at this room, run fn(), swap back.
   * This is the core trick that lets existing code work without changes.
   */
  withContext<T>(fn: () => T): T {
    const prevEM = (EntityManager as any).instance
    const prevES = (EventSystem as any).instance
    const prevPS = (PhysicsSystem as any).instance
    const prevActive = _activeRoom;

    (EntityManager as any).instance = this.entityManager;
    (EventSystem as any).instance = this.eventSystem;
    (PhysicsSystem as any).instance = this.physicsSystem;
    _activeRoom = this

    try {
      return fn()
    } finally {
      (EntityManager as any).instance = prevEM;
      (EventSystem as any).instance = prevES;
      (PhysicsSystem as any).instance = prevPS;
      _activeRoom = prevActive
    }
  }

  async initialize() {
    await this.withContext(async () => {
      // Boot the chat entity
      new Chat()

      // Load the map script
      const scriptFile = SLUG_TO_SCRIPT[this.slug] ?? 'defaultScript.ts'
      const scriptPath = resolve(import.meta.dirname, 'scripts', scriptFile)
      try {
        await import(pathToFileURL(scriptPath).href)
        console.log(`[Room:${this.slug}] Loaded script: ${scriptFile}`)
      } catch (err) {
        console.error(`[Room:${this.slug}] Failed to load script "${scriptFile}":`, err)
        // Fall back to default
        const fallback = resolve(import.meta.dirname, 'scripts', 'defaultScript.ts')
        await import(pathToFileURL(fallback).href)
      }
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
      const hasPlayers = entities.some(e => e.getComponent(PlayerComponent))

      if (!hasPlayers) {
        this.accumulator = 0
        this.scheduleLoop()
        return
      }

      const fixedTimestep = 1000 / config.SERVER_TICKRATE
      while (this.accumulator >= fixedTimestep) {
        await this.updateGameState(fixedTimestep)
        this.accumulator -= fixedTimestep
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

  addPlayer(ws: WebSocket, x = 0, y = 15, z = 0): Player {
    return this.withContext(() => {
      const player = new Player(ws, x, y, z)
      this.players.push(player)
      console.log(`[Room:${this.slug}] Player joined. Total: ${this.players.length}`)
      return player
    })
  }

  removePlayer(player: Player) {
    this.players = this.players.filter(p => p !== player)
    console.log(`[Room:${this.slug}] Player left. Total: ${this.players.length}`)
  }

  destroy() {
    this.isRunning = false
    if (this.loopHandle) clearTimeout(this.loopHandle)
    console.log(`[Room:${this.slug}] Destroyed`)
  }

  get playerCount() { return this.players.length }
}
