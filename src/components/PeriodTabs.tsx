'use client'

interface PeriodTabsProps {
  value: 'annual' | 'quarter'
  onChange: (period: 'annual' | 'quarter') => void
}

export default function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div
      className="glass-sm inline-flex p-1 gap-1"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {(['annual', 'quarter'] as const).map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className="px-5 py-2 rounded-[10px] text-sm font-semibold capitalize transition-all duration-200"
          style={
            value === period
              ? {
                  background: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  color: 'rgba(0,0,0,0.85)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
                }
              : {
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: 'rgba(0,0,0,0.4)',
                }
          }
        >
          {period === 'annual' ? 'Annual' : 'Quarterly'}
        </button>
      ))}
    </div>
  )
}
