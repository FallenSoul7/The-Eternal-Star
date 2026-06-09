import { Metadata } from 'next'
import gameData from '../../../../public/gameData.json'
import GameContent from '../../../../components/GameContent'
import { GameInfo } from '@/types'
import { supabase } from '../../../supabaseClient'

export const dynamicParams = true 

export async function generateStaticParams() {
  const games = gameData as GameInfo[]
  return games.map((game) => ({ slug: game.slug }))
}

async function getGamesBySlug(slug: string): Promise<GameInfo> {
  const staticGame = (gameData as GameInfo[]).find((g) => g.slug === slug)
  if (staticGame) return staticGame

  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    throw new Error(`Game with slug "${slug}" not found anywhere.`)
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    imageUrl: data.icon_url || '',
    mapUrl: data.map_url, 
    // REMOVED websocketPort so it stops looking for localhost:8080
    metaDescription: `Custom map uploaded to The Eternal Star`,
    markdown: '',
    images: data.icon_url ? [{ url: data.icon_url, width: 1200, height: 630, alt: data.title, type: 'image/png' }] : []
  }
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const gameInfo = await getGamesBySlug(slug)
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
  const gameInfo = await getGamesBySlug(slug)
  return <GameContent gameInfo={gameInfo} />
}
