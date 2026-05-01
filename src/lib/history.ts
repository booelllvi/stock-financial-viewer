import type { FinancialData } from '@/components/IncomeTable'

export interface HistoryEntry {
  id: string
  symbol: string
  period: 'annual' | 'quarter'
  data: FinancialData[]
  timestamp: number
}

const KEY = 'fmp_history'
const VERSION_KEY = 'fmp_history_version'
const MAX = 10

/** Bump this when API response schema changes to auto-invalidate old cache */
const CACHE_VERSION = 2

function checkVersion(): void {
  try {
    const v = localStorage.getItem(VERSION_KEY)
    if (v !== String(CACHE_VERSION)) {
      localStorage.removeItem(KEY)
      localStorage.setItem(VERSION_KEY, String(CACHE_VERSION))
    }
  } catch { /* ignore */ }
}

export function getHistory(): HistoryEntry[] {
  try {
    checkVersion()
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  const history = getHistory()
  const id = `${entry.symbol}-${entry.period}`
  const filtered = history.filter((h) => h.id !== id)
  const next: HistoryEntry[] = [
    { ...entry, id, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function clearHistory(): void {
  localStorage.removeItem(KEY)
}
