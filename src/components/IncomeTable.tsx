'use client'

import { useState } from 'react'
import { formatCurrency, formatEPS, isNegative } from '@/lib/format'

export interface FinancialData {
  date: string
  symbol: string
  period: string
  fiscalYear: string
  revenue: number
  grossProfit: number
  operatingIncome: number
  netIncome: number
  eps: number
  epsNonGaap: number
  epsEstimate: number
  source?: 'fmp' | 'av'
}

interface IncomeTableProps {
  data: FinancialData[]
  symbol: string
}

const ROWS = [
  { key: 'revenue', label: 'Revenue', format: formatCurrency },
  { key: 'grossProfit', label: 'Gross Profit', format: formatCurrency },
  { key: 'operatingIncome', label: 'Operating Income', format: formatCurrency },
  { key: 'netIncome', label: 'Net Income', format: formatCurrency },
  { key: 'eps', label: 'EPS (GAAP)', format: formatEPS },
  { key: 'epsNonGaap', label: 'EPS (Non-GAAP)', format: formatEPS },
  { key: 'epsEstimate', label: 'EPS Estimate', format: formatEPS },
] as const

/** Format FMP period + fiscalYear into "FY 2025" or "Q2 2026" */
function formatPeriodLabel(period: string, fiscalYear: string): string {
  if (period === 'FY') return `FY ${fiscalYear}`
  if (/^Q[1-4]$/.test(period)) return `${period} ${fiscalYear}`
  return fiscalYear
}

