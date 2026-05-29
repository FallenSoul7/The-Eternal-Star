'use client'

import React from 'react'
import { Sliders, X } from 'lucide-react'
import { ExplorerNode, PanelsVisibility } from '../StudioLayout'

interface PropertiesPanelProps {
  nodes: ExplorerNode[]
  setNodes: React.Dispatch<React.SetStateAction<ExplorerNode[]>>
  selectedNodeId: string | null
  togglePanel: (panel: keyof PanelsVisibility) => void
}

export default function PropertiesPanel({ nodes, setNodes, selectedNodeId, togglePanel }: PropertiesPanelProps) {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handlePropertyChange = (property: keyof ExplorerNode, value: any) => {
    if (!selectedNodeId) return
    setNodes((prev) =>
      prev.map((node) => (node.id === selectedNodeId ? { ...node, [property]: value } : node))
    )
  }

  return (
    <div className="h-80 flex flex-col overflow-hidden bg-slate-900 border-t border-slate-800">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Sliders size={14} className="text-amber-400" />
          <span>PROPERTIES PANEL</span>
        </div>
        <button onClick={() => togglePanel('properties')} className="text-slate-500 hover:text-slate-300">
          <X size={13} />
        </button>
      </div>

      {selectedNode ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-[10px] text-slate-500 block">SELECTED INSTANCE</span>
            <span className="text-sm font-bold text-slate-100">{selectedNode.name}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">NAME</label>
              <input
                type="text"
                value={selectedNode.name}
                onChange={(e) => handlePropertyChange('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {selectedNode.type !== 'Folder' && selectedNode.type !== 'Script' && (
              <>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">POSITION (X, Y, Z)</label>
                  <input
                    type="text"
                    value={selectedNode.position}
                    onChange={(e) => handlePropertyChange('position', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-850 mt-2">
                  <span className="text-[10px] text-slate-500">ANCHORED</span>
                  <input
                    type="checkbox"
                    checked={selectedNode.anchored}
                    onChange={(e) => handlePropertyChange('anchored', e.target.checked)}
                    className="accent-amber-500 h-4 w-4 bg-slate-950 cursor-pointer"
                  />
                </div>

                <div className="mt-2">
                  <label className="text-[10px] text-slate-500 block mb-1">COLOR HEX</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedNode.color || '#3b82f6'}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="bg-transparent h-6 w-8 cursor-pointer rounded overflow-hidden"
                    />
                    <input
                      type="text"
                      value={selectedNode.color || ''}
                      onChange={(e) => handlePropertyChange('color', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs p-4 text-center">
          Select an element in the hierarchy tree to configure model parameters.
        </div>
      )}
    </div>
  )
}
