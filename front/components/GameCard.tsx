'use client'
import { useState } from 'react'
import Link from 'next/link'

interface GameCardProps {
  title: string
  imageUrl: string
  slug: string
  metaDescription: string
}

// Main card — photo + title only, description shown on tap as overlay
export default function GameCard({ title, imageUrl, slug, metaDescription }: GameCardProps) {
  const [tapped, setTapped] = useState(false)

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer select-none"
      onClick={() => setTapped(t => !t)}>
      {/* Photo fills perfectly — no empty space, no cropping weirdness */}
      <div className="relative w-full aspect-video">
        <img src={imageUrl} alt={title}
          className="absolute inset-0 w-full h-full object-cover" />
      </div>
      {/* Title below photo */}
      <div className="px-2 py-1.5">
        <p className="text-white text-xs font-bold line-clamp-1">{title}</p>
      </div>

      {/* Tap overlay — shows description + play button */}
      {tapped && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-3">
          <p className="text-white text-xs text-center line-clamp-3">{metaDescription}</p>
          <Link href={`/play/${slug}`}
            className="px-5 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl active:scale-95"
            onClick={e => e.stopPropagation()}>
            Play Now →
          </Link>
        </div>
      )}
    </div>
  )
}

// Mini — same behavior, used in sidebars
export function MiniGameCard({ title, imageUrl, slug, metaDescription }: GameCardProps) {
  const [tapped, setTapped] = useState(false)
  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-900 cursor-pointer select-none"
      onClick={() => setTapped(t => !t)}>
      <div className="relative w-full aspect-video">
        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="px-2 py-1">
        <p className="text-white text-xs font-bold line-clamp-1">{title}</p>
      </div>
      {tapped && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 p-2">
          <p className="text-white text-xs text-center line-clamp-2">{metaDescription}</p>
          <Link href={`/play/${slug}`}
            className="px-4 py-1.5 bg-amber-400 text-black text-xs font-bold rounded-xl"
            onClick={e => e.stopPropagation()}>
            Play →
          </Link>
        </div>
      )}
    </div>
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
