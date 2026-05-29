'use client'

import React, { useState } from 'react'
import { MousePointer, Move, Maximize2, RotateCw, Play, Zap, Square, Box, Circle, Disc, Triangle, Upload } from 'lucide-react'
import { PanelsVisibility } from '../StudioLayout'

interface ToolbarProps {
  activeTool: 'select' | 'move' | 'scale' | 'rotate'
  setActiveTool: (tool: 'select' | 'move' | 'scale' | 'rotate') => void
  simulationState: 'stop' | 'play' | 'run'
  setSimulationState: (state: 'stop' | 'play' | 'run') => void
  panelsVisibility: PanelsVisibility
  togglePanel: (panel: keyof PanelsVisibility) => void
  onInsertPart: (type: 'Block' | 'Sphere' | 'Cylinder' | 'Wedge') => void
  gridSnapping: boolean
  setGridSnapping: (snap: boolean) => void
  snapSize: number
  setSnapSize: (size: number) => void
}

export default function Toolbar({ activeTool, setActiveTool, simulationState, setSimulationState, panelsVisibility, togglePanel, onInsertPart, gridSnapping, setGridSnapping, snapSize, setSnapSize }: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<'Home' | 'Model' | 'View'>('Home')

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 text-slate-200 select-none flex flex-col z-40 relative">
      <div className="flex items-center justify-between px-4 bg-slate-950/80 border-b border-slate-900 h-10">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-xs tracking-wider text-slate-100 mr-4">NOTBLOX STUDIO</span>
          {(['Home', 'Model', 'View'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-all ${activeTab === tab ? 'bg-slate-900 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 px-4 py-2 min-h-[72px] flex items-center gap-6 overflow-x-auto border-b border-slate-950/40">
        {activeTab === 'Home' && (
          <>
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-1 flex-1">
                <button onClick={() => setActiveTool('select')} className={`p-2 rounded ${activeTool === 'select' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}><MousePointer size={16} /></button>
                <button onClick={() => setActiveTool('move')} className={`p-2 rounded ${activeTool === 'move' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'}`}><Move size={16} /></button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase mt-1">Tools</span>
            </div>
            
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => setSimulationState('play')} className={`p-2 rounded ${simulationState === 'play' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}><Play size={15} /></button>
                <button onClick={() => setSimulationState('stop')} className={`p-2 rounded ${simulationState === 'stop' ? 'bg-red-500/20 text-red-400' : 'text-slate-400'}`}><Square size={14} /></button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase mt-1">Simulation</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
