'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  FolderTree,
  Sliders,
  Terminal,
  FileText,
  Play,
  Square,
  Sparkles,
  HelpCircle,
  Eye,
  Settings,
  Plus,
  Trash2,
  Send,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  Box,
  CornerDownRight,
  Code2
} from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import Toolbar, { PanelsVisibility } from './Toolbar'
import Sidebar from './Sidebar'

// Interfaces for Workspace Hierarchy
export interface ExplorerNode {
  id: string
  name: string
  type: 'Folder' | 'Part' | 'Script' | 'SpawnLocation' | 'Model'
  parentId: string | null
  // Interactive parameters
  position: string // Format "X, Y, Z"
  size: string // Format "Width, Height, Depth"
  anchored: boolean
  color: string // Hex code
  material: 'Plastic' | 'Wood' | 'Slate' | 'Neon' | 'Glass'
}

interface ConsoleLog {
  id: string
  text: string
  type: 'info' | 'warn' | 'error' | 'success'
  timestamp: string
}

export default function StudioLayout() {
  // --- Workspace Hierarchy State ---
  const [nodes, setNodes] = useState<ExplorerNode[]>([
    { id: '1', name: 'Workspace', type: 'Folder', parentId: null, position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
    { id: '2', name: 'Baseplate', type: 'Part', parentId: '1', position: '0, -1, 0', size: '100, 2, 100', anchored: true, color: '#334155', material: 'Plastic' },
    { id: '3', name: 'SpawnLocation', type: 'SpawnLocation', parentId: '1', position: '0, 1, 0', size: '8, 1, 8', anchored: true, color: '#10b981', material: 'Neon' },
    { id: '4', name: 'GameScript', type: 'Script', parentId: '1', position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
    { id: '5', name: 'Lighting', type: 'Folder', parentId: null, position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
    { id: '6', name: 'ReplicatedStorage', type: 'Folder', parentId: null, position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
    { id: '7', name: 'ServerScriptService', type: 'Folder', parentId: null, position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
    { id: '8', name: 'StarterGui', type: 'Folder', parentId: null, position: '0, 0, 0', size: '0, 0, 0', anchored: true, color: '', material: 'Plastic' },
  ])

  // --- Layout Panels Visibilities ---
  const [panelsVisibility, setPanelsVisibility] = useState<PanelsVisibility>({
    toolbox: true,
    explorer: true,
    properties: true,
    console: true,
    codeEditor: true
  })

  const [activeLeftTab, setActiveLeftTab] = useState<'toolbox' | 'assets' | 'settings' | 'none'>('toolbox')
  const [activeTool, setActiveTool] = useState<'select' | 'move' | 'scale' | 'rotate'>('select')
  const [simulationState, setSimulationState] = useState<'stop' | 'play' | 'run'>('stop')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('2') // Default selection: Baseplate

  // Snapping settings
  const [gridSnapping, setGridSnapping] = useState(true)
  const [snapSize, setSnapSize] = useState(1)

  // --- Output Console Logs & Command Bar ---
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    { id: '1', text: '🚀 NotBlox Studio Engine initialized.', type: 'info', timestamp: '12:00:00' },
    { id: '2', text: 'WebGL Renderer context bound to SVG Viewport.', type: 'info', timestamp: '12:00:01' },
    { id: '3', text: 'Type "help" in the command bar below to get started!', type: 'success', timestamp: '12:00:01' }
  ])
  const [commandText, setCommandText] = useState('')
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all')
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // --- Code Editor Tabs & Scripts contents ---
  const [activeScriptId, setActiveScriptId] = useState<string | null>('4') // Link to GameScript (id: '4')
  const [scriptContents, setScriptContents] = useState<{ [id: string]: string }>({
    '4': `-- NotBlox Server-Side Game Script\nprint("Hello from NotBlox Lua engine!")\n\nlocal baseplate = workspace.Baseplate\nbaseplate.Material = "Neon"\nbaseplate.Color = "#1e293b"\n\nwarn("Simulation loaded! Script initialized successfully.")\n`
  })

  // --- Publish Map Modal (Supabase upload form integration) ---
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishTitle, setPublishTitle] = useState('')
  const [publishThumbnail, setPublishThumbnail] = useState<File | null>(null)
  const [publishModel, setPublishModel] = useState<File | null>(null)
  const [publishUploading, setPublishUploading] = useState(false)
  const [publishStatus, setPublishStatus] = useState('')

  // Add a log utility
  const addLog = (text: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString()
    setConsoleLogs((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(), text, type, timestamp: time }
    ])
  }

  // --- Auto scroll console ---
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLogs])

  // --- Simulation Fall Loop (Physics Simulation for Anchored = false) ---
  useEffect(() => {
    if (simulationState === 'stop') return

    const interval = setInterval(() => {
      setNodes((prevNodes) => {
        let changed = false
        const updated = prevNodes.map((node) => {
          if (node.type === 'Part' && !node.anchored && node.id !== '2') {
            const [xStr, yStr, zStr] = node.position.split(',')
            const x = parseFloat(xStr) || 0
            const y = parseFloat(yStr) || 0
            const z = parseFloat(zStr) || 0
            
            // Fall until hit baseplate level (approx height Y=1)
            if (y > 1) {
              changed = true
              const newY = Math.max(1, y - 1.5)
              if (newY === 1) {
                addLog(`💥 [Physics]: Part "${node.name}" hit the baseplate.`, 'info')
              }
              return { ...node, position: `${x.toFixed(1)}, ${newY.toFixed(1)}, ${z.toFixed(1)}` }
            }
          }
          return node
        })
        return changed ? updated : prevNodes
      })
    }, 120)

    return () => clearInterval(interval)
  }, [simulationState])

  // Toggle visible panels
  const togglePanel = (panel: keyof PanelsVisibility) => {
    setPanelsVisibility((prev) => ({
      ...prev,
      [panel]: !prev[panel]
    }))
  }

  // --- Explorer manipulation ---
  const handleInsertPart = (type: 'Block' | 'Sphere' | 'Cylinder' | 'Wedge') => {
    const newId = (Date.now() + Math.floor(Math.random() * 100)).toString()
    const name = `${type}_${nodes.filter((n) => n.name.startsWith(type)).length + 1}`
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newPart: ExplorerNode = {
      id: newId,
      name,
      type: 'Part',
      parentId: '1', // Under Workspace
      position: `${(Math.random() * 20 - 10).toFixed(1)}, 12.0, ${(Math.random() * 20 - 10).toFixed(1)}`, // Spawn higher up
      size: type === 'Block' ? '4, 4, 4' : '3, 3, 3',
      anchored: false, // Default physics simulated!
      color: randomColor,
      material: 'Plastic'
    }

    setNodes((prev) => [...prev, newPart])
    setSelectedNodeId(newId)
    addLog(`➕ Created Part: workspace.${name} [Type: ${type}, Anchored: false]`, 'success')
  }

  const handleDeleteNode = (id: string) => {
    if (id === '1' || id === '2' || id === '3' || id === '5' || id === '6' || id === '7' || id === '8') {
      addLog(`⚠️ Cannot delete core Roblox Studio folders/parts: "${nodes.find(n => n.id === id)?.name}"`, 'warn')
      return
    }
    const nodeName = nodes.find(n => n.id === id)?.name || id
    setNodes((prev) => prev.filter((n) => n.id !== id))
    if (selectedNodeId === id) setSelectedNodeId('1')
    addLog(`❌ Deleted workspace.${nodeName}`, 'info')
  }

  // --- Properties manipulation ---
  const handlePropertyChange = (property: keyof ExplorerNode, value: any) => {
    if (!selectedNodeId) return
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === selectedNodeId) {
          const updated = { ...node, [property]: value }
          addLog(`🔧 [Property]: Set workspace.${node.name}.${String(property)} = ${value}`, 'info')
          return updated
        }
        return node
      })
    )
  }

  // --- Run Active Lua Script in Console ---
  const runLuaScript = () => {
    if (!activeScriptId) return
    const code = scriptContents[activeScriptId] || ''
    addLog(`📜 Running script: "${nodes.find(n => n.id === activeScriptId)?.name}"...`, 'info')

    // Parse simple Lua style commands
    const lines = code.split('\n')
    let outputCount = 0

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('--')) return // comments

      // Parse print("...")
      const printMatch = trimmed.match(/print\s*\(\s*["'](.*?)["']\s*\)/)
      if (printMatch) {
        addLog(`💬 [stdout]: ${printMatch[1]}`, 'success')
        outputCount++
      }

      // Parse warn("...")
      const warnMatch = trimmed.match(/warn\s*\(\s*["'](.*?)["']\s*\)/)
      if (warnMatch) {
        addLog(`⚠️ [stderr]: ${warnMatch[1]}`, 'warn')
        outputCount++
      }

      // Parse error("...")
      const errorMatch = trimmed.match(/error\s*\(\s*["'](.*?)["']\s*\)/)
      if (errorMatch) {
        addLog(`❌ [lua runtime]: ${errorMatch[1]}`, 'error')
        outputCount++
      }

      // Parse workspace.Baseplate.Material = "Neon"
      if (trimmed.includes('workspace.Baseplate.Material')) {
        const matMatch = trimmed.match(/workspace\.Baseplate\.Material\s*=\s*["'](.*?)["']/)
        if (matMatch) {
          const mat = matMatch[1] as any
          setNodes((prev) => prev.map((n) => (n.id === '2' ? { ...n, material: mat } : n)))
          addLog(`🔧 Script set baseplate.Material = ${mat}`, 'info')
        }
      }

      // Parse workspace.Baseplate.Color = "#..."
      if (trimmed.includes('workspace.Baseplate.Color')) {
        const colMatch = trimmed.match(/workspace\.Baseplate\.Color\s*=\s*["'](.*?)["']/)
        if (colMatch) {
          const col = colMatch[1]
          setNodes((prev) => prev.map((n) => (n.id === '2' ? { ...n, color: col } : n)))
          addLog(`🔧 Script set baseplate.Color = ${col}`, 'info')
        }
      }
    })

    if (outputCount === 0) {
      addLog(`Script executed cleanly (no print outputs)`, 'info')
    }
  }

  // --- Command Bar Parser ---
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandText.trim()) return

    const cmd = commandText.trim()
    addLog(`> ${cmd}`, 'info')
    setCommandText('')

    const lowerCmd = cmd.toLowerCase()

    if (lowerCmd === 'help') {
      addLog('💻 Available Command Bar Utilities:', 'info')
      addLog('  - help : Shows this reference manual', 'info')
      addLog('  - clear : Clears all terminal output logs', 'info')
      addLog('  - spawn("Block" | "Sphere" | "Cylinder" | "Wedge") : Spawns new 3D model', 'info')
      addLog('  - workspace.Baseplate.Anchored = false : Drops the floor with simulated physics gravity!', 'info')
      addLog('  - workspace.Baseplate.Color = "hex_color" : Updates baseplate color', 'info')
      return
    }

    if (lowerCmd === 'clear') {
      setConsoleLogs([])
      return
    }

    // Parse spawn("...")
    const spawnMatch = cmd.match(/spawn\s*\(\s*["'](.*?)["']\s*\)/i)
    if (spawnMatch) {
      const pType = spawnMatch[1].charAt(0).toUpperCase() + spawnMatch[1].slice(1).toLowerCase()
      if (['Block', 'Sphere', 'Cylinder', 'Wedge'].includes(pType)) {
        handleInsertPart(pType as any)
      } else {
        addLog(`❌ Unknown spawn part type: "${spawnMatch[1]}". Choose Block, Sphere, Cylinder, or Wedge.`, 'error')
      }
      return
    }

    // Parse workspace.Baseplate.Anchored = false
    if (cmd.replace(/\s+/g, '').includes('workspace.Baseplate.Anchored=false')) {
      setNodes((prev) => prev.map((n) => (n.id === '2' ? { ...n, anchored: false } : n)))
      addLog(`💥 Unanchored the floor! Baseplate is now subject to gravitational acceleration.`, 'warn')
      return
    }

    if (cmd.replace(/\s+/g, '').includes('workspace.Baseplate.Anchored=true')) {
      setNodes((prev) => prev.map((n) => (n.id === '2' ? { ...n, anchored: true } : n)))
      addLog(`⚓ Baseplate is now anchored firmly in spatial vector coordinate system.`, 'success')
      return
    }

    // Parse workspace.Baseplate.Color = "#hex"
    const colorMatch = cmd.match(/workspace\.Baseplate\.Color\s*=\s*["'](.*?)["']/i)
    if (colorMatch) {
      const colorHex = colorMatch[1]
      setNodes((prev) => prev.map((n) => (n.id === '2' ? { ...n, color: colorHex } : n)))
      addLog(`🎨 Baseplate color updated to ${colorHex}`, 'success')
      return
    }

    addLog(`❌ Unrecognized workspace command string. Type "help" for a manual list.`, 'error')
  }

  // --- Viewport Move drag / arrow click increments ---
  const handleViewportTranslate = (axis: 'X' | 'Y' | 'Z', amount: number) => {
    if (!selectedNodeId) return
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === selectedNodeId) {
          const parts = node.position.split(',').map((p) => parseFloat(p.trim()) || 0)
          if (axis === 'X') parts[0] += amount
          if (axis === 'Y') parts[1] += amount
          if (axis === 'Z') parts[2] += amount
          const newPos = `${parts[0].toFixed(1)}, ${parts[1].toFixed(1)}, ${parts[2].toFixed(1)}`
          return { ...node, position: newPos }
        }
        return node
      })
    )
  }

  // --- Handle Map Publish Modal Submission (Supabase integration!) ---
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!publishTitle || !publishThumbnail || !publishModel) {
      setPublishStatus('⚠️ Please fill out all fields and attach both files.')
      return
    }

    setPublishUploading(true)
    setPublishStatus('Publishing assets to Supabase storage buckets...')

    try {
      // 1. Upload Thumbnail Image to the 'game-assets' bucket
      const thumbExt = publishThumbnail.name.split('.').pop()
      const thumbPath = `thumbnails/${Date.now()}_${Math.random().toString(36).substring(7)}.${thumbExt}`

      const { error: thumbError } = await supabase.storage
        .from('game-assets')
        .upload(thumbPath, publishThumbnail)

      if (thumbError) throw thumbError

      // 2. Upload 3D Model (.glb) to the 'game-assets' bucket
      setPublishStatus('Uploading 3D Model GLTF to cloud...')
      const modelPath = `models/${Date.now()}_${Math.random().toString(36).substring(7)}.glb`

      const { error: modelError } = await supabase.storage
        .from('game-assets')
        .upload(modelPath, publishModel)

      if (modelError) throw modelError

      // 3. Get Public URLs for both files
      const thumbUrl = supabase.storage.from('game-assets').getPublicUrl(thumbPath).data.publicUrl
      const modelUrl = supabase.storage.from('game-assets').getPublicUrl(modelPath).data.publicUrl

      // 4. Save to Database (game_maps table)
      setPublishStatus('Publishing model entity metadata to game_maps database table...')

      const { data: { session } } = await supabase.auth.getSession()

      const { error: dbError } = await supabase
        .from('game_maps')
        .insert([{
          title: publishTitle,
          thumbnail_url: thumbUrl,
          model_url: modelUrl,
          creator_id: session?.user?.id || null
        }])

      if (dbError) throw dbError

      // Reset publish modal fields
      setPublishStatus('✅ Success! Model successfully registered in Database network.')
      addLog(`✨ Published custom model map: "${publishTitle}"`, 'success')

      // Reset states
      setPublishTitle('')
      setPublishThumbnail(null)
      setPublishModel(null)

      setTimeout(() => {
        setIsPublishModalOpen(false)
        setPublishStatus('')
      }, 1500)

    } catch (error: any) {
      console.error('Publishing failed:', error)
      const errText = error instanceof Error ? error.message : 'An unknown error occurred during upload.'
      setPublishStatus(`❌ Error: ${errText}`)
      addLog(`⚠️ Map publication failed: ${errText}`, 'error')
    } finally {
      setPublishUploading(false)
    }
  }

  // Render Explorer Nodes Recursively (nested list)
  const renderExplorerNodes = (parentId: string | null, depth = 0) => {
    const children = nodes.filter((n) => n.parentId === parentId)
    return children.map((node) => {
      const hasChildren = nodes.some((n) => n.parentId === node.id)
      const isSelected = selectedNodeId === node.id

      return (
        <div key={node.id} className="flex flex-col">
          <div
            onClick={() => setSelectedNodeId(node.id)}
            onDoubleClick={() => {
              if (node.type === 'Script') {
                setActiveScriptId(node.id)
                if (!scriptContents[node.id]) {
                  setScriptContents(prev => ({
                    ...prev,
                    [node.id]: `-- Script: ${node.name}\nprint("${node.name} executing...")\n`
                  }))
                }
                setPanelsVisibility(prev => ({ ...prev, codeEditor: true }))
                addLog(`📂 Opened script window for workspace.${node.name}`, 'info')
              }
            }}
            className={`flex items-center justify-between px-2 py-1 cursor-pointer transition text-xs select-none ${
              isSelected ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 truncate">
              {node.type === 'Folder' && <span className="text-amber-500 text-xs">📁</span>}
              {node.type === 'Part' && <span className="text-blue-400 text-xs">🧱</span>}
              {node.type === 'Script' && <span className="text-purple-400 text-xs">📜</span>}
              {node.type === 'SpawnLocation' && <span className="text-emerald-400 text-xs">🏁</span>}
              <span className="truncate">{node.name}</span>
            </div>

            {/* Quick delete action for added blocks */}
            {node.id !== '1' && node.id !== '2' && node.id !== '3' && node.id !== '5' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteNode(node.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 text-slate-500 rounded transition"
                title="Delete item"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          {hasChildren && renderExplorerNodes(node.id, depth + 1)}
        </div>
      )
    })
  }

  // Filter console logs
  const filteredConsoleLogs = consoleLogs.filter((log) => {
    if (consoleFilter === 'all') return true
    return log.type === consoleFilter
  })

  // Selected item reference details
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
      
      {/* 1. Main Toolbar ribbon */}
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        simulationState={simulationState}
        setSimulationState={(state) => {
          setSimulationState(state)
          addLog(`🎮 Simulation state set to: ${state.toUpperCase()}`, 'info')
        }}
        panelsVisibility={panelsVisibility}
        togglePanel={togglePanel}
        onPublishClick={() => setIsPublishModalOpen(true)}
        onInsertPart={handleInsertPart}
        gridSnapping={gridSnapping}
        setGridSnapping={setGridSnapping}
        snapSize={snapSize}
        setSnapSize={setSnapSize}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Vertical Tools Icon dock */}
        <Sidebar
          panelsVisibility={panelsVisibility}
          togglePanel={togglePanel}
          activeSubPanel={activeLeftTab}
          setActiveSubPanel={setActiveLeftTab}
        />

        {/* Toolbox panel inside workspace */}
        {panelsVisibility.toolbox && activeLeftTab === 'toolbox' && (
          <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <span className="text-xs font-bold text-slate-300">INSERT FROM TOOLBOX</span>
              <button onClick={() => togglePanel('toolbox')} className="text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            </div>
            
            {/* Simple searchable assets */}
            <div className="p-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Models..."
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
              </div>
            </div>

            {/* Grid assets list */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
              {[
                { name: 'Cyberpunk Tower', type: 'Block', icon: '🗼', color: '#a855f7' },
                { name: 'Sci-Fi Spawn Pad', type: 'Sphere', icon: '🌌', color: '#06b6d4' },
                { name: 'Pine Tree', type: 'Cylinder', icon: '🌲', color: '#22c55e' },
                { name: 'Industrial Crate', type: 'Block', icon: '📦', color: '#b45309' },
                { name: 'Laser Turret', type: 'Cylinder', icon: '🔫', color: '#ef4444' },
                { name: 'Concrete Wedge', type: 'Wedge', icon: '📐', color: '#64748b' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const newId = (Date.now() + Math.floor(Math.random() * 100)).toString()
                    const newPart: ExplorerNode = {
                      id: newId,
                      name: item.name.replace(/\s+/g, ''),
                      type: 'Part',
                      parentId: '1',
                      position: `${(Math.random() * 16 - 8).toFixed(1)}, 14.0, ${(Math.random() * 16 - 8).toFixed(1)}`,
                      size: '5, 5, 5',
                      anchored: false,
                      color: item.color,
                      material: 'Slate'
                    }
                    setNodes((prev) => [...prev, newPart])
                    setSelectedNodeId(newId)
                    addLog(`📦 Spawning asset from Toolbox: "${item.name}" into Workspace`, 'success')
                  }}
                  className="bg-slate-950 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center transition text-center group cursor-pointer"
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                  <span className="text-[10px] font-semibold text-slate-300 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {item.name}
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase mt-0.5">{item.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Center Panel (3D Viewport + Bottom Script/Console logs) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          
          {/* A. Interactive 3D Viewport Grid Canvas (SVG Based) */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col border-b border-slate-900 group">
            {/* Skybox & Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-950 to-indigo-950/20 pointer-events-none" />

            {/* Floating Info Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 font-mono flex items-center gap-3 z-20 backdrop-blur-sm shadow-xl">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                WebGL ACTIVE
              </span>
              <span>GRID: {gridSnapping ? `${snapSize} Studs` : 'OFF'}</span>
              <span>CAM: Orbit [R-Drag]</span>
            </div>

            {/* Simulation mode warning banner */}
            {simulationState !== 'stop' && (
              <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded font-bold animate-pulse z-20 uppercase tracking-widest">
                ⚙️ physics simulation {simulationState}
              </div>
            )}

            {/* SVG Interactive Canvas */}
            <svg
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
              viewBox="-50 -30 100 60"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Skybox glowing sun */}
              <circle cx="0" cy="-20" r="12" className="fill-slate-800/30 blur-xl" />
              <circle cx="0" cy="-20" r="2" className="fill-amber-400/20" />

              {/* Coordinate Grid Planes */}
              <g transform="translate(0, 15) rotateX(60)">
                {/* 3D stylized Grid Floor Lines */}
                {Array.from({ length: 21 }).map((_, idx) => {
                  const val = (idx - 10) * 4
                  return (
                    <g key={idx}>
                      {/* Grid X direction */}
                      <line x1={val} y1="-40" x2={val} y2="40" className="stroke-slate-800/40" strokeWidth="0.1" />
                      {/* Grid Z direction */}
                      <line x1="-40" y1={val} x2="40" y2={val} className="stroke-slate-800/40" strokeWidth="0.1" />
                    </g>
                  )
                })}
              </g>

              {/* 3D Visualized Entities from nodes state */}
              {nodes.map((node) => {
                if (node.id === '1' || node.type === 'Script' || node.type === 'Folder') return null

                // Parse positions
                const [xStr, yStr, zStr] = node.position.split(',')
                const px = parseFloat(xStr) || 0
                const py = parseFloat(yStr) || 0
                const pz = parseFloat(zStr) || 0

                // Project 3D-ish isometric representation onto 2D SVG
                // Isometric formula: screenX = x - z, screenY = (x + z)/2 - y
                const projX = px - pz
                const projY = (px + pz) * 0.4 - py * 1.2 + 8 // 1.2 factor for height

                const isSelected = selectedNodeId === node.id

                // Determine material classes
                const isNeon = node.material === 'Neon'
                const isGlass = node.material === 'Glass'

                if (node.id === '2') {
                  // Wide Baseplate
                  return (
                    <g key={node.id} onClick={() => setSelectedNodeId('2')}>
                      {/* Baseplate visual representation */}
                      <polygon
                        points="-40,14 40,14 0,30 -0,30"
                        className="transition-all duration-150"
                        fill={node.color || '#1e293b'}
                        stroke={isSelected ? '#f59e0b' : '#334155'}
                        strokeWidth={isSelected ? '0.5' : '0.1'}
                        opacity="0.85"
                      />
                    </g>
                  )
                }

                if (node.type === 'SpawnLocation') {
                  return (
                    <g key={node.id} onClick={() => setSelectedNodeId(node.id)} className="cursor-pointer">
                      {/* Spawn location plate */}
                      <ellipse
                        cx={projX}
                        cy={projY}
                        rx="5"
                        ry="2"
                        fill={node.color || '#10b981'}
                        stroke={isSelected ? '#f59e0b' : '#059669'}
                        strokeWidth={isSelected ? '0.4' : '0.15'}
                        className={isNeon ? 'filter drop-shadow-[0_0_8px_#10b981]' : ''}
                      />
                      {/* Spawn decal arrow/star */}
                      <polygon
                        points={`${projX},${projY - 0.5} ${projX + 1},${projY + 0.3} ${projX - 1},${projY + 0.3}`}
                        fill="#ffffff"
                        opacity="0.9"
                      />
                    </g>
                  )
                }

                // Ordinary block elements
                return (
                  <g key={node.id} onClick={() => setSelectedNodeId(node.id)} className="cursor-pointer group/part">
                    {/* Glowing highlight aura if selected */}
                    {isSelected && (
                      <ellipse
                        cx={projX}
                        cy={projY + 1}
                        rx="4.5"
                        ry="2.5"
                        fill="none"
                        stroke="#f59e0b"
                        strokeDasharray="1, 1"
                        strokeWidth="0.3"
                        className="animate-spin duration-[8s]"
                      />
                    )}

                    {/* Left Face */}
                    <polygon
                      points={`${projX - 2.5},${projY} ${projX},${projY + 1.2} ${projX},${projY - 2.8} ${projX - 2.5},${projY - 4}`}
                      fill={node.color || '#3b82f6'}
                      filter="brightness(0.85)"
                      opacity={isGlass ? '0.6' : '1'}
                      className={isNeon ? 'filter drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]' : ''}
                    />
                    {/* Right Face */}
                    <polygon
                      points={`${projX},${projY + 1.2} ${projX + 2.5},${projY} ${projX + 2.5},${projY - 4} ${projX},${projY - 2.8}`}
                      fill={node.color || '#3b82f6'}
                      filter="brightness(0.7)"
                      opacity={isGlass ? '0.6' : '1'}
                    />
                    {/* Top Face */}
                    <polygon
                      points={`${projX - 2.5},${projY - 4} ${projX},${projY - 2.8} ${projX + 2.5},${projY - 4} ${projX},${projY - 5.2}`}
                      fill={node.color || '#3b82f6'}
                      filter="brightness(1.05)"
                      stroke={isSelected ? '#f59e0b' : 'none'}
                      strokeWidth="0.25"
                      opacity={isGlass ? '0.6' : '1'}
                    />

                    {/* Standard translation handles visible only if selected & move tool active */}
                    {isSelected && activeTool === 'move' && (
                      <g>
                        {/* Y axis arrow (Green) */}
                        <line x1={projX} y1={projY - 3} x2={projX} y2={projY - 11} stroke="#10b981" strokeWidth="0.45" />
                        <polygon points={`${projX},${projY - 12.5} ${projX - 0.6},${projY - 10.8} ${projX + 0.6},${projY - 10.8}`} fill="#10b981" />
                        {/* Quick translate increment clickable triggers */}
                        <circle cx={projX} cy={projY - 12} r="1.5" fill="#10b981" opacity="0" className="hover:opacity-40 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewportTranslate('Y', snapSize) }} />

                        {/* X axis arrow (Red) */}
                        <line x1={projX} y1={projY - 3} x2={projX + 7} y2={projY - 1} stroke="#ef4444" strokeWidth="0.45" />
                        <polygon points={`${projX + 8.2},${projY - 0.5} ${projX + 6.8},${projY - 1.8} ${projX + 6.8},${projY - 0.2}`} fill="#ef4444" />
                        <circle cx={projX + 7.5} cy={projY - 0.8} r="1.5" fill="#ef4444" opacity="0" className="hover:opacity-40 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewportTranslate('X', snapSize) }} />

                        {/* Z axis arrow (Blue) */}
                        <line x1={projX} y1={projY - 3} x2={projX - 7} y2={projY - 1} stroke="#3b82f6" strokeWidth="0.45" />
                        <polygon points={`${projX - 8.2},${projY - 0.5} ${projX - 6.8},${projY - 0.2} ${projX - 6.8},${projY - 1.8}`} fill="#3b82f6" />
                        <circle cx={projX - 7.5} cy={projY - 0.8} r="1.5" fill="#3b82f6" opacity="0" className="hover:opacity-40 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleViewportTranslate('Z', snapSize) }} />
                      </g>
                    )}

                    {/* Scale handles - small yellow anchor points */}
                    {isSelected && activeTool === 'scale' && (
                      <g>
                        <circle cx={projX - 2.5} cy={projY - 2} r="0.4" fill="#f59e0b" />
                        <circle cx={projX + 2.5} cy={projY - 2} r="0.4" fill="#f59e0b" />
                        <circle cx={projX} cy={projY - 4.5} r="0.4" fill="#f59e0b" />
                      </g>
                    )}

                    {/* Floating material textures indicator */}
                    {node.material !== 'Plastic' && (
                      <text x={projX - 2} y={projY - 5.5} className="fill-slate-400 text-[1.8px] font-mono pointer-events-none uppercase">
                        {node.material}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Quick-Access Spawning Pad HUD */}
            <div className="absolute bottom-3 left-3 flex gap-1 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 backdrop-blur-sm z-20">
              <button
                onClick={() => handleInsertPart('Block')}
                className="p-1 px-2.5 bg-slate-850 hover:bg-slate-700 hover:text-white rounded text-[10px] flex items-center gap-1 transition"
                title="Spawn Box Part"
              >
                <span>🧱</span> Block
              </button>
              <button
                onClick={() => handleInsertPart('Sphere')}
                className="p-1 px-2.5 bg-slate-850 hover:bg-slate-700 hover:text-white rounded text-[10px] flex items-center gap-1 transition"
                title="Spawn Ball Part"
              >
                <span>🟢</span> Sphere
              </button>
            </div>
          </div>

          {/* B. Tabbed Code Editor & Output Console (Center Bottom Panel) */}
          <div className="h-64 bg-slate-950 border-t border-slate-900 flex flex-col overflow-hidden relative">
            
            {/* Tabs control bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between h-9 shrink-0">
              <div className="flex items-center space-x-1 h-full">
                {panelsVisibility.codeEditor && activeScriptId && (
                  <button
                    onClick={() => setPanelsVisibility((p) => ({ ...p, codeEditor: true }))}
                    className="h-full px-4 text-xs font-semibold flex items-center gap-2 border-t-2 border-purple-500 bg-slate-950 text-white"
                  >
                    <Code2 size={13} className="text-purple-400" />
                    <span>{nodes.find(n => n.id === activeScriptId)?.name || 'Script.lua'}</span>
                  </button>
                )}

                <button
                  onClick={() => togglePanel('console')}
                  className={`h-full px-4 text-xs font-semibold flex items-center gap-2 border-t-2 transition-all ${
                    panelsVisibility.console
                      ? 'border-amber-500 bg-slate-950 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal size={12} className="text-amber-400" />
                  <span>Output Console</span>
                </button>
              </div>

              {/* Action buttons on the right side */}
              <div className="flex items-center gap-2">
                {panelsVisibility.codeEditor && activeScriptId && (
                  <button
                    onClick={runLuaScript}
                    className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded text-[11px] font-bold text-white transition active:scale-95 shadow-md"
                    title="Parse and execute current Lua commands"
                  >
                    <Play size={10} className="fill-white" />
                    Run Script
                  </button>
                )}
                <button
                  onClick={() => {
                    setScriptContents({
                      '4': `-- Reset standard script\nprint("Script contents updated!")\nworkspace.Baseplate.Color = "#0f172a"\n`
                    })
                    addLog('🧹 Script workspace reset to default values.', 'info')
                  }}
                  className="text-slate-500 hover:text-slate-300 text-[10px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Split windows / Single Window viewport depending on selection */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Lua Script Editor pane */}
              {panelsVisibility.codeEditor && activeScriptId ? (
                <div className="flex-1 flex flex-col border-r border-slate-900 bg-slate-950">
                  <div className="p-1 px-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">NotBlox LUA Compiler (Mock)</span>
                    <button
                      onClick={() => {
                        setActiveScriptId(null)
                        setPanelsVisibility((p) => ({ ...p, codeEditor: false }))
                      }}
                      className="text-slate-600 hover:text-slate-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  <textarea
                    value={scriptContents[activeScriptId] || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setScriptContents((prev) => ({
                        ...prev,
                        [activeScriptId]: val
                      }))
                    }}
                    className="flex-1 w-full bg-slate-950 text-slate-300 p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed selection:bg-purple-600/30"
                    placeholder="-- Type your server scripts here"
                    spellCheck={false}
                  />
                </div>
              ) : null}

              {/* Output Console Pane */}
              {panelsVisibility.console ? (
                <div className="flex-1 flex flex-col bg-slate-950">
                  
                  {/* Console filter header */}
                  <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-900 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-slate-500 font-bold">FILTERS:</span>
                      {(['all', 'info', 'warn', 'error', 'success'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setConsoleFilter(f)}
                          className={`px-1.5 py-0.5 rounded uppercase font-semibold ${
                            consoleFilter === f
                              ? 'bg-slate-800 text-amber-400 border border-slate-700'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setConsoleLogs([])}
                      className="text-[9px] uppercase font-bold text-slate-500 hover:text-slate-300"
                    >
                      Clear Logs
                    </button>
                  </div>

                  {/* Log list */}
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin">
                    {filteredConsoleLogs.length === 0 ? (
                      <p className="text-slate-600 text-center py-6">-- Console output stream empty --</p>
                    ) : (
                      filteredConsoleLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2">
                          <span className="text-slate-600 text-[10px] shrink-0">{log.timestamp}</span>
                          <span
                            className={`break-all ${
                              log.type === 'error'
                                ? 'text-red-400 font-semibold'
                                : log.type === 'warn'
                                ? 'text-amber-400 font-semibold'
                                : log.type === 'success'
                                ? 'text-emerald-400 font-semibold'
                                : 'text-slate-300'
                            }`}
                          >
                            {log.text}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={consoleEndRef} />
                  </div>

                  {/* Interactive Command Bar */}
                  <form
                    onSubmit={handleCommandSubmit}
                    className="p-1 px-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
                  >
                    <span className="text-amber-500 font-bold font-mono text-xs select-none">&gt;</span>
                    <input
                      type="text"
                      value={commandText}
                      onChange={(e) => setCommandText(e.target.value)}
                      placeholder="Execute command... (e.g. spawn('Block') or clear)"
                      className="flex-1 bg-transparent text-slate-200 text-xs font-mono focus:outline-none placeholder-slate-600"
                    />
                    <button type="submit" className="text-slate-500 hover:text-amber-400 transition">
                      <Send size={13} />
                    </button>
                  </form>

                </div>
              ) : null}

            </div>
          </div>
        </div>

        {/* Right Side Dock (Explorer & Properties Inspectors) */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden shrink-0 z-20">
          
          {/* A. EXPLORER HIERARCHICAL TREE (Right Top) */}
          {panelsVisibility.explorer && (
            <div className="flex-1 flex flex-col border-b border-slate-800 overflow-hidden">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <FolderTree size={14} className="text-amber-400" />
                  <span>WORKSPACE EXPLORER</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleInsertPart('Block')}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition"
                    title="Insert Block Part"
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    onClick={() => togglePanel('explorer')}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Search tree query */}
              <div className="p-2 border-b border-slate-800/80">
                <input
                  type="text"
                  placeholder="Filter elements..."
                  className="w-full bg-slate-950 border border-slate-800 text-[11px] rounded px-2.5 py-1 text-slate-400 focus:outline-none"
                />
              </div>

              {/* Tree body */}
              <div className="flex-1 overflow-y-auto py-2">
                <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Game Hierarchy
                </div>
                {renderExplorerNodes(null)}
              </div>
            </div>
          )}

          {/* B. PROPERTIES INSPECTOR (Right Bottom) */}
          {panelsVisibility.properties && (
            <div className="h-80 flex flex-col overflow-hidden bg-slate-900">
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
                    <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1 rounded uppercase tracking-wider inline-block mt-1">
                      Class: {selectedNode.type}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Name input */}
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">NAME</label>
                      <input
                        type="text"
                        value={selectedNode.name}
                        onChange={(e) => handlePropertyChange('name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Standard Part properties */}
                    {selectedNode.type !== 'Folder' && selectedNode.type !== 'Script' && (
                      <>
                        {/* Position input */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">POSITION (X, Y, Z)</label>
                          <input
                            type="text"
                            value={selectedNode.position}
                            onChange={(e) => handlePropertyChange('position', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Size input */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">SIZE (Width, Height, Depth)</label>
                          <input
                            type="text"
                            value={selectedNode.size}
                            onChange={(e) => handlePropertyChange('size', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Anchored boolean */}
                        <div className="flex items-center justify-between py-1 border-b border-slate-850">
                          <span className="text-[10px] text-slate-500">ANCHORED</span>
                          <input
                            type="checkbox"
                            checked={selectedNode.anchored}
                            onChange={(e) => {
                              handlePropertyChange('anchored', e.target.checked)
                              if (!e.target.checked) {
                                addLog(`💥 Part "${selectedNode.name}" unanchored! Simulating physics gravity.`, 'warn')
                              }
                            }}
                            className="accent-amber-500 h-4 w-4 bg-slate-950 cursor-pointer"
                          />
                        </div>

                        {/* Color Input */}
                        <div>
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

                        {/* Material Dropdown */}
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">MATERIAL</label>
                          <select
                            value={selectedNode.material}
                            onChange={(e) => handlePropertyChange('material', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white text-xs focus:outline-none"
                          >
                            <option value="Plastic">Plastic</option>
                            <option value="Wood">Wood</option>
                            <option value="Slate">Slate</option>
                            <option value="Neon">Neon</option>
                            <option value="Glass">Glass</option>
                          </select>
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
          )}

        </div>

      </div>

      {/* ================= 3. PUBLISH NEW MAP MODAL OVERLAY ================= */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full relative">
            
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-amber-400 uppercase tracking-wide">Publish Map Network</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Registers model properties into game_maps database</p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Same Upload form as studio/page.tsx */}
            <form onSubmit={handlePublishSubmit} className="space-y-4 text-xs">
              
              {/* Map Title input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Map Name</label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="e.g. Cyber City Arena"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 transition text-xs"
                  disabled={publishUploading}
                />
              </div>

              {/* Thumbnail image upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Thumbnail Image (.jpg, .png)</label>
                <div className="relative flex items-center border-2 border-dashed border-slate-800 rounded-xl p-3 bg-slate-950/50 hover:border-amber-400 transition cursor-pointer">
                  <ImageIcon size={20} className="text-slate-500 mr-2.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPublishThumbnail(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={publishUploading}
                  />
                  <span className="text-[11px] text-slate-400 truncate">
                    {publishThumbnail ? publishThumbnail.name : 'Tap to select an image...'}
                  </span>
                </div>
              </div>

              {/* Model .glb upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">3D Environment (.glb)</label>
                <div className="relative flex items-center border-2 border-dashed border-slate-800 rounded-xl p-3 bg-slate-950/50 hover:border-amber-400 transition cursor-pointer">
                  <Box size={20} className="text-slate-500 mr-2.5" />
                  <input
                    type="file"
                    accept=".glb"
                    onChange={(e) => setPublishModel(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={publishUploading}
                  />
                  <span className="text-[11px] text-slate-400 truncate">
                    {publishModel ? publishModel.name : 'Tap to select a .glb file...'}
                  </span>
                </div>
              </div>

              {/* Status alerts */}
              {publishStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium leading-relaxed border ${
                    publishStatus.includes('❌') || publishStatus.includes('⚠️')
                      ? 'bg-red-950/40 text-red-400 border-red-900/50'
                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  }`}
                >
                  {publishStatus}
                </div>
              )}

              {/* Modal buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 font-bold py-3 rounded-xl transition text-slate-300"
                  disabled={publishUploading}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={publishUploading}
                  className="flex-1 bg-amber-500 text-black font-extrabold py-3 rounded-xl flex justify-center items-center gap-1.5 hover:bg-amber-400 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishUploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      UPLOADING...
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      PUBLISH MAP
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
