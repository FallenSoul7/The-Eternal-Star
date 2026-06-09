export interface GameInfo {
  id: string | number
  title: string
  slug: string
  imageUrl: string
  websocketPort?: number // Optional now!
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
