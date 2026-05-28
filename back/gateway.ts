import http from 'http'
import httpProxy from 'http-proxy'

// 1. Create the proxy server
const proxy = httpProxy.createProxyServer({
  ws: true,
})

// Prevent the whole gateway from crashing if a map server goes offline
proxy.on('error', (err, req, socket) => {
  console.error('[Gateway] Proxy routing error:', err.message)
  if (socket && typeof socket.destroy === 'function') {
    socket.destroy()
  }
})

// 2. Create the single "Front Door" server
const server = http.createServer()

// 3. Listen for incoming connections and route them dynamically
server.on('upgrade', (req, socket, head) => {
  // We will expect URLs to look like: wss://your-url.com/football/8001
  const parts = req.url ? req.url.split('/') : []
  const mapName = parts[1] || 'unknown-map'
  const targetPort = parts[2] // Dynamically grab the port from the URL!

  if (targetPort) {
    console.log(`[Gateway] Routing player to ${mapName} on port ${targetPort}`)
    // Forward the player to whatever port the frontend asked for
    proxy.ws(req, socket, head, { target: `ws://127.0.0.1:${targetPort}` })
  } else {
    console.log(`[Gateway] No port provided for '${mapName}'. Dropping connection.`)
    socket.destroy()
  }
})

// 4. Open the front door using Render's dynamic port (fixes the connection crash)
const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`🚀 Dynamic Gateway Server is running on Port ${PORT}!`)
})
