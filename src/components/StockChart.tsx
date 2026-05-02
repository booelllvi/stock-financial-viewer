'use client'

import { useEffect, useRef, useState } from 'react'

interface StockChartProps {
  symbol: string
}

const HEIGHT_PRESETS = [
  { label: 'S', px: 400 },
  { label: 'M', px: 600 },
  { label: 'L', px: 800 },
  { label: 'XL', px: 1000 },
]

export default function StockChart({ symbol }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(600)
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
      studies: ['STD;EMA'],
    })

    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container__widget'
    wrapper.style.height = '100%'
    wrapper.style.width = '100%'
    wrapper.style.position = 'absolute'
    wrapper.style.top = '0'
    wrapper.style.left = '0'

    containerRef.current.style.position = 'relative'
    containerRef.current.appendChild(wrapper)
    containerRef.current.appendChild(script)
  }, [symbol])

  // Drag-to-resize handlers
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStartY.current = e.clientY
    dragStartH.current = height
    setDragging(true)

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - dragStartY.current
      setHeight(Math.max(300, Math.min(1400, dragStartH.current + delta)))
    }
    const onUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="glass w-full overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-3"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-bold tracking-wide" style={{ color: 'rgba(0,0,0,0.8)' }}>
          {symbol} — Technical Chart
        </h2>

        {/* Height presets */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs mr-1" style={{ color: 'rgba(0,0,0,0.35)' }}>{height}px</span>
          {HEIGHT_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setHeight(p.px)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={
                height === p.px
                  ? { background: '#0071e3', color: 'white', border: '1px solid #0071e3' }
                  : { background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,0,0,0.08)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: `${height}px`, width: '100%', position: 'relative' }}
      />

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="flex items-center justify-center py-1.5 select-none"
        style={{
          cursor: 'ns-resize',
          background: dragging ? 'rgba(0,113,227,0.06)' : 'rgba(0,0,0,0.02)',
          borderTop: '1px solid rgba(0,0,0,0.07)',
        }}
        title="Drag to resize"
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: dragging ? '#0071e3' : 'rgba(0,0,0,0.15)',
            transition: 'background 0.15s',
          }}
        />
      </div>
    </div>
  )
}
