import gameData from '../../../../public/gameData.json'
import { Metadata } from 'next'
import GameContent from '../../../../components/GameContent'
import { GameInfo } from '@/types'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    },
  }
}

export default async function GamePage({ params }: { params: Params }) {
  const { slug } = await params
  const gameInfo = getGamesBySlug(slug)

  // Get username from Supabase session server-side
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  const playerName = session?.user?.email?.split('@')[0] ?? 'Player'

  return <GameContent gameInfo={gameInfo} playerName={playerName} />
}
