export default function LoadingSkeleton() {
  const cols = 5
  const rows = 5

  return (
    <div className="glass w-full overflow-hidden">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <div
          className="skeleton-shimmer rounded-lg h-5 w-48"
          style={{ background: 'rgba(0,0,0,0.06)' }}
        />
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th className="px-6 py-3" style={{ minWidth: '160px' }}>
                <div className="skeleton-shimmer rounded h-3 w-16" style={{ background: 'rgba(0,0,0,0.06)' }} />
              </th>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-3 text-right" style={{ minWidth: '120px' }}>
                  <div
                    className="skeleton-shimmer rounded h-3 w-20 ml-auto"
                    style={{ background: 'rgba(0,0,0,0.06)' }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  background: rowIdx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <td className="px-6 py-4">
                  <div
                    className="skeleton-shimmer rounded h-4 w-32"
                    style={{ background: 'rgba(0,0,0,0.06)' }}
                  />
                </td>
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 text-right">
                    <div
                      className="skeleton-shimmer rounded h-4 w-20 ml-auto"
                      style={{ background: 'rgba(0,0,0,0.06)' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
