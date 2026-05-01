import type { FinancialData } from '@/components/IncomeTable'

export interface HistoryEntry {
  id: string
  symbol: string
  period: 'annual' | 'quarter'
  data: FinancialData[]
  timestamp: number
}

const KEY = 'fmp_history'
const MAX = 10

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  const history = getHistory()
  const id = `${entry.symbol}-${entry.period}`
  // Remove duplicate (same symbol+period), add to front
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
