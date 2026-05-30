import { Room } from './Room.js'

/**
 * RoomManager keeps track of all active map rooms.
 * Rooms are created lazily when the first player connects to a slug.
 * Rooms are destroyed after all players leave (with a grace period).
 */
export class RoomManager {
  private static instance: RoomManager
  private rooms = new Map<string, Room>()
  private destroyTimers = new Map<string, ReturnType<typeof setTimeout>>()

  // Grace period before destroying an empty room (ms)
  // Keeps the room alive briefly in case players reconnect
  private readonly EMPTY_ROOM_TTL = 30_000

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager()
    }
    return RoomManager.instance
  }

  /**
   * Get an existing room or create + boot a new one for this slug.
   */
  async getOrCreate(slug: string): Promise<Room> {
    // Cancel any pending destroy for this slug
    const existingTimer = this.destroyTimers.get(slug)
    if (existingTimer) {
      clearTimeout(existingTimer)
      this.destroyTimers.delete(slug)
    }

    if (this.rooms.has(slug)) {
      return this.rooms.get(slug)!
    }

    console.log(`[RoomManager] Booting new room for slug: "${slug}"`)
    const room = new Room(slug)
    this.rooms.set(slug, room)

    await room.initialize()
    await room.startAndWaitForMap()

    return room
  }

  /**
   * Called when a player leaves a room.
   * Schedules room destruction if it becomes empty.
   */
  onPlayerLeft(slug: string) {
    const room = this.rooms.get(slug)
    if (!room) return

    if (room.playerCount === 0) {
      console.log(`[RoomManager] Room "${slug}" is empty. Will destroy in ${this.EMPTY_ROOM_TTL / 1000}s`)
      const timer = setTimeout(() => {
        const r = this.rooms.get(slug)
        if (r && r.playerCount === 0) {
          r.destroy()
          this.rooms.delete(slug)
          console.log(`[RoomManager] Room "${slug}" destroyed`)
        }
        this.destroyTimers.delete(slug)
      }, this.EMPTY_ROOM_TTL)

      this.destroyTimers.set(slug, timer)
    }
  }

  getRoom(slug: string): Room | undefined {
    return this.rooms.get(slug)
  }

  get activeRoomCount() { return this.rooms.size }

  get stats() {
    const result: Record<string, number> = {}
    for (const [slug, room] of this.rooms) {
      result[slug] = room.playerCount
    }
    return result
  }
}
