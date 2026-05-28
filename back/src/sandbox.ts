import 'dotenv/config'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { startGameLoop } from './index.js'
import uWS from 'uWebSockets.js'

const PORT = Number(process.env.PORT) || 8003

// Match each port directly to its game script
const portScriptMapping: Record<number, string> = {
  8001: "defaultScript.ts",   // Test Server
  8002: "obbyscript.ts",      // Obby
  8003: "footballscript.ts",  // Football
  8004: "petsimscript.ts"     // Pet Sim
}

async function bootstrapServer() {
  const scriptName = portScriptMapping[PORT] || "defaultScript.ts"
  const codePath = resolve(import.meta.dirname, 'scripts', scriptName)
  
  console.log(`[BOOT] Server assigned to port ${PORT}`)
  console.log(`[BOOT] Synchronously loading map logic: ${scriptName}`)
  
  try {
    // Load the map assets and player rules BEFORE opening the network layers
    await import(pathToFileURL(codePath).href)
    console.log(`[BOOT] Map assets loaded successfully into engine memory.`)
  } catch (err) {
    console.error(`[FATAL BOOT ERROR] Failed to load game script: ${scriptName}`, err)
    process.exit(1)
  }

  // Initialize your uWebSockets application
  const app = uWS.App()

  app.ws('/*', {
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 60,
    
    upgrade: (res, req, context) => {
      res.upgrade(
        { url: req.getUrl() },
        req.getHeader('sec-websocket-key'),
        req.getHeader('sec-websocket-protocol'),
        req.getHeader('sec-websocket-extensions'),
        context
      )
    },
    
    open: (ws) => {
      console.log('[Connection] Player joined the match instance securely.')
    },
    
    message: (ws, message, isBinary) => {
      // Game stream processing handles connection actions automatically
    },
    
    close: (ws, code, message) => {
      console.log('[Disconnect] Player disconnected.')
    }
  })

  app.listen(PORT, (token) => {
    if (token) {
      console.log(`🚀 NotBlox Server successfully listening on port ${PORT}\n`)
      startGameLoop()
    } else {
      console.error(`❌ Fatal: Failed to open port allocation ${PORT}`)
    }
  })
}

// Fire up the startup pipeline
bootstrapServer().catch((err) => console.error("[FATAL RUNTIME]", err))
