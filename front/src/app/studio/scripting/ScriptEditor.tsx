'use client'

import React, { useState } from 'react'
import { Code, Play, X } from 'lucide-react'

export default function ScriptEditor() {
  const [code, setCode] = useState("-- Welcome to Eternal Studio\nlocal part = Instance.new('Part')\npart.Parent = workspace")

  return (
    <div className="h-48 border-t border-slate-800 bg-slate-950 flex flex-col">
      <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Code size={14} className="text-amber-400" />
          <span>SCRIPT EDITOR</span>
        </div>
        <button className="flex items-center gap-1 bg-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold text-white hover:bg-emerald-500">
          <Play size={10} /> RUN
        </button>
      </div>
      <textarea
        className="flex-1 w-full bg-slate-950 p-3 text-xs font-mono text-emerald-400 focus:outline-none resize-none"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck="false"
      />
    </div>
  )
}
