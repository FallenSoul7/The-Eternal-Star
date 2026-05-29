'use client'

import React from 'react'

interface GizmoProps {
  position: { x: number; y: number }
  activeTool: 'move' | 'scale' | 'rotate' | 'select'
}

export default function TransformGizmo({ position, activeTool }: GizmoProps) {
  if (activeTool === 'select') return null

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <circle r="1" className="fill-transparent stroke-white stroke-[0.2]" />
      <line x1="0" y1="0" x2="3" y2="0" className="stroke-red-500 stroke-[0.3]" />
      <line x1="0" y1="0" x2="0" y2="-3" className="stroke-green-500 stroke-[0.3]" />
      <circle cx="3" cy="0" r="0.5" className="fill-red-500" />
      <circle cx="0" cy="-3" r="0.5" className="fill-green-500" />
    </g>
  )
}
