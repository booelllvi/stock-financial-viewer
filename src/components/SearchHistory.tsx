'use client'

import { useState, useEffect } from 'react'
import { getHistory, clearHistory, type HistoryEntry } from '@/lib/history'

interface SearchHistoryProps {
  onSelect: (entry: HistoryEntry) => void
  refreshKey: number
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function SearchHistory({ onSelect, refreshKey }: SearchHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHistory(getHistory())
    setMounted(true)
  }, [refreshKey])

  if (!mounted || history.length === 0) return null

  return (
    <div className="w-full max-w-7xl">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.35)' }}>
          Recent · {history.length}
        </span>
        <button
          onClick={() => {
            clearHistory()
            setHistory([])
          }}
          className="text-xs transition-opacity hover:opacity-60"
          style={{ color: 'rgba(0,0,0,0.3)' }}
        >
          Clear all
        </button>
      </div>

      {/* History chips */}
      <div className="flex flex-wrap gap-2">
        {history.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className="glass-sm flex items-center gap-2.5 px-4 py-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.6)' }}
          >
            {/* Symbol */}
            <span className="text-sm font-bold" style={{ color: 'rgba(0,0,0,0.8)' }}>
              {entry.symbol}
            </span>

            {/* Period badge */}
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={
                entry.period === 'annual'
                  ? { background: 'rgba(0,113,227,0.12)', color: '#0071e3' }
                  : { background: 'rgba(26,138,74,0.12)', color: '#1a7a40' }
              }
            >
              {entry.period === 'annual' ? 'Annual' : 'Qtrly'}
            </span>

            {/* Time */}
            <span className="text-[10px]" style={{ color: 'rgba(0,0,0,0.3)' }}>
              {timeAgo(entry.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
