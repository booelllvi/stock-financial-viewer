'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'fmp_usage'
const DAILY_LIMIT = 250

interface UsageData {
  date: string
  count: number
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function getUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: todayStr(), count: 0 }
    const data: UsageData = JSON.parse(raw)
    if (data.date !== todayStr()) return { date: todayStr(), count: 0 }
    return data
  } catch {
    return { date: todayStr(), count: 0 }
  }
}

export function incrementUsage() {
  const usage = getUsage()
  const next = { date: todayStr(), count: usage.count + 1 }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next.count
}

export default function ApiCounter() {
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCount(getUsage().count)
    setMounted(true)

    // Sync when other tabs update
    const onStorage = () => setCount(getUsage().count)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Listen for custom event from fetch calls
  useEffect(() => {
    const onUpdate = () => setCount(getUsage().count)
    window.addEventListener('fmp-usage-updated', onUpdate)
    return () => window.removeEventListener('fmp-usage-updated', onUpdate)
  }, [])

  if (!mounted) return null

  const remaining = DAILY_LIMIT - count
  const pct = count / DAILY_LIMIT
  const barColor =
    pct < 0.6 ? '#1a8a4a' : pct < 0.85 ? '#d97706' : '#d93025'
  const textColor =
    pct < 0.6 ? '#1a8a4a' : pct < 0.85 ? '#b45309' : '#d93025'

  return (
    <a
      href="https://site.financialmodelingprep.com/developer/docs/dashboard"
      target="_blank"
      rel="noopener noreferrer"
      className="glass-sm flex items-center gap-3 px-4 py-2.5 transition-opacity hover:opacity-80"
      title="Check exact usage on FMP Dashboard"
    >
      {/* Circular indicator */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={barColor}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 12}`}
            strokeDashoffset={`${2 * Math.PI * 12 * (1 - pct)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
          style={{ color: textColor }}
        >
          {count}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold" style={{ color: 'rgba(0,0,0,0.7)' }}>
          API Usage
        </span>
        <span className="text-[11px]" style={{ color: textColor }}>
          {remaining} left today*
        </span>
      </div>
    </a>
  )
}
