'use client'

import React, { useState, useEffect } from 'react'
import Toolbar from './navigation/Toolbar'
import Sidebar from './navigation/Sidebar'
import CanvasContainer from './viewport/CanvasContainer'
import ExplorerPanel from './panels/ExplorerPanel'
import PropertiesPanel from './panels/PropertiesPanel'
import ScriptEditor from './scripting/ScriptEditor'

export interface ExplorerNode {
  id: string
  name: string
  type: 'Folder' | 'Part' | 'Script' | 'SpawnLocation' | 'Model'
  parentId: string | null
  position: string 
  size: string 
  anchored: boolean
  color: string 
  material: 'Plastic' | 'Wood' | 'Slate' | 'Neon' | 'Glass'
}

export interface PanelsVisibility {
  toolbox: boolean
  explorer: boolean
  properties: boolean
  console: boolean
  codeEditor: boolean
}

export default function StudioLayout() {
  // --- Workspace Hierarchy State (The Engine Data) ---
  const [nodes, setNodes] = useState<ExplorerNode[]>([
    { id: '1', name: 'Workspace', type: 'Folder', parentId: null, position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
    { id: '2', name: 'Baseplate', type: 'Part', parentId: '1', position: '0, -1, 0', size: '100, 2, 100', anchored: true, color: '#334155', material: 'Plastic' },
    { id: '3', name: 'SpawnLocation', type: 'SpawnLocation', parentId: '1', position: '0, 1, 0', size: '8, 1, 8', anchored: true, color: '#10b981', material: 'Neon' },
  ])

  // --- Layout & Tool State ---
  const [panelsVisibility, setPanelsVisibility] = useState<PanelsVisibility>({
    toolbox: true, explorer: true, properties: true, console: true, codeEditor: true
  })
  const [activeLeftTab, setActiveLeftTab] = useState<'toolbox' | 'assets' | 'settings' | 'none'>('toolbox')
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'scale' | 'rotate'>('select')
  const [simulationState, setSimulationState] = useState<'stop' | 'play' | 'run'>('stop')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('3')
  
  const [gridSnapping, setGridSnapping] = useState(true)
  const [snapSize, setSnapSize] = useState(1)

  // --- Physics Simulation Loop ---
  useEffect(() => {
    if (simulationState === 'stop') return
    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        let changed = false
        const updated = prevNodes.map((node) => {
          if (node.type === 'Part' && !node.anchored && node.id !== '2') {
            const [xStr, yStr, zStr] = node.position.split(',')
            const y = parseFloat(yStr) || 0
            if (y > 1) {
              changed = true
              return { ...node, position: `${xStr}, ${Math.max(1, y - 1.5).toFixed(1)}, ${zStr}` }
            }
          }
          return node
        })
        return changed ? updated : prevNodes
      })
    }, 120)
    return () => clearInterval(interval)
  }, [simulationState])

  const togglePanel = (panel: keyof PanelsVisibility) => {
    setPanelsVisibility(prev => ({ ...prev, [panel]: !prev[panel] }))
  }

  const handleInsertPart = (type: 'Block' | 'Sphere' | 'Cylinder' | 'Wedge') => {
    const newId = (Date.now() + Math.floor(Math.random() * 100)).toString()
    setNodes(prev => [...prev, {
      id: newId,
      name: `${type}_${nodes.length}`,
      type: 'Part',
      parentId: '1',
      position: `0, 12.0, 0`,
      size: '4, 4, 4',
      anchored: false,
      color: '#3b82f6',
      material: 'Plastic'
    }])
    setSelectedNodeId(newId)
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-slate-950 font-sans text-slate-200 w-full fixed inset-0">
      {/* Top Ribbon */}
      <Toolbar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool}
        simulationState={simulationState} 
        setSimulationState={setSimulationState}
        panelsVisibility={panelsVisibility} 
        togglePanel={togglePanel}
        onInsertPart={handleInsertPart}
        gridSnapping={gridSnapping} 
        setGridSnapping={setGridSnapping}
        snapSize={snapSize} 
        setSnapSize={setSnapSize}
      />

      {/* Main Workspace Area - Added md:flex-row to fix mobile wrapping */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full relative">
        
        {/* Left Nav - Hidden on mobile to save space, visible on md+ screens */}
        <div className="hidden md:flex h-full">
          <Sidebar 
            panelsVisibility={panelsVisibility} 
            togglePanel={togglePanel}
            activeSubPanel={activeLeftTab} 
            setActiveSubPanel={setActiveLeftTab}
          />
        </div>

        {/* Center Workspace (Canvas + Code Editor) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <CanvasContainer 
            nodes={nodes} 
            selectedNodeId={selectedNodeId} 
            setSelectedNodeId={setSelectedNodeId}
            activeTool={activeTool}
            simulationState={simulationState}
            gridSnapping={gridSnapping}
            snapSize={snapSize}
          />
          {panelsVisibility.codeEditor && (
            <div className="h-1/3 md:h-48 shrink-0 border-t border-slate-800">
              <ScriptEditor />
            </div>
          )}
        </div>

        {/* Right Dock (Explorer + Properties) - Converts to a bottom drawer or stacks cleanly on mobile */}
        <div className="w-full md:w-80 h-1/2 md:h-full bg-slate-900 md:border-l border-t md:border-t-0 border-slate-800 flex flex-col shrink-0 z-20 overflow-y-auto">
          {panelsVisibility.explorer && (
            <ExplorerPanel 
              nodes={nodes} 
              selectedNodeId={selectedNodeId} 
              setSelectedNodeId={setSelectedNodeId} 
              togglePanel={togglePanel}
            />
          )}
          {panelsVisibility.properties && (
            <PropertiesPanel 
              nodes={nodes} 
              setNodes={setNodes} 
              selectedNodeId={selectedNodeId} 
              togglePanel={togglePanel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
