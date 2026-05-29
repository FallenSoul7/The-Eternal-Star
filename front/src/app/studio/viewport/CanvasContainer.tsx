'use client'

import React from 'react'
import { ExplorerNode } from '../StudioLayout'

interface CanvasProps {
  nodes: ExplorerNode[]
  selectedNodeId: string | null
  setSelectedNodeId: (id: string) => void
  activeTool: string
  simulationState: string
  gridSnapping: boolean
  snapSize: number
}

export default function CanvasContainer({
  nodes,
  selectedNodeId,
  setSelectedNodeId,
  activeTool,
  simulationState,
  gridSnapping,
  snapSize
}: CanvasProps) {
  return (
    <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col border-b border-slate-900 group select-none">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950 to-indigo-950/20 pointer-events-none" />

      <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 font-mono flex items-center gap-3 z-20 backdrop-blur-sm shadow-xl">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          WebGL ACTIVE
        </span>
        <span>GRID: {gridSnapping ? `${snapSize} Studs` : 'OFF'}</span>
      </div>

      {simulationState !== 'stop' && (
        <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded font-bold animate-pulse z-20 uppercase tracking-widest">
          ⚙️ physics simulation {simulationState}
        </div>
      )}

      <svg className="w-full h-full cursor-grab active:cursor-grabbing" viewBox="-50 -30 100 60" preserveAspectRatio="xMidYMid slice">
        <circle cx="0" cy="-20" r="12" className="fill-slate-800/30 blur-xl" />
        <circle cx="0" cy="-20" r="2" className="fill-amber-400/20" />

        <g transform="translate(0, 15) rotateX(60)">
          {Array.from({ length: 21 }).map((_, idx) => {
            const val = (idx - 10) * 4
            return (
              <g key={idx}>
                <line x1={val} y1="-40" x2={val} y2="40" className="stroke-slate-800/40" strokeWidth="0.1" />
                <line x1="-40" y1={val} x2="40" y2={val} className="stroke-slate-800/40" strokeWidth="0.1" />
              </g>
            )
          })}
        </g>

        {nodes.map((node) => {
          if (node.id === '1' || node.type === 'Script' || node.type === 'Folder') return null

          const [xStr, yStr, zStr] = node.position.split(',')
          const px = parseFloat(xStr) || 0
          const py = parseFloat(yStr) || 0
          const pz = parseFloat(zStr) || 0

          const projX = px - pz
          const projY = (px + pz) * 0.4 - py * 1.2 + 8
          const isSelected = selectedNodeId === node.id

          if (node.id === '2') {
            return (
              <g key={node.id} onClick={() => setSelectedNodeId('2')}>
                <polygon points="-40,14 40,14 0,30 -0,30" className="transition-all duration-150" fill={node.color || '#1e293b'} stroke={isSelected ? '#f59e0b' : '#334155'} strokeWidth={isSelected ? '0.5' : '0.1'} opacity="0.85" />
              </g>
            )
          }

          if (node.type === 'SpawnLocation') {
            return (
              <g key={node.id} onClick={() => setSelectedNodeId(node.id)} className="cursor-pointer">
                <ellipse cx={projX} cy={projY} rx="5" ry="2" fill={node.color || '#10b981'} stroke={isSelected ? '#f59e0b' : '#059669'} strokeWidth={isSelected ? '0.4' : '0.15'} />
                <polygon points={`${projX},${projY - 0.5} ${projX + 1},${projY + 0.3} ${projX - 1},${projY + 0.3}`} fill="#ffffff" opacity="0.9" />
              </g>
            )
          }

          return (
            <g key={node.id} onClick={() => setSelectedNodeId(node.id)} className="cursor-pointer group/part">
              {isSelected && <ellipse cx={projX} cy={projY + 1} rx="4.5" ry="2.5" fill="none" stroke="#f59e0b" strokeDasharray="1, 1" strokeWidth="0.3" className="animate-spin duration-[8s]" />}
              <polygon points={`${projX - 2.5},${projY} ${projX},${projY + 1.2} ${projX},${projY - 2.8} ${projX - 2.5},${projY - 4}`} fill={node.color || '#3b82f6'} filter="brightness(0.85)" />
              <polygon points={`${projX},${projY + 1.2} ${projX + 2.5},${projY} ${projX + 2.5},${projY - 4} ${projX},${projY - 2.8}`} fill={node.color || '#3b82f6'} filter="brightness(0.7)" />
              <polygon points={`${projX - 2.5},${projY - 4} ${projX},${projY - 2.8} ${projX + 2.5},${projY - 4} ${projX},${projY - 5.2}`} fill={node.color || '#3b82f6'} filter="brightness(1.05)" stroke={isSelected ? '#f59e0b' : 'none'} strokeWidth="0.25" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
