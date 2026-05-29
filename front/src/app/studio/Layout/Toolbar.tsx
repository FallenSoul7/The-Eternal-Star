'use client'

import React, { useState } from 'react'
import {
  MousePointer,
  Move,
  Maximize2,
  RotateCw,
  Play,
  Zap,
  Square,
  Upload,
  Layers,
  FileText,
  Sliders,
  Terminal,
  FolderTree,
  Hammer,
  Settings,
  Grid,
  Sparkles,
  HelpCircle,
  Eye,
  ToggleLeft,
  ChevronDown,
  Box,
  Circle,
  Disc,
  Triangle,
  PlayCircle
} from 'lucide-react'

export interface PanelsVisibility {
  toolbox: boolean
  explorer: boolean
  properties: boolean
  console: boolean
  codeEditor: boolean
}

interface ToolbarProps {
  activeTool: 'select' | 'move' | 'scale' | 'rotate'
  setActiveTool: (tool: 'select' | 'move' | 'scale' | 'rotate') => void
  simulationState: 'stop' | 'play' | 'run'
  setSimulationState: (state: 'stop' | 'play' | 'run') => void
  panelsVisibility: PanelsVisibility
  togglePanel: (panel: keyof PanelsVisibility) => void
  onPublishClick: () => void
  onInsertPart: (type: 'Block' | 'Sphere' | 'Cylinder' | 'Wedge') => void
  gridSnapping: boolean
  setGridSnapping: (snap: boolean) => void
  snapSize: number
  setSnapSize: (size: number) => void
}

type TabType = 'Home' | 'Model' | 'Test' | 'View' | 'Plugins'

