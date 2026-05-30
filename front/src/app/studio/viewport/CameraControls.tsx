'use client'

import React from 'react'
import { RotateCcw, Maximize } from 'lucide-react'

export default function CameraControls() {
  return (
    <div className="absolute bottom-4 right-4 flex gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800 backdrop-blur-sm">
      <button className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Reset Camera">
        <RotateCcw size={16} />
      </button>
      <button className="p-2 hover:bg-slate-800 rounded text-slate-400" title="Fit to View">
        <Maximize size={16} />
      </button>
    </div>
  )
}
