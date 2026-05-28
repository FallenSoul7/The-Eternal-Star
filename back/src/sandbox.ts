import 'dotenv/config'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import { startGameLoop } from './index.js'
import uWS from 'uWebSockets.js'

// Pre-load all game scripts into memory right when the server starts
async function preloadAllMaps() {
  const scripts = [
    'defaultScript.ts',
    'obbyscript.ts',
    'footballscript.ts',
    'petsimscript.ts'
  ]

  console.log('\n[BOOT] Pre-loading all map scripts to prevent empty skybox lag...')
  
  for (const script of scripts) {
    try {
      const codePath = resolve(import.meta.dirname, 'scripts', script)
      await import(pathToFileURL(codePath).href)
      console.log(`[BOOT] ✅ Successfully Loaded: ${script}`)
    } catch (err) {
      // Logs the error but keeps the server alive if a file is missing or renamed
      console.error(`[BOOT] ⚠️ Could not pre-load "${script}". Check your filename.`)
    }
  }
}

async function startServer() {
  // 1. Load your game worlds into memory first
  await preloadAllMaps()

  // 2. Start the uWebSockets app layers
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
      console.log('[Connection] Player joined a map instance.')
    },
    
    message: (ws, message, isBinary) => {
      // Game loop engine handles packet routing automatically
    },
    
    close: (ws, code, message) => {
      console.log('[Disconnect] Player left.')
    }
  })

  // Reads the environment port assigned by Render, or defaults to 8003
  const PORT = Number(process.env.PORT) || 8003
  
  app.listen(PORT, (token) => {
    if (token) {
      console.log(`\n🚀 NotBlox Master Server Online! Listening on port ${PORT}\n`)
      startGameLoop()
    } else {
      console.error(`\n❌ Fatal: Failed to listen on port ${PORT}`)
    }
  })
}

// Start the initialization sequence
startServer().catch((err) => console.error('[FATAL RUNTIME ERROR]', err))
