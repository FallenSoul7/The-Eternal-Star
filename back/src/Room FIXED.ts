  async initialize() {
    await this.exclusive(async () => {
      // Kept your original static import of Chat for cleanliness
      new Chat()

      let scriptFile = SLUG_TO_SCRIPT[this.slug]
      let isCustomMap = false

      // If no static script, check Supabase for a user-uploaded map
      if (!scriptFile) {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY! // use service key on server
          )
          const { data: map } = await sb.from('maps').select('map_url').eq('slug', this.slug).single()
          
          if (map?.map_url) {
            console.log(`[Room:${this.slug}] Using user map GLB: ${map.map_url}`)
            // Set environment variable so the script knows this is a custom map
            process.env.CURRENT_MAP_URL = map.map_url
            isCustomMap = true
            console.log(`[Room:${this.slug}] Custom map detected`)
            // DO NOT RETURN - continue to load the default script
            // which will check CURRENT_MAP_URL and skip sandbox entities
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
