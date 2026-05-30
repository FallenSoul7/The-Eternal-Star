'use client'

import React from 'react'
import AssetCard from './AssetCard'

export default function ToolboxPanel() {
  const assets = [
    { name: 'Classic Block', type: 'Part' as const },
    { name: 'Spawn Point', type: 'Part' as const },
    { name: 'Custom Model', type: 'Model' as const },
  ]

  return (
    <div className="p-4 grid grid-cols-2 gap-3">
      {assets.map((asset, i) => (
        <AssetCard key={i} name={asset.name} type={asset.type} />
      ))}
    </div>
  )
}
