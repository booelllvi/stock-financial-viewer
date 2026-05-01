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
  costOfRevenue: number
  ebitda: number
  researchAndDevelopment: number
  sga: number
  epsDiluted: number
  sharesOutDil: number
  source?: 'fmp' | 'av'
}

interface IncomeTableProps {
  data: FinancialData[]
  symbol: string
  onRefresh?: () => void
}

// ── Formatters ───────────────────────────────────────────────────────────────

function formatPct(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  return `${value.toFixed(1)}%`
}

function formatShares(value: number): string {
  if (!value || isNaN(value)) return 'N/A'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M`
  return `${abs.toFixed(0)}`
}

// ── Row definitions ──────────────────────────────────────────────────────────

type RowDef = { key: string; label: string; format: (v: number) => string }

const MAIN_ROWS: RowDef[] = [
  { key: 'revenue', label: 'Revenue', format: formatCurrency },
  { key: 'grossProfit', label: 'Gross Profit', format: formatCurrency },
  { key: 'operatingIncome', label: 'Operating Income', format: formatCurrency },
  { key: 'netIncome', label: 'Net Income', format: formatCurrency },
  { key: 'eps', label: 'EPS (GAAP)', format: formatEPS },
  { key: 'epsNonGaap', label: 'EPS (Non-GAAP)', format: formatEPS },
  { key: 'epsEstimate', label: 'EPS Estimate', format: formatEPS },
  { key: 'grossMargin', label: 'Gross Margin %', format: formatPct },
  { key: 'operatingMargin', label: 'Operating Margin %', format: formatPct },
  { key: 'netMargin', label: 'Net Margin %', format: formatPct },
]

const DETAIL_ROWS: RowDef[] = [
  { key: 'costOfRevenue', label: 'Cost of Revenue', format: formatCurrency },
  { key: 'ebitda', label: 'EBITDA', format: formatCurrency },
  { key: 'researchAndDevelopment', label: 'R&D Expenses', format: formatCurrency },
  { key: 'sga', label: 'SG&A Expenses', format: formatCurrency },
  { key: 'epsDiluted', label: 'EPS (Diluted)', format: formatEPS },
  { key: 'sharesOutDil', label: 'Shares Out (Diluted)', format: formatShares },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPeriodLabel(period: string, fiscalYear: string): string {
  if (period === 'FY') return `FY ${fiscalYear}`
  if (/^Q[1-4]$/.test(period)) return `${period} ${fiscalYear}`
  return fiscalYear
}

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

/** Margin % badge: coloured pill showing the percentage value */
function MarginBadge({ value }: { value: number }) {
  if (isNaN(value)) return null
  const up = value >= 0
  const color = up ? '#1a8a4a' : '#d93025'
  const bg = up ? 'rgba(26,138,74,0.08)' : 'rgba(217,48,37,0.08)'
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1 align-middle"
      style={{ color, background: bg }}
    >
      {value.toFixed(1)}%
    </span>
  )
}

function valueColor(value: number): string {
  if (isNegative(value)) return '#d93025'
  return 'rgba(0,0,0,0.8)'
}

// ── Computed field getters ────────────────────────────────────────────────────

const FIELD_GETTERS: Record<string, (d: FinancialData) => number> = {
  revenue:               (d) => d.revenue,
  grossProfit:           (d) => d.grossProfit,
  operatingIncome:       (d) => d.operatingIncome,
  netIncome:             (d) => d.netIncome,
  eps:                   (d) => d.eps,
  epsNonGaap:            (d) => d.epsNonGaap ?? NaN,
  epsEstimate:           (d) => d.epsEstimate ?? NaN,
  grossMargin:           (d) => d.revenue ? (d.grossProfit / d.revenue) * 100 : NaN,
  operatingMargin:       (d) => d.revenue ? (d.operatingIncome / d.revenue) * 100 : NaN,
  netMargin:             (d) => d.revenue ? (d.netIncome / d.revenue) * 100 : NaN,
  costOfRevenue:         (d) => d.costOfRevenue ?? NaN,
  ebitda:                (d) => d.ebitda ?? NaN,
  researchAndDevelopment:(d) => d.researchAndDevelopment ?? NaN,
  sga:                   (d) => d.sga ?? NaN,
  epsDiluted:            (d) => d.epsDiluted ?? NaN,
  sharesOutDil:          (d) => d.sharesOutDil ?? NaN,
}

// ── TSV copy ─────────────────────────────────────────────────────────────────

function buildTSV(symbol: string, sorted: FinancialData[]): string {
  const periodHeaders = sorted.map((d) => formatPeriodLabel(d.period, d.fiscalYear))
  const allRows = [...MAIN_ROWS, ...DETAIL_ROWS]
  const lines: string[] = [
    `# ${symbol} — Income Statement`,
    ['Metric', ...periodHeaders].join('\t'),
    ...allRows.map((row) => {
      const values = sorted.map((d) => {
        const v = FIELD_GETTERS[row.key](d)
        return isNaN(v) ? 'N/A' : String(v)
      })
      return [row.label, ...values].join('\t')
    }),
  ]
  return lines.join('\n')
}

