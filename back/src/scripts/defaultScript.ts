import { Cube } from '../ecs/entity/Cube.js'
import { MapWorld } from '../ecs/entity/MapWorld.js'
import { ScriptableSystem } from '../ecs/system/ScriptableSystem.js'

// 1. Identify if this is a custom map room
const isCustomMap = !!process.env.CURRENT_MAP_URL;

// --- CLEANUP LOGIC ---
console.log(`[Map Engine] Initializing Room. Custom Map Status: ${isCustomMap}`);

// 2. Load the map mesh geometry
// If no custom URL is provided, it safely falls back to the default Village
const mapUrl = process.env.CURRENT_MAP_URL || 'https://qynwojpluhxhvwiqmstz.supabase.co/storage/v1/object/public/game-assets/Untitled%20folder/Village%20obbesy.glb'
new MapWorld(mapUrl)

// 3. Fallback platform for Custom Maps
if (isCustomMap) {
  // Spawns a massive, flat, solid platform high in the sky (y: 80)
  // Ensures players have a guaranteed flat surface to drop onto for physics testing
  new Cube({
    position: { x: 0, y: 80, z: 0 }, 
    size: { width: 100, height: 2, depth: 100 },
    physicsProperties: { mass: 0, gravityScale: 0 }, // Mass 0 = solid, immovable ground
    colliderProperties: { friction: 1.0, restitution: 0 } 
  })
}

// 4. (Sandbox entities like Cars, Zombies, and Trampolines have been safely removed 
//     to prevent ghost colliders and asset loading conflicts on user created maps.)

// 5. REQUIRED CRITICAL FIX: Empty update tick loop declared to let the server process loading states.
ScriptableSystem.update = (dt, entities) => {
  // Keeps room physics loop initialized cleanly without adding extra overhead.
}
