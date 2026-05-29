'use client'

import React from 'react'

interface AssetCardProps {
  name: string
  type: 'Part' | 'Model'
}

export default function AssetCard({ name, type }: AssetCardProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-2 rounded hover:border-amber-500/50 cursor-pointer transition-all">
      <div className="h-16 bg-slate-900 rounded mb-2 flex items-center justify-center text-slate-600">
        {type === 'Part' ? '🧱' : '📦'}
      </div>
      <div className="text-[10px] font-bold text-slate-300 truncate">{name}</div>
    </div>
  )
}
