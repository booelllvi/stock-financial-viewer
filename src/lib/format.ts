export function formatCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

export function formatEPS(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A'
  const sign = value < 0 ? '' : ''
  return `${sign}$${value.toFixed(2)}`
}

export function isNegative(value: number): boolean {
  return value < 0
}
