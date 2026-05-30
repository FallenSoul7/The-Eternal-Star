'use client'

import React from 'react'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onAction: (action: string) => void
}

export default function ContextMenu({ x, y, onClose, onAction }: ContextMenuProps) {
  return (
    <div 
      className="fixed bg-slate-900 border border-slate-700 shadow-xl rounded-md z-50 text-xs w-32 py-1"
      style={{ top: y, left: x }}
      onMouseLeave={onClose}
    >
      {['Duplicate', 'Delete', 'Rename'].map((action) => (
        <button 
          key={action}
          onClick={() => { onAction(action); onClose(); }}
          className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-400"
        >
          {action}
        </button>
      ))}
    </div>
  )
}