// ── Badge selector per row key ───────────────────────────────────────────────

const MARGIN_KEYS = new Set(['grossMargin', 'operatingMargin', 'netMargin'])

function RowBadge({ rowKey, value, prevValue, item }: {
  rowKey: string; value: number; prevValue: number | undefined; item: FinancialData
}) {
  if (rowKey === 'epsNonGaap') {
    return <SurpriseBadge actual={value} estimate={item.epsEstimate ?? NaN} />
  }
  if (MARGIN_KEYS.has(rowKey)) {
    return null // margin rows show % in the value itself
  }
  return <TrendBadge value={value} prev={prevValue} />
}

// ── Reusable table section ───────────────────────────────────────────────────

function TableSection({ rows, sorted, startIdx }: {
  rows: RowDef[]; sorted: FinancialData[]; startIdx: number
}) {
  return (
    <>
      {rows.map((row, i) => {
        const globalIdx = startIdx + i
        return (
          <tr
            key={row.key}
            style={{
              background: globalIdx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
              borderTop: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <td
              className="px-6 py-3.5 text-sm font-medium sticky left-0"
              style={{
                color: 'rgba(0,0,0,0.6)',
                background:
                  globalIdx % 2 === 0 ? 'rgba(240,244,255,0.75)' : 'rgba(235,240,255,0.8)',
              }}
            >
              {row.label}
            </td>
            {sorted.map((item, colIdx) => {
              const value = FIELD_GETTERS[row.key](item)
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
                  <RowBadge rowKey={row.key} value={value} prevValue={prevValue} item={item} />
                </td>
              )
            })}
          </tr>
        )
      })}
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function IncomeTable({ data, symbol, onRefresh }: IncomeTableProps) {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

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

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 hover:opacity-70"
            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.55)' }}
            title="Re-fetch latest data from API"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 6a4.5 4.5 0 018.25-2.5M10.5 6a4.5 4.5 0 01-8.25 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M9.5 1v2.5H7M2.5 11V8.5H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        )}

        {/* Data source badge */}
        {data[0]?.source === 'av' && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
            {/* ── Main rows ── */}
            <TableSection rows={MAIN_ROWS} sorted={sorted} startIdx={0} />

            {/* ── Divider ── */}
            <tr>
              <td
                colSpan={sorted.length + 1}
                className="px-6 py-2"
                style={{ background: 'rgba(0,0,0,0.03)', borderTop: '2px solid rgba(0,0,0,0.1)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}
              >
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-xs font-semibold transition-colors hover:opacity-70"
                  style={{ color: 'rgba(0,0,0,0.45)' }}
                >
                  <span style={{ display: 'inline-block', transform: showDetails ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                    ▶
                  </span>
                  Detailed Breakdown
                  <span className="text-[10px] font-normal" style={{ color: 'rgba(0,0,0,0.3)' }}>
                    Cost of Revenue · EBITDA · R&D · SG&A · Diluted EPS · Shares
                  </span>
                </button>
              </td>
            </tr>

            {/* ── Detail rows (collapsible) ── */}
            {showDetails && (
              <TableSection rows={DETAIL_ROWS} sorted={sorted} startIdx={MAIN_ROWS.length} />
            )}
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
      </div>
    </div>
  )
}
