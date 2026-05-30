import { Room } from './Room.js'

export class RoomManager {
  private static instance: RoomManager
  private rooms = new Map<string, Room>()
  private destroyTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly EMPTY_ROOM_TTL = 30_000

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager()
    }
    return RoomManager.instance
  }

  async getOrCreate(slug: string): Promise<Room> {
    const existingTimer = this.destroyTimers.get(slug)
    if (existingTimer) {
      clearTimeout(existingTimer)
      this.destroyTimers.delete(slug)
    }

    if (this.rooms.has(slug)) {
      return this.rooms.get(slug)!
    }

    console.log(`[RoomManager] Booting room: "${slug}"`)
    const room = new Room(slug)
    this.rooms.set(slug, room)

    await room.initialize()
    room.start()
    // No waitForMap needed — the async lock in Room guarantees
    // the script (and map entity creation) finishes before any tick runs

    return room
  }

  onPlayerLeft(slug: string) {
    const room = this.rooms.get(slug)
    if (!room) return

    if (room.playerCount === 0) {
      console.log(`[RoomManager] Room "${slug}" empty. Destroying in ${this.EMPTY_ROOM_TTL / 1000}s`)
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
    for (const [slug, room] of this.rooms) result[slug] = room.playerCount
    return result
  }
}
