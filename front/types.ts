export interface GameInfo {
  id: string | number // FIXED: Accepts both string and number IDs
  title: string
  slug: string
  imageUrl: string
  websocketPort: number
  images?: { 
    url: string; 
    width: number; 
    height: number; 
    alt: string; 
    type: string 
  }[]
  metaDescription: string
  markdown: string
  mapUrl?: string
}
