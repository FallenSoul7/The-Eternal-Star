import gameData from '../../../../public/gameData.json'
import { Metadata } from 'next'
import GameContent from '../../../../components/GameContent'
import { GameInfo } from '@/types'
import { supabase } from '../../../../supabaseClient' // Imported your Supabase client

// This tells Next.js to dynamically serve new pages when users upload maps
export const dynamicParams = true 

export async function generateStaticParams() {
  const games = gameData as GameInfo[]
  return games.map((game) => ({ slug: game.slug }))
}

// Turned this into an async function to support database lookups
async function getGamesBySlug(slug: string): Promise<GameInfo> {
  // 1. Check static JSON first
  const staticGame = (gameData as GameInfo[]).find((g) => g.slug === slug)
  if (staticGame) return staticGame

  // 2. Fallback: Check the Supabase 'maps' table
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('slug', slug)
    .single()

  // If it's not in the JSON and not in the DB, then we throw an error
  if (error || !data) {
    throw new Error(`Game with slug "${slug}" not found anywhere.`)
  }

  // 3. Format the database row to match the GameInfo type expected by GameContent
  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    imageUrl: data.icon_url || '',
    websocketPort: 8080, // Fallback default port
    metaDescription: `Custom map uploaded to The Eternal Star`,
    markdown: '',
    images: data.icon_url ? [{ url: data.icon_url, width: 1200, height: 630, alt: data.title, type: 'image/png' }] : []
  }
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const gameInfo = await getGamesBySlug(slug) // Added await here
  return {
    title: `Play ${gameInfo.title} - The Eternal Star`,
    description: gameInfo.metaDescription,
    openGraph: {
      title: `Play ${gameInfo.title} - The Eternal Star`,
      description: gameInfo.metaDescription,
      images: gameInfo.images ?? [],
      siteName: 'The Eternal Star',
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: `https://the-eternal-star.vercel.app/play/${gameInfo.slug}` },
  }
}

export default async function GamePage({ params }: { params: Params }) {
  const { slug } = await params
  const gameInfo = await getGamesBySlug(slug) // Added await here
  return <GameContent gameInfo={gameInfo} />
}
