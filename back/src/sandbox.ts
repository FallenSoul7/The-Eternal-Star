import 'dotenv/config'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { startGameLoop } from './index.js'
import uWS from 'uWebSockets.js'

// Cache to track which map scripts are already loaded into engine memory
const loadedScripts = new Set<string>()

/**
 * Dynamically resolves and imports map rule files on the fly
 */
async function handleDynamicMapLoad(gameId: string, slug: string) {
  // Maps the unique ID sent from GamePlayer.tsx to your actual script files
  const mapScriptMapping: Record<string, string> = {
    "game-football-001": "footballscript.ts",
    "game-obby-002": "obbyscript.ts",
    "game-pet-sim-003": "petsimscript.ts",
    "game-test-004": "defaultScript.ts"
  }

  // Fallback to defaultScript.ts if the incoming ID doesn't match anything
  const scriptName = mapScriptMapping[gameId] || "defaultScript.ts"

  if (!loadedScripts.has(scriptName)) {
    const codePath = resolve(import.meta.dirname, 'scripts', scriptName)
    console.log(`[Dynamic Loader] Spinning up map logic for: ${slug} (${gameId}) from ${codePath}`)
    
    try {
      await import(pathToFileURL(codePath).href)
      loadedScripts.add(scriptName)
    } catch (err) {
      console.error(`[Dynamic Loader Error] Failed to execute game script: ${scriptName}`, err)
    }
  }
}

// Instantiate the uWebSockets Master server application layers
const app = uWS.App()

// Wildcard route listener matching the format built by GamePlayer.tsx
app.ws('/*', {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 60,
  
  upgrade: (res, req, context) => {
    // Extract parameters from the connection URL path
    // Format: /game-football-001/football/8003
    const url = req.getUrl() 
    const pathParts = url.split('/').filter(Boolean)
    
    const gameId = pathParts[0] // "game-football-001"
    const slug = pathParts[1]   // "football"

    console.log(`[Handshake] Incoming routing request for Game ID: ${gameId}, Slug: ${slug}`)

    // Inject and run the script logic if it is missing from memory
    if (gameId && slug) {
      handleDynamicMapLoad(gameId, slug).catch((err) => 
        console.error('[Loader Error] Handshake building interrupted:', err)
      )
    }

    // Finalize the network handshake upgrade safely
    res.upgrade(
      { 
        url: url,
        gameId: gameId,
        slug: slug
      },
      req.getHeader('sec-websocket-key'),
      req.getHeader('sec-websocket-protocol'),
      req.getHeader('sec-websocket-extensions'),
      context
    )
  },
  
  open: (ws) => {
    console.log('[Connection] Player successfully established pipeline link with master room.')
  },
  
  message: (ws, message, isBinary) => {
    // Your internal NetworkSystem / binary parser hooks handle gameplay streams automatically here
  },
  
  close: (ws, code, message) => {
    console.log('[Disconnect] Player link severed from match session instance.')
  }
})

// Listen on the assigned environment port (or default back to 8003)
const PORT = Number(process.env.PORT) || 8003

app.listen(PORT, (token) => {
  if (token) {
    console.log(`\n🚀 NotBlox Engine Online! Master multi-map server listening on port ${PORT}`)
    // Fire up your physics/game core engine update loop
    startGameLoop()
  } else {
    console.error(`\n❌ Fatal Crash: Failed to start server allocation on port ${PORT}`)
  }
})
