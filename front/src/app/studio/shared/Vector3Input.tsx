'use client'

import React from 'react'

interface Vector3InputProps {
  label: string
  value: string
  onChange: (val: string) => void
}

export default function Vector3Input({ label, value, onChange }: Vector3InputProps) {
  return (
    <div className="mb-2">
      <label className="text-[10px] text-slate-500 block mb-0.5">{label}</label>
      <div className="flex gap-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <input
            key={axis}
            type="number"
            className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center text-[11px] text-slate-200 focus:border-amber-400 outline-none"
            placeholder={axis}
          />
        ))}
      </div>
    </div>
  )
}
