'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

interface TreeItemProps {
  name: string
  hasChildren: boolean
}

export default function ExplorerTreeItem({ name, hasChildren }: TreeItemProps) {
  return (
    <div className="flex items-center gap-1 py-1 px-2 hover:bg-slate-800 rounded cursor-pointer text-xs">
      {hasChildren && <ChevronRight size={12} className="text-slate-500" />}
      <span className="text-slate-300">{name}</span>
    </div>
  )
}
