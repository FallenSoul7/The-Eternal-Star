export interface GameInfo {
  id: string // Added to support your gateway logic
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
  mapUrl?: string // FIXED: Added to safely carry custom user-uploaded map URLs
}
