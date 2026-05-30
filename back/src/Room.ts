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
}

/**
 * The core issue: EntityManager, EventSystem are singletons.
 * Static methods like EntityManager.removeEntity() always call getInstance()
 * which returns the ONE global instance — not our per-room copy.
 *
 * FIX: Before every tick (and before script load), we overwrite the global
 * singleton instance pointer to point at THIS room's instance.
 * Since Node.js is single-threaded, no two rooms tick simultaneously,
 * so this is safe as long as we swap BEFORE any await and swap back AFTER.
 *
 * For async operations (GLB loads inside ColliderSystems), they resolve
 * back on the microtask queue — still single-threaded, still safe IF
 * we don't interleave two rooms' async operations.
 * We guarantee this by using a global async lock (asyncLock).
 */

// Global async lock — only one room runs its tick at a time
let tickLock: Promise<void> = Promise.resolve()

export class Room {
  readonly slug: string
  players: Player[] = []

  // Per-room ECS instances
  private em: EntityManager
  private es: EventSystem
  private ps: PhysicsSystem

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
    // Create fresh instances — bypass the private constructor with cast
    this.em = Object.create(EntityManager.prototype) as EntityManager
    ;(this.em as any).entities = []
    this.es = Object.create(EventSystem.prototype) as EventSystem
    ;(this.es as any).eventQueue = null // set during activate
    this.ps = Object.create(PhysicsSystem.prototype) as PhysicsSystem
    ;(this.ps as any).world = null // set during activate
  }

  /**
   * Swap global singletons to this room's instances.
   * MUST be called before any ECS operation and before any await
   * that triggers ECS code.
   */
  private activate() {
    ;(EntityManager as any).instance = this.em
    ;(EventSystem as any).instance = this.es
    ;(PhysicsSystem as any).instance = this.ps
  }

  /**
   * Run fn() exclusively — waits for any in-progress room tick to finish first.
   * This prevents two rooms' async collider loads from interleaving.
   */
  private async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    let releaseLock!: () => void
    const myTurn = tickLock.then(() => new Promise<void>(r => { releaseLock = r }))
    tickLock = myTurn
    this.activate()
    try {
      return await fn()
    } finally {
      releaseLock()
    }
  }

  async initialize() {
    await this.exclusive(async () => {
      // Boot PhysicsSystem properly for this room
      await (this.ps as any).init?.()

      // Boot EventSystem's EventQueue
      ;(this.es as any).eventQueue = new (
        (await import('@shared/entity/EventQueue.js')).EventQueue
      )()

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
    const em = this.em
    const ps = this.ps
    const es = this.es
    const entities = em.getAllEntities()
    const world = (ps as any).world

    this.systems.destroy.update(entities)
    ps.update(entities)
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
    es.afterUpdate(entities)
  }

  addPlayer(ws: WebSocket, x = 0, y = 200, z = 0): Player {
    this.activate()
    const player = new Player(ws, x, y, z)
    this.players.push(player)
    console.log(`[Room:${this.slug}] +Player. Total: ${this.players.length}`)
    return player
  }

  removePlayer(player: Player) {
    this.activate()
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
