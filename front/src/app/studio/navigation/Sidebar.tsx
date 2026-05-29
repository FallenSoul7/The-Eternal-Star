'use client'

import React, { useState } from 'react'
import { Package, FolderOpen, Settings, BookOpen, Info, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import { PanelsVisibility } from '../StudioLayout'

interface SidebarProps {
  panelsVisibility: PanelsVisibility
  togglePanel: (panel: keyof PanelsVisibility) => void
  activeSubPanel: 'toolbox' | 'assets' | 'settings' | 'none'
  setActiveSubPanel: (panel: 'toolbox' | 'assets' | 'settings' | 'none') => void
}

export default function Sidebar({ panelsVisibility, togglePanel, activeSubPanel, setActiveSubPanel }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSubPanel = (panel: 'toolbox' | 'assets' | 'settings') => {
    if (activeSubPanel === panel) {
      setActiveSubPanel('none')
    } else {
      setActiveSubPanel(panel)
      if (panel === 'toolbox' && !panelsVisibility.toolbox) togglePanel('toolbox')
    }
  }

  return (
    <div className="flex h-full z-30 relative select-none">
      <div className="w-14 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 justify-between">
        <div className="flex flex-col gap-5 w-full items-center">
          <button onClick={() => toggleSubPanel('toolbox')} className={`p-2.5 rounded-xl transition-all ${activeSubPanel === 'toolbox' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100'}`}>
            <Package size={20} />
          </button>
          <button onClick={() => toggleSubPanel('assets')} className={`p-2.5 rounded-xl transition-all ${activeSubPanel === 'assets' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:text-slate-100'}`}>
            <FolderOpen size={20} />
          </button>
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 bg-slate-900 border border-slate-800 text-slate-500 rounded-full">
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {!isCollapsed && activeSubPanel !== 'none' && (
        <div className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full p-4 animate-in slide-in-from-left duration-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            {activeSubPanel === 'toolbox' ? 'Insert Assets' : 'Workspace Data'}
          </h3>
          {activeSubPanel === 'toolbox' && (
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1"><ShieldCheck size={13} className="text-emerald-400" /> Verified</div>
              <span className="text-[10px] text-slate-500">Assets scanned for scripts.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
