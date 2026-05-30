'use client'

import React from 'react'

export default function GridFloor() {
  return (
    <g className="grid-floor" opacity="0.3">
      {/* Horizontal and Vertical Grid Lines */}
      {Array.from({ length: 21 }).map((_, i) => (
        <React.Fragment key={i}>
          <line x1={-50 + i * 5} y1="-50" x2={-50 + i * 5} y2="50" stroke="#475569" strokeWidth="0.1" />
          <line x1="-50" y1={-50 + i * 5} x2="50" y2={-50 + i * 5} stroke="#475569" strokeWidth="0.1" />
        </React.Fragment>
      ))}
    </g>
  )
}
