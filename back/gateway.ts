import http from 'http'
import httpProxy from 'http-proxy'

// 1. Create the proxy server with WebSocket support enabled
const proxy = httpProxy.createProxyServer({
  ws: true,
})

// 2. Map your game modes to their hidden internal ports
const mapPorts = {
  'football': 8001,
  'car-parkour': 8002,
  // You can easily add studio maps here in the future:
  // 'custom-map-1': 8003
}

// 3. Create the single "Front Door" server on Port 8000
const server = http.createServer()

// 4. Listen for incoming WebSocket connections from your React frontend
server.on('upgrade', (req, socket, head) => {
  // Extract the map name from the connection URL (e.g., ws://localhost:8000/football)
  const mapName = req.url ? req.url.split('/')[1] : ''
  
  const targetPort = mapPorts[mapName as keyof typeof mapPorts]

  if (targetPort) {
    console.log(`[Gateway] Routing player to ${mapName} on port ${targetPort}`)
    // Silently forward the player to the correct backend map
    proxy.ws(req, socket, head, { target: `ws://localhost:${targetPort}` })
  } else {
    console.log(`[Gateway] Map '${mapName}' not found. Dropping connection.`)
    socket.destroy()
  }
})

// 5. Open the front door
server.listen(8000, () => {
  console.log(' Gateway Server is running on Port 8000!')
})
