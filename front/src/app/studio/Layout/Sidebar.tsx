'use client'

import React, { useState } from 'react'
import {
  Package,
  FolderOpen,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Info,
  Layers
} from 'lucide-react'
import { PanelsVisibility } from './Toolbar'

interface SidebarProps {
  panelsVisibility: PanelsVisibility
  togglePanel: (panel: keyof PanelsVisibility) => void
  activeSubPanel: 'toolbox' | 'assets' | 'settings' | 'none'
  setActiveSubPanel: (panel: 'toolbox' | 'assets' | 'settings' | 'none') => void
}

export default function Sidebar({
  panelsVisibility,
  togglePanel,
  activeSubPanel,
  setActiveSubPanel
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)

  const toggleSubPanel = (panel: 'toolbox' | 'assets' | 'settings') => {
    if (activeSubPanel === panel) {
      setActiveSubPanel('none')
      if (panel === 'toolbox' && panelsVisibility.toolbox) {
        togglePanel('toolbox')
      }
    } else {
      setActiveSubPanel(panel)
      if (panel === 'toolbox' && !panelsVisibility.toolbox) {
        togglePanel('toolbox')
      }
    }
  }

  const items = [
    {
      id: 'toolbox' as const,
      label: 'Toolbox',
      icon: Package,
      badge: '9+',
      badgeColor: 'bg-amber-500 text-black',
      action: () => toggleSubPanel('toolbox'),
      isActive: activeSubPanel === 'toolbox' && panelsVisibility.toolbox,
      tooltip: 'Browse meshes, models, & audio'
    },
    {
      id: 'assets' as const,
      label: 'Asset Manager',
      icon: FolderOpen,
      action: () => toggleSubPanel('assets'),
      isActive: activeSubPanel === 'assets',
      tooltip: 'Manage uploaded model resources & maps'
    },
    {
      id: 'settings' as const,
      label: 'Game Settings',
      icon: Settings,
      action: () => toggleSubPanel('settings'),
      isActive: activeSubPanel === 'settings',
      tooltip: 'Configure workspace details & physics variables'
    }
  ]

  const bottomItems = [
    {
      id: 'docs',
      label: 'Developer Docs',
      icon: BookOpen,
      action: () => alert('Opening Developer documentation & Lua tutorial...'),
      tooltip: 'Learn how to script using our command bar & code editor'
    },
    {
      id: 'info',
      label: 'System Diagnostics',
      icon: Info,
      action: () => alert('Diagnostics: WebGL2 active, Framerate 60fps stable.'),
      tooltip: 'Check engine status'
    }
  ]

  return (
    <div className="flex h-full z-30 relative select-none">
      {/* Vertical Icon Strip */}
      <div className="w-14 bg-slate-950 border-r border-slate-800 flex flex-col justify-between items-center py-4 h-full">
        {/* Top items */}
        <div className="flex flex-col gap-5 items-center w-full">
          {items.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.id} className="relative w-full flex justify-center">
                <button
                  onClick={item.action}
                  onMouseEnter={() => setHoveredIcon(item.id)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={`p-2.5 rounded-xl transition-all duration-200 relative group flex items-center justify-center ${
                    item.isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : 'text-slate-400 border border-transparent hover:text-slate-100 hover:bg-slate-900'
                  }`}
                  aria-label={item.label}
                >
                  <IconComponent size={20} className={item.isActive ? 'animate-pulse' : ''} />
                  
                  {/* Notification Badge */}
                  {item.badge && (
                    <span className={`absolute -top-1 -right-1 text-[8px] px-1 font-extrabold rounded-full ${item.badgeColor} scale-90`}>
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Hover Tooltip */}
                {hoveredIcon === item.id && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg shadow-2xl z-50 whitespace-nowrap text-xs pointer-events-none transition-all duration-300">
                    <p className="font-bold text-amber-400">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.tooltip}</p>
                    {/* Tooltip triangle */}
                    <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 border-l border-b border-slate-700 rotate-45" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom items */}
        <div className="flex flex-col gap-4 items-center w-full">
          {bottomItems.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.id} className="relative w-full flex justify-center">
                <button
                  onClick={item.action}
                  onMouseEnter={() => setHoveredIcon(item.id)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-900"
                  aria-label={item.label}
                >
                  <IconComponent size={18} />
                </button>

                {hoveredIcon === item.id && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-slate-900 text-slate-100 border border-slate-700 px-3 py-1.5 rounded-lg shadow-2xl z-50 whitespace-nowrap text-xs pointer-events-none">
                    <p className="font-semibold text-slate-200">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.tooltip}</p>
                    <div className="absolute left-0 top-1/2 -translate-x-[5px] -translate-y-1/2 w-2.5 h-2.5 bg-slate-900 border-l border-b border-slate-700 rotate-45" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-2 p-1 bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 rounded-full transition"
            title={isCollapsed ? "Expand panel details" : "Collapse panel details"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Sidebar Panel Drawer */}
      {!isCollapsed && activeSubPanel !== 'none' && (
        <div className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full animate-in slide-in-from-left duration-200">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {activeSubPanel === 'toolbox' && 'Insert Assets'}
              {activeSubPanel === 'assets' && 'Resource Explorer'}
              {activeSubPanel === 'settings' && 'Workspace Config'}
            </h3>
            <button
              onClick={() => setActiveSubPanel('none')}
              className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-bold"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* TOOLBOX DETAILED DRAWER */}
            {activeSubPanel === 'toolbox' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Browse community assets and insert directly into the active viewport hierarchy.
                </p>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    Verified Creator Kit
                  </div>
                  <span className="text-[10px] text-slate-500 leading-none">
                    All assets are scanned for malicious scripts and backdoors.
                  </span>
                </div>
              </div>
            )}

            {/* ASSET MANAGER DETAILED DRAWER */}
            {activeSubPanel === 'assets' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-2">Folder Tree</h4>
                  <div className="space-y-1 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                    <div className="flex items-center gap-2 p-1 text-slate-400 hover:text-white cursor-pointer rounded">
                      <span>📁</span>
                      <span>Images</span>
                    </div>
                    <div className="flex items-center gap-2 p-1 text-slate-400 hover:text-white cursor-pointer rounded">
                      <span>📁</span>
                      <span>Meshes (.obj, .fbx)</span>
                    </div>
                    <div className="flex items-center gap-2 p-1 text-slate-400 hover:text-white cursor-pointer rounded">
                      <span>📁</span>
                      <span>Sounds</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Cloud Space Used:</span>
                  <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden">
                    <div className="bg-amber-500 h-full w-[35%]" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block text-right">3.5 MB of 10 MB</span>
                </div>
              </div>
            )}

            {/* SETTINGS DETAILED DRAWER */}
            {activeSubPanel === 'settings' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">Physics Simulation</h4>
                  <p className="text-[10px] text-slate-500 mb-2">Configure environment constant forces.</p>
                  
                  <div className="space-y-3 bg-slate-950/60 p-3 rounded border border-slate-800/80">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">GRAVITY (studs/s²)</label>
                      <input
                        type="text"
                        defaultValue="196.2"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">FPS CAP</label>
                      <select className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none">
                        <option>60 FPS</option>
                        <option>144 FPS</option>
                        <option>Unlimited</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
