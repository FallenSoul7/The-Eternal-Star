'use client'

import React from 'react'
import { FolderTree, X } from 'lucide-react'
import { ExplorerNode, PanelsVisibility } from '../StudioLayout'

interface ExplorerPanelProps {
  nodes: ExplorerNode[]
  selectedNodeId: string | null
  setSelectedNodeId: (id: string) => void
  togglePanel: (panel: keyof PanelsVisibility) => void
}

export default function ExplorerPanel({ nodes, selectedNodeId, setSelectedNodeId, togglePanel }: ExplorerPanelProps) {
  const renderExplorerNodes = (parentId: string | null, depth = 0) => {
    const children = nodes.filter((n) => n.parentId === parentId)
    return children.map((node) => {
      const hasChildren = nodes.some((n) => n.parentId === node.id)
      const isSelected = selectedNodeId === node.id

      return (
        <div key={node.id} className="flex flex-col">
          <div
            onClick={() => setSelectedNodeId(node.id)}
            className={`flex items-center justify-between px-2 py-1 cursor-pointer transition text-xs select-none ${
              isSelected ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {node.type === 'Folder' && <span>📁</span>}
              {node.type === 'Part' && <span>🧱</span>}
              {node.type === 'Script' && <span>📜</span>}
              {node.type === 'SpawnLocation' && <span>🏁</span>}
              <span className="truncate">{node.name}</span>
            </div>
          </div>
          {hasChildren && renderExplorerNodes(node.id, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="flex-1 flex flex-col border-b border-slate-800 overflow-hidden">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <FolderTree size={14} className="text-amber-400" />
          <span>WORKSPACE EXPLORER</span>
        </div>
        <button onClick={() => togglePanel('explorer')} className="text-slate-500 hover:text-slate-300">
          <X size={13} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Game Hierarchy
        </div>
        {renderExplorerNodes(null)}
      </div>
    </div>
  )
}
