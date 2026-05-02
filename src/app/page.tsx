'use client'

import { useState, useCallback } from 'react'
import SearchBar from '@/components/SearchBar'
import PeriodTabs from '@/components/PeriodTabs'
import IncomeTable, { type FinancialData } from '@/components/IncomeTable'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ErrorMessage from '@/components/ErrorMessage'
import ApiCounter, { incrementUsage } from '@/components/ApiCounter'
import SearchHistory from '@/components/SearchHistory'
import EpsChart from '@/components/EpsChart'
import RetroCounter from '@/components/RetroCounter'
import { saveHistory, getHistory, clearHistory, type HistoryEntry } from '@/lib/history'

type Period = 'annual' | 'quarter'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [period, setPeriod] = useState<Period>('quarter')
  const [data, setData] = useState<FinancialData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchData = useCallback(async (symbol: string, p: Period, forceRefresh = false, limit?: number) => {
    // Check localStorage cache first (skip on explicit refresh)
    const cacheId = limit ? `${symbol}-${p}-${limit}` : `${symbol}-${p}`
    if (!forceRefresh) {
      const cached = getHistory().find((h) => h.id === cacheId)
      if (cached) {
        setData(cached.data)
        setError(null)
        return
      }
    }

    setLoading(true)
    setError(null)
    setData(null)
    try {
      const limitParam = limit ? `&limit=${limit}` : ''
      const res = await fetch(`/api/financials?symbol=${encodeURIComponent(symbol)}&period=${p}${limitParam}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
      } else {
        setData(json)
        saveHistory({ symbol, period: p, data: json, limit })
        setHistoryKey((k) => k + 1)
        incrementUsage()
        window.dispatchEvent(new Event('fmp-usage-updated'))
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = (sym: string) => {
    setTicker(sym)
    fetchData(sym, period, true) // force refresh on new search
  }

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    if (ticker) fetchData(ticker, p) // use cache if available
  }

  // Load from history cache — no API call
  const handleHistorySelect = (entry: HistoryEntry) => {
    setTicker(entry.symbol)
    setPeriod(entry.period)
    setData(entry.data)
    setError(null)
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 gap-8">
      {/* Top bar */}
      <div className="w-full max-w-7xl flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-4xl font-bold tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #3a2a5e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Stock Financial Viewer
          </h1>
          <p className="text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>
            Income Statement · Annual &amp; Quarterly
          </p>
        </div>
        <ApiCounter />
      </div>

      {/* Retro visit counter */}
      <RetroCounter />

      {/* Search */}
      <SearchBar onSearch={handleSearch} loading={loading} />

      {/* Recent history chips */}
      <SearchHistory onSelect={handleHistorySelect} refreshKey={historyKey} />

      {/* Period Tabs */}
      {ticker && (
        <PeriodTabs value={period} onChange={handlePeriodChange} />
      )}

      {/* Content area */}
      <div className="w-full max-w-7xl">
        {loading && <LoadingSkeleton />}
        {!loading && error && <ErrorMessage message={error} />}
        {!loading && !error && data && (
          <>
            <IncomeTable
              data={data}
              symbol={ticker}
              onRefresh={() => fetchData(ticker, period, true)}
              onLoad12Q={period === 'quarter' ? () => fetchData(ticker, period, true, 12) : undefined}
            />
            <div className="mt-6">
              <EpsChart data={data} />
            </div>
          </>
        )}
        {!loading && !error && !data && (
          <div className="text-center py-20" style={{ color: 'rgba(0,0,0,0.2)' }}>
            <p className="text-6xl mb-4">📈</p>
            <p className="text-base font-medium">Enter a ticker to get started</p>
          </div>
        )}
      </div>

      {/* Clear cache button */}
      <button
        onClick={() => {
          clearHistory()
          setData(null)
          setHistoryKey((k) => k + 1)
        }}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 hover:opacity-70"
        style={{
          background: 'rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.08)',
          color: 'rgba(0,0,0,0.4)',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 3h8M4.5 3V2a1 1 0 011-1h1a1 1 0 011 1v1M9 3v6.5a1 1 0 01-1 1H4a1 1 0 01-1-1V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Clear Cache
      </button>

    </main>
  )
}
