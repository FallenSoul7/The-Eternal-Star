// Go up 4 levels to reach front/public/
import gameData from '../../../../public/gameData.json'
import { Metadata } from 'next'
// Go up 4 levels to reach front/components/
import GameContent from '../../../../components/GameContent'

// Perfect type definition mapping your exact JSON layout
export interface GameInfo {
  title: string
  imageUrl: string
  slug: string
  websocketPort: number
  metaDescription: string
  markdown: string
  images: {
    url: string
    width: number
    height: number
    alt: string
    type: string
  }[]
}

export async function generateStaticParams() {
  const games = gameData as GameInfo[]
  return games.map((game) => ({
    slug: game.slug,
  }))
}

function getGamesBySlug(slug: string): GameInfo {
  const game = (gameData as GameInfo[]).find((g) => g.slug === slug)
  if (!game) {
    throw new Error(`Game with slug "${slug}" not found`)
  }
  return game
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const gameInfo = getGamesBySlug(slug)

  return {
    title: `Play ${gameInfo.title} - NotBlox`,
    description: gameInfo.metaDescription,
    openGraph: {
      title: `Play ${gameInfo.title} - NotBlox`,
      description: gameInfo.metaDescription,
      images: gameInfo.images ?? [],
      siteName: 'NotBlox Online',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@iercan_',
      creator: '@iercan_',
    },
    alternates: {
      canonical: `https://www.notblox.online/play/${gameInfo.slug}`,
    },
  }
}

export default async function GamePage({ params }: { params: Params }) {
  const { slug } = await params
  const gameInfo = getGamesBySlug(slug)

  return <GameContent gameInfo={gameInfo} />
}
