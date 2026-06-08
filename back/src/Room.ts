   import { resolve } from 'path'
import { pathToFileURL } from 'url'
// 1. Add any other imports your project needs here (like Chat, etc.)
// import { Chat } from './Chat' 

// 2. This map tells the server which script matches which room slug
const SLUG_TO_SCRIPT: Record<string, string> = {
  'main': 'mainScript.ts',
  'sandbox': 'defaultScript.ts',
  // Add your other static map mappings here
}

// 3. The class wrapper wraps around your initialize function
export class Room {
  // Setup properties your room uses
  slug: string
  exclusive: (cb: () => Promise<void>) => Promise<void>

  constructor(slug: string, exclusiveFn: any) {
    this.slug = slug
    this.exclusive = exclusiveFn
  }

  // 4. YOUR FIXED INITIALIZE METHOD GOES HERE (with lowercase async)
  async initialize() {
    await this.exclusive(async () => {
      // Setup chat system cleanly
      // new Chat()

      let scriptFile = SLUG_TO_SCRIPT[this.slug]
      let isCustomMap = false

      // If no static script, check Supabase for a user-uploaded map
      if (!scriptFile) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY! 
          )
          const { data: map } = await sb.from('maps').select('map_url').eq('slug', this.slug).single()
          
          if (map?.map_url) {
            console.log(`[Room:${this.slug}] Using user map GLB: ${map.map_url}`)
            process.env.CURRENT_MAP_URL = map.map_url
            isCustomMap = true
            console.log(`[Room:${this.slug}] Custom map detected`)
          }
        } catch (err) {
          console.error(`[Room:${this.slug}] Supabase map lookup failed:`, err)
        }
      }

      // Fall back to defaultScript if no map was found in DB or local files
      if (!scriptFile) scriptFile = 'defaultScript.ts'

      const scriptPath = resolve(import.meta.dirname, 'scripts', scriptFile)
      try {
        await import(pathToFileURL(scriptPath).href)
        console.log(`[Room:${this.slug}] Script loaded: ${scriptFile}`)
      } catch (err) {
        console.error(`[Room:${this.slug}] Script failed, using default:`, err)
        const fallback = resolve(import.meta.dirname, 'scripts', 'defaultScript.ts')
        await import(pathToFileURL(fallback).href)
      }
    })
  }
}
