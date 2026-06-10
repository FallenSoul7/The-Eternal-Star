import 'dotenv/config'
import { dirname, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { WebSocket } from 'uWebSockets.js'

import { EntityManager } from '@shared/system/EntityManager.js'
import { EventSystem } from '@shared/system/EventSystem.js'
import { config } from '@shared/network/config.js'
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

// Only kept the active game script
const SLUG_TO_SCRIPT: Record<string, string> = {
  'pet-simulator': 'petSimulatorScript.ts',
}

let tickLock: Promise<void> = Promise.resolve()

export class Room {
  readonly slug: string
  players: Player[] = []
  em: EntityManager
  es: EventSystem
  ps: PhysicsSystem

  private systems = { }

  constructor(slug: string) {
    this.slug = slug
    ;(EntityManager as any).instance = null
    this.em = EntityManager.getInstance()
    ;(EventSystem as any).instance = null
    this.es = EventSystem.getInstance()
    ;(PhysicsSystem as any).instance = null
    this.ps = PhysicsSystem.getInstance()
  }

  activate() {
    ;(EntityManager as any).instance = this.em
    ;(EventSystem as any).instance = this.es
    ;(PhysicsSystem as any).instance = this.ps
  }

  async exclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void
    tickLock = tickLock.then(() => new Promise<void>(r => { release = r }))
    this.activate()
    try { return await fn() } finally { release() }
  }

  async initialize() {
    await this.exclusive(async () => {
      // 1. Reset map state
      process.env.CURRENT_MAP_URL = "" 
      new Chat()

      // 2. Proactive Supabase Lookup
      try {
        console.log(`[Room:${this.slug}] DEBUG: Querying Supabase for slug: "${this.slug}"`)
        const { createClient } = await import('@supabase/supabase-js')
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
        
        const { data: map, error } = await sb.from('maps').select('map_url').eq('slug', this.slug).single()
        
        if (error) console.error(`[Room:${this.slug}] Supabase Query Error:`, error.message)
        
        if (map?.map_url) {
          console.log(`[Room:${this.slug}] SUCCESS: Map URL retrieved: ${map.map_url}`)
          process.env.CURRENT_MAP_URL = map.map_url
        } else {
          console.log(`[Room:${this.slug}] WARNING: No entry found for this slug. Using default system behavior.`)
        }
      } catch (err) {
        console.error(`[Room:${this.slug}] CRITICAL: Supabase connection failed`, err)
      }

      // 3. Script Selection
      const scriptFile = SLUG_TO_SCRIPT[this.slug] || 'defaultScript.ts'
      
      // THE FIX: Universal directory resolution that won't crash Render
      const __filename = fileURLToPath(import.meta.url)
      const __dirname = dirname(__filename)
      const scriptPath = resolve(__dirname, 'scripts', scriptFile)
      
      const cacheBuster = `?t=${Date.now()}`

      try {
        await import(pathToFileURL(scriptPath).href + cacheBuster)
        console.log(`[Room:${this.slug}] Script initialized: ${scriptFile}`)
      } catch (err) {
        console.error(`[Room:${this.slug}] Load error:`, err)
      }
    })
  }

  destroy() {
    // ... existing destroy logic
    console.log(`[Room:${this.slug}] Destroyed & Physics Cleared`)
  }
}
