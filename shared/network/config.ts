const isServer =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null

export const config = {
  SERVER_TICKRATE: isServer ? Number(process.env.GAME_TICKRATE) || 20 : 20,
  IS_SERVER: isServer,
  MAX_MESSAGE_CONTENT_LENGTH: 300,
  
  // Directly grabs the specific variable the original repo used
  WS_URL: !isServer
    ? (process.env.NEXT_PUBLIC_SERVER_URL || `ws://${window.location.hostname}:8001`)
    : '',
}
