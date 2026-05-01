'use client'

import { useState, useCallback } from 'react'
import SearchBar from '@/components/SearchBar'
import PeriodTabs from '@/components/PeriodTabs'
import IncomeTable, { type FinancialData } from '@/components/IncomeTable'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ErrorMessage from '@/components/ErrorMessage'
import ApiCounter, { incrementUsage } from '@/components/ApiCounter'
import SearchHistory from '@/components/SearchHistory'
import { saveHistory, getHistory, type HistoryEntry } from '@/lib/history'

type Period = 'annual' | 'quarter'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [period, setPeriod] = useState<Period>('quarter')
  const [data, setData] = useState<FinancialData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyKey, setHistoryKey] = useState(0)

  const fetchData = useCallback(async (symbol: string, p: Period, forceRefresh = false) => {
    // Check localStorage cache first (skip on explicit refresh)
    if (!forceRefresh) {
      const cached = getHistory().find((h) => h.id === `${symbol}-${p}`)
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
      const res = await fetch(`/api/financials?symbol=${encodeURIComponent(symbol)}&period=${p}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
      } else {
        setData(json)
        saveHistory({ symbol, period: p, data: json })
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
          <IncomeTable data={data} symbol={ticker} />
        )}
        {!loading && !error && !data && (
          <div className="text-center py-20" style={{ color: 'rgba(0,0,0,0.2)' }}>
            <p className="text-6xl mb-4">📈</p>
            <p className="text-base font-medium">Enter a ticker to get started</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.25)' }}>
        * API usage is estimated (localStorage). Click counter to view exact usage on FMP Dashboard.
      </p>
    </main>
  )
}
