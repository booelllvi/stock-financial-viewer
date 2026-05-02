'use client'

import { useEffect, useRef } from 'react'

interface StockChartProps {
  symbol: string
}

export default function StockChart({ symbol }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    // Clear previous widget
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
    wrapper.style.height = 'calc(100% - 0px)'
    wrapper.style.width = '100%'
    wrapper.style.position = 'absolute'
    wrapper.style.top = '0'
    wrapper.style.left = '0'

    containerRef.current.style.position = 'relative'
    containerRef.current.appendChild(wrapper)
    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div className="glass w-full overflow-hidden">
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-bold tracking-wide" style={{ color: 'rgba(0,0,0,0.8)' }}>
          {symbol} — Technical Chart
        </h2>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: '600px', width: '100%', position: 'relative' }}
      />
    </div>
  )
}
