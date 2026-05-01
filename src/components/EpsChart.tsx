'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { FinancialData } from './IncomeTable'

interface EpsChartProps {
  data: FinancialData[]
}

function formatPeriodLabel(period: string, fiscalYear: string): string {
  if (period === 'FY') return `FY ${fiscalYear}`
  if (/^Q[1-4]$/.test(period)) return `${period} ${fiscalYear}`
  return fiscalYear
}

export default function EpsChart({ data }: EpsChartProps) {
  // Chronological order (oldest → newest)
  const sorted = [...data].reverse()

  const chartData = sorted.map((d) => {
    const actual = d.epsNonGaap != null && !isNaN(d.epsNonGaap) ? d.epsNonGaap : null
    const estimate = d.epsEstimate != null && !isNaN(d.epsEstimate) ? d.epsEstimate : null
    const gaap = d.eps != null && !isNaN(d.eps) ? d.eps : null
    const beat = actual !== null && estimate !== null ? actual - estimate : null
    return {
      label: formatPeriodLabel(d.period, d.fiscalYear),
      actual,
      estimate,
      gaap,
      beat,
      isBeat: beat !== null && beat >= 0,
    }
  })

  const hasNonGaap = chartData.some((d) => d.actual !== null)
  if (!hasNonGaap) return null

  return (
    <div className="glass w-full overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3 border-b"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <h2 className="text-lg font-bold tracking-wide" style={{ color: 'rgba(0,0,0,0.8)' }}>
          EPS Trend
        </h2>
        {/* Legend */}
        <div className="flex items-center gap-4 ml-4">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(0,0,0,0.5)' }}>
            <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: '#0071e3' }} />
            Non-GAAP Actual
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(0,0,0,0.5)' }}>
            <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: '#999', borderTop: '1px dashed #999' }} />
            Estimate
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(0,0,0,0.5)' }}>
            <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: 'rgba(0,0,0,0.25)' }} />
            GAAP
          </span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'rgba(0,0,0,0.5)' }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(26,138,74,0.3)' }} />
            Beat
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(217,48,37,0.3)' }} />
            Miss
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-6">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.45)' }}
              axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.4)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              width={60}
            />
            <ReferenceLine y={0} stroke="rgba(0,0,0,0.15)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
              formatter={(value, name) => {
                const v = value as number | null | undefined
                if (v === null || v === undefined) return ['N/A', String(name)]
                const n = String(name)
                const label = n === 'actual' ? 'Non-GAAP' : n === 'estimate' ? 'Estimate' : n === 'gaap' ? 'GAAP' : 'Surprise'
                if (n === 'beat') return [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'Surprise']
                return [`$${v.toFixed(2)}`, label]
              }}
            />

            {/* Beat/Miss bars */}
            <Bar dataKey="beat" barSize={32} radius={[4, 4, 0, 0]} opacity={0.35}>
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.isBeat ? '#1a8a4a' : '#d93025'}
                />
              ))}
            </Bar>

            {/* GAAP line */}
            <Line
              type="monotone"
              dataKey="gaap"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth={1.5}
              dot={{ r: 3, fill: 'rgba(0,0,0,0.25)', stroke: 'white', strokeWidth: 1.5 }}
              connectNulls
            />

            {/* Estimate dashed line */}
            <Line
              type="monotone"
              dataKey="estimate"
              stroke="#999"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={{ r: 3, fill: '#999', stroke: 'white', strokeWidth: 1.5 }}
              connectNulls
            />

            {/* Non-GAAP Actual line (primary) */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#0071e3"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#0071e3', stroke: 'white', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#0071e3', stroke: 'white', strokeWidth: 2 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