/** % change from curr to next (chronological order: prev is left column) */
function pctChange(curr: number, prev: number | undefined): number | null {
  if (prev === undefined || prev === 0) return null
  if (isNaN(curr) || isNaN(prev)) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function TrendBadge({ value, prev }: { value: number; prev: number | undefined }) {
  if (isNaN(value)) return null
  const pct = pctChange(value, prev)
  if (pct === null) return null

  const up = pct >= 0
  const color = up ? '#1a8a4a' : '#d93025'
  const bg = up ? 'rgba(26,138,74,0.1)' : 'rgba(217,48,37,0.1)'
  const border = up ? 'rgba(26,138,74,0.2)' : 'rgba(217,48,37,0.2)'
  const arrow = up ? '▲' : '▼'

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1 align-middle"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

/** Earnings Surprise badge: Non-GAAP Actual vs Estimate */
function SurpriseBadge({ actual, estimate }: { actual: number; estimate: number }) {
  if (isNaN(actual) || isNaN(estimate) || estimate === 0) return null
  const diff = actual - estimate
  const pct = (diff / Math.abs(estimate)) * 100
  const up = diff >= 0
  const color = up ? '#1a8a4a' : '#d93025'
  const bg = up ? 'rgba(26,138,74,0.1)' : 'rgba(217,48,37,0.1)'
  const border = up ? 'rgba(26,138,74,0.2)' : 'rgba(217,48,37,0.2)'
  const arrow = up ? '▲' : '▼'
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1 align-middle"
      style={{ color, background: bg, border: `1px solid ${border}` }}
      title={`Surprise: ${up ? '+' : ''}${pct.toFixed(0)}% vs estimate $${estimate.toFixed(2)}`}
    >
      {arrow} {Math.abs(pct).toFixed(0)}% surprise
    </span>
  )
}

function valueColor(value: number): string {
  if (isNegative(value)) return '#d93025'
  return 'rgba(0,0,0,0.8)'
}

// Explicit getters — avoids TypeScript dynamic access issues
const FIELD_GETTERS: Record<string, (d: FinancialData) => number> = {
  revenue:         (d) => d.revenue,
  grossProfit:     (d) => d.grossProfit,
  operatingIncome: (d) => d.operatingIncome,
  netIncome:       (d) => d.netIncome,
  eps:             (d) => d.eps,
  epsNonGaap:      (d) => d.epsNonGaap ?? NaN,
  epsEstimate:     (d) => d.epsEstimate ?? NaN,
}

function buildTSV(symbol: string, sorted: FinancialData[]): string {
  const periodHeaders = sorted.map((d) => formatPeriodLabel(d.period, d.fiscalYear))
  const lines: string[] = [
    `# ${symbol} — Income Statement`,
    ['Metric', ...periodHeaders].join('\t'),
    ...ROWS.map((row) => {
      const values = sorted.map((d) => {
        const v = FIELD_GETTERS[row.key](d)
        return isNaN(v) ? 'N/A' : String(v)
      })
      return [row.label, ...values].join('\t')
    }),
  ]
  return lines.join('\n')
}

export default function IncomeTable({ data, symbol }: IncomeTableProps) {
  const [copied, setCopied] = useState(false)

  // FMP returns newest-first; reverse to show chronological left→right (Q2 2025 → Q2 2026)
  const sorted = [...data].reverse()
  const isQuarterly = data.length > 0 && /^Q[1-4]$/.test(data[0].period)

  const handleCopy = () => {
    navigator.clipboard.writeText(buildTSV(symbol, sorted)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="glass w-full overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-bold tracking-wide" style={{ color: 'rgba(0,0,0,0.8)' }}>
          {symbol} — Income Statement
        </h2>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(0,113,227,0.1)',
            border: '1px solid rgba(0,113,227,0.2)',
            color: '#0071e3',
          }}
        >
          {isQuarterly ? `Last ${data.length}Q` : `${data.length}Y`}
        </span>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95"
          style={
            copied
              ? { background: 'rgba(26,138,74,0.12)', border: '1px solid rgba(26,138,74,0.25)', color: '#1a7a40' }
              : { background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.55)' }
          }
          title="Copy as TSV — paste directly into Google Sheets"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="1" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 4h1.5A1.5 1.5 0 014 5.5V10a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Copy
            </>
          )}
        </button>

        {/* Data source badge */}
        {data[0]?.source === 'av' && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
            style={{
              background: 'rgba(120,80,200,0.1)',
              border: '1px solid rgba(120,80,200,0.2)',
              color: '#7850c8',
            }}
            title="Data from Alpha Vantage (FMP free plan doesn't cover this symbol)"
          >
            via Alpha Vantage · EPS N/A
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.025)' }}>
              <th
                className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest sticky left-0"
                style={{
                  color: 'rgba(0,0,0,0.4)',
                  background: 'rgba(240,244,255,0.8)',
                  minWidth: '175px',
                }}
              >
                Metric
              </th>
              {sorted.map((item) => (
                <th
                  key={item.date}
                  className="text-right px-5 py-3 text-xs font-bold tracking-wide whitespace-nowrap"
                  style={{ color: 'rgba(0,0,0,0.55)', minWidth: '110px' }}
                >
                  {formatPeriodLabel(item.period, item.fiscalYear)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.key}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <td
                  className="px-6 py-3.5 text-sm font-medium sticky left-0"
                  style={{
                    color: 'rgba(0,0,0,0.6)',
                    background:
                      i % 2 === 0 ? 'rgba(240,244,255,0.75)' : 'rgba(235,240,255,0.8)',
                  }}
                >
                  {row.label}
                </td>
                {sorted.map((item, colIdx) => {
                  const getter = FIELD_GETTERS[row.key]
                  const value = getter(item)
                  // prev = left column (older), i.e. colIdx - 1 in sorted order
                  const prevValue =
                    colIdx > 0 ? FIELD_GETTERS[row.key](sorted[colIdx - 1]) : undefined

                  return (
                    <td
                      key={item.date}
                      className="px-5 py-3.5 text-right text-sm whitespace-nowrap"
                    >
                      <span
                        className="font-mono font-semibold"
                        style={{ color: valueColor(value) }}
                      >
                        {row.format(value)}
                      </span>
                      {row.key === 'epsNonGaap'
                        ? <SurpriseBadge actual={value} estimate={item.epsEstimate ?? NaN} />
                        : <TrendBadge value={value} prev={prevValue} />
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div
        className="px-6 py-3 flex items-center gap-4 border-t"
        style={{ borderColor: 'rgba(0,0,0,0.06)' }}
      >
        <span className="text-[11px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
          ▲▼ vs prior period
        </span>
        <span className="text-[11px]" style={{ color: 'rgba(0,0,0,0.35)' }}>
          · Newest → Oldest
        </span>
      </div>
    </div>
  )
}
