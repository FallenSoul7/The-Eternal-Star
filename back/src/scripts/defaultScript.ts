import { Cube } from '../ecs/entity/Cube.js'
import { MapWorld } from '../ecs/entity/MapWorld.js'
import { ScriptableSystem } from '../ecs/system/ScriptableSystem.js'

// 1. Identify if this is a custom map room
const isCustomMap = !!process.env.CURRENT_MAP_URL;

// --- CLEANUP LOGIC ---
console.log(`[Map Engine] Initializing Room. Custom Map Status: ${isCustomMap}`);

// 2. Load the map mesh geometry
// Only load a map if CURRENT_MAP_URL is set (user-uploaded map)
// Built-in maps (island, football, etc.) don't have a default mesh - they use their own scripts
if (isCustomMap) {
  const mapUrl = process.env.CURRENT_MAP_URL
  new MapWorld(mapUrl)
  console.log(`[Map Engine] Loaded user map: ${mapUrl}`)
  
  // 3. Fallback platform for Custom Maps
  // Spawns a massive, flat, solid platform so players can stand
  new Cube({
    position: { x: 0, y: 0, z: 0 }, 
    size: { width: 600, height: 2, depth: 600 },
    physicsProperties: { mass: 0, gravityScale: 0 }, // Mass 0 = solid, immovable ground
    colliderProperties: { friction: 1.0, restitution: 0 } 
  })
  console.log(`[Map Engine] Added fallback platform for custom map`)
}

// 4. (Sandbox entities like Cars, Zombies, and Trampolines have been safely removed 
//     to prevent ghost colliders and asset loading conflicts on user created maps.)

// 5. REQUIRED CRITICAL FIX: Empty update tick loop declared to let the server process loading states.
ScriptableSystem.update = (dt, entities) => {
  // Keeps room physics loop initialized cleanly without adding extra overhead.
}
