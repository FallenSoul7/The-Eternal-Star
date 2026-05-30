'use client'

import React from 'react'

export default function LuaSandbox() {
  return (
    <div className="p-3 bg-slate-950 border-t border-slate-800 h-24 overflow-y-auto">
      <div className="text-[10px] text-slate-500 mb-1">COMPILER LOGS</div>
      <div className="text-[11px] font-mono text-slate-400">
        <p>> Initializing Luau VM...</p>
        <p>> Environment Ready.</p>
      </div>
    </div>
  )
}