export default function Toolbar({
  activeTool,
  setActiveTool,
  simulationState,
  setSimulationState,
  panelsVisibility,
  togglePanel,
  onPublishClick,
  onInsertPart,
  gridSnapping,
  setGridSnapping,
  snapSize,
  setSnapSize
}: ToolbarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Home')
  const [showPartDropdown, setShowPartDropdown] = useState(false)

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 text-slate-200 select-none flex flex-col z-40 relative">
      {/* Top File Bar / Ribbon Tabs */}
      <div className="flex items-center justify-between px-4 bg-slate-950/80 border-b border-slate-900 h-10">
        <div className="flex items-center space-x-1">
          {/* Logo icon */}
          <div className="flex items-center gap-2 mr-4">
            <div className="w-5 h-5 bg-gradient-to-tr from-amber-600 to-amber-400 rotate-12 rounded flex items-center justify-center text-black font-black text-xs shadow-md">
              R
            </div>
            <span className="font-bold text-xs tracking-wider text-slate-100 hidden sm:inline-block">
              NOTBLOX STUDIO
            </span>
          </div>

          {/* Ribbon Tabs */}
          {(['Home', 'Model', 'Test', 'View', 'Plugins'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-all duration-150 relative -bottom-[5px] border-t border-x ${
                activeTab === tab
                  ? 'bg-slate-900 text-amber-400 border-slate-800'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Global Save/Publish Quick Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPublishClick}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold text-xs rounded transition shadow-md"
            title="Publish current workspace model to database"
          >
            <Upload size={13} className="stroke-[3px]" />
            Publish
          </button>
        </div>
      </div>

      {/* Ribbon Control Body */}
      <div className="bg-slate-900 px-4 py-2 min-h-[72px] flex items-center gap-6 overflow-x-auto border-b border-slate-950/40 scrollbar-none">
        
        {/* ================= HOME TAB ================= */}
        {activeTab === 'Home' && (
          <>
            {/* Clipboard Group */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={onPublishClick}
                  className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                >
                  <Upload size={18} className="text-emerald-400" />
                  <span className="text-[10px] mt-0.5">Publish Game</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">File</span>
            </div>

            {/* Tools Group */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-1 flex-1">
                {/* Select */}
                <button
                  onClick={() => setActiveTool('select')}
                  className={`flex flex-col items-center justify-center w-12 h-11 rounded transition ${
                    activeTool === 'select'
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Select Tool"
                >
                  <MousePointer size={16} />
                  <span className="text-[9px] mt-0.5">Select</span>
                </button>

                {/* Move */}
                <button
                  onClick={() => setActiveTool('move')}
                  className={`flex flex-col items-center justify-center w-12 h-11 rounded transition ${
                    activeTool === 'move'
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Move Tool (Arrows drag)"
                >
                  <Move size={16} />
                  <span className="text-[9px] mt-0.5">Move</span>
                </button>

                {/* Scale */}
                <button
                  onClick={() => setActiveTool('scale')}
                  className={`flex flex-col items-center justify-center w-12 h-11 rounded transition ${
                    activeTool === 'scale'
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Scale Tool (Resize)"
                >
                  <Maximize2 size={16} />
                  <span className="text-[9px] mt-0.5">Scale</span>
                </button>

                {/* Rotate */}
                <button
                  onClick={() => setActiveTool('rotate')}
                  className={`flex flex-col items-center justify-center w-12 h-11 rounded transition ${
                    activeTool === 'rotate'
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Rotate Tool (Spin spheres)"
                >
                  <RotateCw size={16} />
                  <span className="text-[9px] mt-0.5">Rotate</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Tools</span>
            </div>

            {/* Insert Part Group */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-1.5 flex-1 relative">
                <button
                  onClick={() => onInsertPart('Block')}
                  className="flex flex-col items-center justify-center w-12 h-11 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Insert block"
                >
                  <Box size={18} className="text-blue-400" />
                  <span className="text-[9px] mt-0.5">Part</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowPartDropdown(!showPartDropdown)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                  >
                    <ChevronDown size={14} />
                  </button>

                  {showPartDropdown && (
                    <div className="absolute top-8 left-0 w-32 bg-slate-950 border border-slate-800 rounded shadow-xl z-50 py-1 text-xs">
                      <button
                        onClick={() => {
                          onInsertPart('Block')
                          setShowPartDropdown(false)
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Box size={14} className="text-blue-400" />
                        Block
                      </button>
                      <button
                        onClick={() => {
                          onInsertPart('Sphere')
                          setShowPartDropdown(false)
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Circle size={14} className="text-emerald-400" />
                        Sphere
                      </button>
                      <button
                        onClick={() => {
                          onInsertPart('Cylinder')
                          setShowPartDropdown(false)
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Disc size={14} className="text-amber-400" />
                        Cylinder
                      </button>
                      <button
                        onClick={() => {
                          onInsertPart('Wedge')
                          setShowPartDropdown(false)
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Triangle size={14} className="text-purple-400 rotate-180" />
                        Wedge
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Insert</span>
            </div>

            {/* Test / Simulation Group */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-2 flex-1">
                {/* Play */}
                <button
                  onClick={() => setSimulationState('play')}
                  className={`flex flex-col items-center justify-center px-2.5 h-11 rounded transition ${
                    simulationState === 'play'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Play Solo"
                >
                  <Play size={15} className="fill-emerald-400/20 text-emerald-400" />
                  <span className="text-[9px] mt-0.5">Play</span>
                </button>

                {/* Run */}
                <button
                  onClick={() => setSimulationState('run')}
                  className={`flex flex-col items-center justify-center px-2.5 h-11 rounded transition ${
                    simulationState === 'run'
                      ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Run Physics"
                >
                  <Zap size={15} className="fill-cyan-400/20 text-cyan-400" />
                  <span className="text-[9px] mt-0.5">Run</span>
                </button>

                {/* Stop */}
                <button
                  onClick={() => setSimulationState('stop')}
                  className={`flex flex-col items-center justify-center px-2.5 h-11 rounded transition ${
                    simulationState === 'stop'
                      ? 'bg-red-500/20 border border-red-500 text-red-400'
                      : 'border border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title="Stop Simulation"
                >
                  <Square size={14} className="fill-red-400/20 text-red-400" />
                  <span className="text-[9px] mt-0.5">Stop</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Simulation</span>
            </div>

            {/* View Panels Quickly */}
            <div className="flex flex-col items-center h-full">
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={() => togglePanel('toolbox')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1 border transition ${
                    panelsVisibility.toolbox
                      ? 'bg-slate-800 text-white border-slate-700'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  Toolbox
                </button>
                <button
                  onClick={() => togglePanel('explorer')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1 border transition ${
                    panelsVisibility.explorer
                      ? 'bg-slate-800 text-white border-slate-700'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  Explorer
                </button>
                <button
                  onClick={() => togglePanel('properties')}
                  className={`px-2 py-1 text-[10px] font-semibold rounded flex items-center gap-1 border transition ${
                    panelsVisibility.properties
                      ? 'bg-slate-800 text-white border-slate-700'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  Properties
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Windows</span>
            </div>
          </>
        )}

        {/* ================= MODEL TAB ================= */}
        {activeTab === 'Model' && (
          <>
            {/* Same Tools */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setActiveTool('select')}
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded transition ${
                    activeTool === 'select' ? 'bg-amber-500/20 border border-amber-500 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <MousePointer size={14} />
                  <span className="text-[8px] mt-0.5">Select</span>
                </button>
                <button
                  onClick={() => setActiveTool('move')}
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded transition ${
                    activeTool === 'move' ? 'bg-amber-500/20 border border-amber-500 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Move size={14} />
                  <span className="text-[8px] mt-0.5">Move</span>
                </button>
                <button
                  onClick={() => setActiveTool('scale')}
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded transition ${
                    activeTool === 'scale' ? 'bg-amber-500/20 border border-amber-500 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Maximize2 size={14} />
                  <span className="text-[8px] mt-0.5">Scale</span>
                </button>
                <button
                  onClick={() => setActiveTool('rotate')}
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded transition ${
                    activeTool === 'rotate' ? 'bg-amber-500/20 border border-amber-500 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <RotateCw size={14} />
                  <span className="text-[8px] mt-0.5">Rotate</span>
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Transform</span>
            </div>

            {/* Snap To Grid Settings */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-3 flex-1 text-xs">
                {/* Snapping Toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={gridSnapping}
                    onChange={(e) => setGridSnapping(e.target.checked)}
                    className="accent-amber-500 rounded bg-slate-950 border-slate-800 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Snap to Grid</span>
                </label>

                {/* Snap Size */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[11px]">Size:</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="10"
                    value={snapSize}
                    onChange={(e) => setSnapSize(parseFloat(e.target.value) || 1)}
                    className="bg-slate-950 border border-slate-700 rounded px-1 py-0.5 w-12 text-center text-white text-[11px] focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-500 text-[10px]">studs</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Snapping Settings</span>
            </div>

            {/* Parts Insert */}
            <div className="flex flex-col items-center h-full">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => onInsertPart('Block')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px]"
                >
                  <Box size={12} className="text-blue-400" />
                  Block
                </button>
                <button
                  onClick={() => onInsertPart('Sphere')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px]"
                >
                  <Circle size={12} className="text-emerald-400" />
                  Sphere
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Solid Geometry</span>
            </div>
          </>
        )}

        {/* ================= TEST TAB ================= */}
        {activeTab === 'Test' && (
          <>
            {/* Play controls */}
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setSimulationState('play')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition text-xs font-semibold ${
                    simulationState === 'play' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Play size={14} className="fill-emerald-400/20 text-emerald-400" />
                  Play Solo
                </button>

                <button
                  onClick={() => setSimulationState('run')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition text-xs font-semibold ${
                    simulationState === 'run' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Zap size={14} className="fill-cyan-400/20 text-cyan-400" />
                  Run Server
                </button>

                <button
                  onClick={() => setSimulationState('stop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition text-xs font-semibold ${
                    simulationState === 'stop' ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Square size={13} className="fill-red-400/20 text-red-400" />
                  Stop
                </button>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Simulation Mode</span>
            </div>

            {/* Performance Debugging Info */}
            <div className="flex flex-col items-center h-full">
              <div className="flex items-center gap-4 flex-1 text-slate-400 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Network: 0 ms ping</span>
                </div>
                <div>
                  <span>Client memory: 12.8 MB</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Diagnostics</span>
            </div>
          </>
        )}

        {/* ================= VIEW TAB ================= */}
        {activeTab === 'View' && (
          <>
            {/* Window Toggles */}
            <div className="flex flex-col items-center h-full">
              <div className="flex items-center gap-1.5 flex-1">
                {(Object.keys(panelsVisibility) as Array<keyof PanelsVisibility>).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => togglePanel(panel)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition capitalize ${
                      panelsVisibility[panel]
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {panel}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Docked Windows</span>
            </div>
          </>
        )}

        {/* ================= PLUGINS TAB ================= */}
        {activeTab === 'Plugins' && (
          <>
            <div className="flex flex-col items-center h-full border-r border-slate-800/80 pr-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  <Sparkles size={14} />
                  <span>AI Mesh Generator</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                  <Settings size={14} />
                  <span>Auto rigger</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Installed Plugins</span>
            </div>

            <div className="flex flex-col items-center h-full">
              <span className="text-xs text-slate-400 flex-1 flex items-center">
                Need more tools? Go to Toolbox &rarr; Plugins
              </span>
              <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">Store</span>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
