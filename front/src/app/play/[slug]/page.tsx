import gameData from '../../../../public/gameData.json'
import { Metadata } from 'next'
import GameContent from '../../../../components/GameContent'
import { GameInfo } from '@/types'

export async function generateStaticParams() {
  const games = gameData as GameInfo[]
  return games.map((game) => ({ slug: game.slug }))
}

function getGamesBySlug(slug: string): GameInfo {
  const game = (gameData as GameInfo[]).find((g) => g.slug === slug)
  if (!game) throw new Error(`Game with slug "${slug}" not found`)
  return game
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const gameInfo = getGamesBySlug(slug)
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
  const gameInfo = getGamesBySlug(slug)
  return <GameContent gameInfo={gameInfo} />
}
