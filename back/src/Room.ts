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

const SLUG_TO_SCRIPT: Record<string, string> = {
  football: 'footballScript.ts',
  obby: 'parkourScript.ts',
  'pet-simulator': 'petSimulatorScript.ts',
  test: 'defaultScript.ts',
  'village-obby': 'villageObbyScript.ts',
}

// Global async lock — only one room's tick runs at a time
// This prevents singleton collisions during async GLB loads
let tickLock: Promise<void> = Promise.resolve()

export class Room {
  readonly slug: string
  players: Player[] = []

  // Per-room ECS instances — properly constructed
  em: EntityManager
  es: EventSystem
  ps: PhysicsSystem

  private systems = {
    kinematic: new KinematicRigidBodySystem(),
    rigid: new DynamicRigidBodySystem(),
    trimesh: new TrimeshColliderSystem(),
    box: new BoxColliderSystem(),
    capsule: new CapsuleColliderSystem(),
    sphere: new SphereColliderSystem(),
    convex: new ConvexHullColliderSystem(),
    grounded: new GroundedCheckSystem(),
    lockRot: new LockRotationSystem(),
    color: new ColorEventSystem(),
    singleSize: new SingleSizeEventSystem(),
    size: new SizeEventSystem(),
    syncPos: new SyncPositionSystem(),
    syncRot: new SyncRotationSystem(),
    message: new MessageEventSystem(),
    destroy: new DestroyEventSystem(),
    proximity: new ProximityPromptSystem(),
    movement: new MovementSystem(),
    vehicle: new VehicleSystem(),
    network: new NetworkSystem(),
    animation: new AnimationSystem(),
    sleep: new SleepCheckSystem(),
    randomize: new RandomizeSystem(),
    boundary: new BoundaryCheckSystem(),
    zombie: new ZombieSystem(),
    follow: new FollowTargetSystem(),
  }

  private loopHandle: ReturnType<typeof setTimeout> | null = null
  private isRunning = false
  private lastFrameTime = Date.now()
  private accumulator = 0

  constructor(slug: string) {
    this.slug = slug
    // Properly construct each system — no Object.create bypass
    // We temporarily set the singleton to null so getInstance() creates a fresh one
    ;(EntityManager as any).instance = null
    this.em = EntityManager.getInstance()

    ;(EventSystem as any).instance = null
    this.es = EventSystem.getInstance()

    ;(PhysicsSystem as any).instance = null
    this.ps = PhysicsSystem.getInstance() // runs real constructor: new Rapier.World(gravity)
  }

  /**
   * Point the global singletons at this room's instances.
   * Safe because Node.js is single-threaded and we hold tickLock
   * through all async operations.
   */
  activate() {
    ;(EntityManager as any).instance = this.em
    ;(EventSystem as any).instance = this.es
    ;(PhysicsSystem as any).instance = this.ps
  }

  /**
   * Run fn() while holding the global tick lock.
   * Guarantees no other room's async code runs concurrently.
   */
  async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void
    tickLock = tickLock.then(() => new Promise<void>(r => { release = r }))
    this.activate()
    try {
      return await fn()
    } finally {
      release()
    }
  }

  async initialize() {
    await this.exclusive(async () => {
      new Chat()

      const scriptFile = SLUG_TO_SCRIPT[this.slug] ?? 'defaultScript.ts'
      const scriptPath = resolve(import.meta.dirname, 'scripts', scriptFile)
      try {
        await import(pathToFileURL(scriptPath).href)
        console.log(`[Room:${this.slug}] Script loaded: ${scriptFile}`)
      } catch (err) {
        console.error(`[Room:${this.slug}] Script failed, using default:`, err)
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
    console.log(`[Room:${this.slug}] Started`)
  }

  private scheduleLoop() {
    this.loopHandle = setTimeout(() => this.tick(), 1000 / config.SERVER_TICKRATE)
  }

  private async tick() {
    if (!this.isRunning) return
    await this.exclusive(async () => {
      const now = Date.now()
      const dt = now - this.lastFrameTime
      this.lastFrameTime = now
      this.accumulator += dt

      const fixedStep = 1000 / config.SERVER_TICKRATE
      while (this.accumulator >= fixedStep) {
        await this.step(fixedStep)
        this.accumulator -= fixedStep
      }
    })
    this.scheduleLoop()
  }

  private async step(dt: number) {
    const entities = this.em.getAllEntities()
    const world = this.ps.world

    this.systems.destroy.update(entities)
    this.ps.update(entities)
    this.systems.boundary.update(entities)
    ScriptableSystem.update(dt, entities)
    this.systems.proximity.update(entities, dt)

    this.systems.kinematic.update(entities, world)
    this.systems.rigid.update(entities, world)

    await this.systems.trimesh.update(entities, world)
    await this.systems.convex.update(entities, world)

    this.systems.box.update(entities, world)
    this.systems.capsule.update(entities, world)
    this.systems.sphere.update(entities, world)

    this.systems.zombie.update(dt, entities)
    this.systems.follow.update(dt, entities)
    this.systems.randomize.update(entities)
    this.systems.size.update(entities)
    this.systems.singleSize.update(entities)
    this.systems.color.update(entities)

    this.systems.grounded.update(entities, world)
    this.systems.movement.update(dt, entities)
    this.systems.vehicle.update(entities, world, dt)

    this.systems.animation.update(entities)
    this.systems.syncRot.update(entities)
    this.systems.syncPos.update(entities)

    this.systems.message.update(entities)
    this.systems.lockRot.update(entities)
    this.systems.network.update(entities)
    this.systems.sleep.update(entities)

    this.systems.destroy.afterUpdate(entities)
    this.es.afterUpdate(entities)
  }

  addPlayer(ws: WebSocket, x = 0, y = 200, z = 0): Player {
    this.activate()
    const player = new Player(ws, x, y, z)
    this.players.push(player)
    console.log(`[Room:${this.slug}] +Player. Total: ${this.players.length}`)
    return player
  }

  removePlayer(player: Player) {
    this.players = this.players.filter(p => p !== player)
    console.log(`[Room:${this.slug}] -Player. Total: ${this.players.length}`)
  }

  destroy() {
    this.isRunning = false
    if (this.loopHandle) clearTimeout(this.loopHandle)
    console.log(`[Room:${this.slug}] Destroyed`)
  }

  get playerCount() { return this.players.length }
}
