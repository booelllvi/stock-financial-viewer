'use client'

import type { FinancialData } from './IncomeTable'

interface EpsYoYProps {
  data: FinancialData[]
}

function formatPct(v: number): string {
  if (isNaN(v) || !isFinite(v)) return 'N/A'
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

function formatEps(v: number): string {
  if (isNaN(v)) return 'N/A'
  return `$${v.toFixed(2)}`
}

/** Group quarterly data by quarter label (Q1–Q4) across years */
function buildYoYRows(data: FinancialData[]) {
  // Only quarterly data
  const quarterly = data.filter((d) => /^Q[1-4]$/.test(d.period))
  if (quarterly.length === 0) return []

  // Group by quarter
  const byQuarter: Record<string, { year: string; eps: number }[]> = {}
  for (const d of quarterly) {
    const q = d.period // Q1, Q2, etc
    if (!byQuarter[q]) byQuarter[q] = []
    byQuarter[q].push({
      year: d.fiscalYear,
      eps: d.epsNonGaap != null && !isNaN(d.epsNonGaap) ? d.epsNonGaap : NaN,
    })
  }

  // Sort each group by year descending
  for (const q of Object.keys(byQuarter)) {
    byQuarter[q].sort((a, b) => b.year.localeCompare(a.year))
  }

  // Build rows: for each quarter, pair consecutive years
  const rows: {
    quarter: string
    currentYear: string
    currentEps: number
    prevYear: string
    prevEps: number
    yoyPct: number
  }[] = []

  // Order: Q1, Q2, Q3, Q4
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) {
    const entries = byQuarter[q]
    if (!entries || entries.length < 2) continue
    for (let i = 0; i < entries.length - 1; i++) {
      const curr = entries[i]
      const prev = entries[i + 1]
      const yoy =
        !isNaN(curr.eps) && !isNaN(prev.eps) && prev.eps !== 0
          ? ((curr.eps - prev.eps) / Math.abs(prev.eps)) * 100
          : NaN
      rows.push({
        quarter: q,
        currentYear: curr.year,
        currentEps: curr.eps,
        prevYear: prev.year,
        prevEps: prev.eps,
        yoyPct: yoy,
      })
    }
  }

  return rows
}

export default function EpsYoY({ data }: EpsYoYProps) {
  const rows = buildYoYRows(data)
  if (rows.length === 0) return null

  return (
    <div className="glass w-full overflow-hidden">
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-bold tracking-wide" style={{ color: 'rgba(0,0,0,0.8)' }}>
          EPS (Non-GAAP) — Year-over-Year
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>
          Same quarter comparison across years
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.025)' }}>
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                Quarter
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                Current
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                Prior Year
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.4)' }}>
                YoY Change
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = !isNaN(r.yoyPct) && r.yoyPct >= 0
              const yoyColor = isNaN(r.yoyPct) ? 'rgba(0,0,0,0.3)' : up ? '#1a8a4a' : '#d93025'
              const yoyBg = isNaN(r.yoyPct) ? 'transparent' : up ? 'rgba(26,138,74,0.08)' : 'rgba(217,48,37,0.08)'
              return (
                <tr
                  key={`${r.quarter}-${r.currentYear}`}
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <td className="px-6 py-3 text-sm font-medium" style={{ color: 'rgba(0,0,0,0.6)' }}>
                    {r.quarter} {r.currentYear} vs {r.prevYear}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono font-semibold" style={{ color: 'rgba(0,0,0,0.8)' }}>
                    {formatEps(r.currentEps)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono" style={{ color: 'rgba(0,0,0,0.45)' }}>
                    {formatEps(r.prevEps)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className="inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: yoyColor, background: yoyBg }}
                    >
                      {!isNaN(r.yoyPct) && (up ? '▲' : '▼')} {formatPct(r.yoyPct)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
