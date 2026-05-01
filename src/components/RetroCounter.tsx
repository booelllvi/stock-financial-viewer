'use client'

import { useState, useEffect } from 'react'

/** Single LCD digit */
function LcdDigit({ digit }: { digit: string }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: '22px',
        height: '32px',
        background: '#0a0a0a',
        borderRadius: '2px',
        fontFamily: '"Courier New", monospace',
        fontSize: '22px',
        fontWeight: 900,
        color: '#33ff33',
        textShadow: '0 0 8px rgba(51,255,51,0.6), 0 0 2px rgba(51,255,51,0.9)',
        letterSpacing: '0',
        border: '1px solid #222',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
      }}
    >
      {digit}
    </span>
  )
}

export default function RetroCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const sessionCounted = sessionStorage.getItem('retro_counted')
    if (!sessionCounted) {
      // New session — increment server counter
      fetch('/api/counter', { method: 'POST' })
        .then((r) => r.json())
        .then((d) => {
          setCount(d.count)
          sessionStorage.setItem('retro_counted', '1')
        })
        .catch(() => setCount(0))
    } else {
      // Already counted this session — just read
      fetch('/api/counter')
        .then((r) => r.json())
        .then((d) => setCount(d.count))
        .catch(() => setCount(0))
    }
  }, [])

  if (count === null) return null

  const digits = String(count).padStart(6, '0').split('')

  return (
    <div
      className="flex flex-col items-center gap-1.5 py-3 px-5 rounded-xl select-none"
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
        border: '1px solid #333',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <span
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: '9px',
          fontWeight: 700,
          color: '#666',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        Total Visits
      </span>

      <div className="flex gap-[2px]">
        {digits.map((d, i) => (
          <LcdDigit key={i} digit={d} />
        ))}
      </div>

      <span
        style={{
          fontFamily: '"Comic Sans MS", "Courier New", monospace',
          fontSize: '8px',
          color: '#555',
          letterSpacing: '0.5px',
        }}
      >
        You are visitor #{count.toLocaleString()}
      </span>
    </div>
  )
}
