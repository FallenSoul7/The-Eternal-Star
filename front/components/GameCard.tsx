'use client'
import Link from 'next/link'

interface GameCardProps {
  title: string
  imageUrl: string
  slug: string
  metaDescription: string
}

// Main card — Completely bypasses the tapped overlay and routes instantly on click
export default function GameCard({ title, imageUrl, slug }: GameCardProps) {
  return (
    <Link href={`/play/${slug}`} className="block rounded-xl overflow-hidden bg-slate-900 select-none active:scale-[0.98] transition-transform">
      {/* Photo fills perfectly — no empty space, no cropping weirdness */}
      <div className="relative w-full aspect-video">
        <img src={imageUrl} alt={title}
          className="absolute inset-0 w-full h-full object-cover" />
      </div>
      {/* Title below photo */}
      <div className="px-2 py-1.5">
        <p className="text-white text-xs font-bold line-clamp-1">{title}</p>
      </div>
    </Link>
  )
}

// Mini — same direct routing behavior, bypasses the tapped state completely
export function MiniGameCard({ title, imageUrl, slug }: GameCardProps) {
  return (
    <Link href={`/play/${slug}`} className="block rounded-xl overflow-hidden bg-slate-900 select-none active:scale-[0.98] transition-transform">
      <div className="relative w-full aspect-video">
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="px-2 py-1">
        <p className="text-white text-xs font-bold line-clamp-1">{title}</p>
      </div>
    </Link>
  )
}

export function MicroGameCard({ title, imageUrl, slug }: Omit<GameCardProps, 'metaDescription'>) {
  return (
    <Link href={`/play/${slug}`} className="block active:scale-[0.98] transition-transform">
      <div className="relative w-full aspect-video overflow-hidden rounded-lg">
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <p className="text-xs font-semibold text-white mt-1 line-clamp-1">{title}</p>
    </Link>
  )
}
