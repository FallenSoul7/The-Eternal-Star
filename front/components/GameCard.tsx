import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card'

interface GameCardProps {
  title: string
  imageUrl: string
  slug: string
  metaDescription: string
}

export default function GameCard({ title, imageUrl, slug, metaDescription }: GameCardProps) {
  return (
    <Link href={`/play/${slug}`} className="block">
      <Card className="overflow-hidden bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors">
        {/* Image container — fixed aspect ratio so it never shows empty space or cuts off */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-bold text-white leading-tight line-clamp-1">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-400 line-clamp-2">{metaDescription}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export function MiniGameCard({ title, imageUrl, slug, metaDescription }: GameCardProps) {
  return (
    <Link href={`/play/${slug}`} className="block">
      <Card className="overflow-hidden bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors">
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <CardHeader className="p-2">
          <CardTitle className="text-xs font-bold text-white line-clamp-1">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-400 line-clamp-1">{metaDescription}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

export function MicroGameCard({ title, imageUrl, slug }: Omit<GameCardProps, 'metaDescription'>) {
  return (
    <Link href={`/play/${slug}`} className="block">
      <div className="relative w-full aspect-video overflow-hidden rounded-lg">
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <p className="text-xs font-semibold text-white mt-1 line-clamp-1">{title}</p>
    </Link>
  )
}
