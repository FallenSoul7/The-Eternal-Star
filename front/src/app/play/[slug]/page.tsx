import gameData from '../../../../public/gameData.json'
import { Metadata } from 'next'
import GameContent from '../../../../components/GameContent'

// Declaring the type locally so it never fails to import
export interface GameInfo {
  slug: string
  title: string
  metaDescription: string
  images?: string[]
  [key: string]: any // Fallback for any other custom properties in your JSON
}

// 1. Generate paths for all games at build time
export async function generateStaticParams() {
  const games = gameData as GameInfo[]
  return games.map((game) => ({
    slug: game.slug,
  }))
}

// 2. Helper to find game data
function getGamesBySlug(slug: string): GameInfo {
  const game = (gameData as GameInfo[]).find((g) => g.slug === slug)
  if (!game) {
    throw new Error(`Game with slug "${slug}" not found`)
  }
  return game
}

// 3. Define params type for Next.js 15
type Params = Promise<{ slug: string }>

// 4. Generate metadata dynamically for each game
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

// 5. Main Page Component
export default async function GamePage({ params }: { params: Params }) {
  const { slug } = await params
  const gameInfo = getGamesBySlug(slug)

  return <GameContent gameInfo={gameInfo} />
}
