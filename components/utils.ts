export function getRateColor(rate: number): string {
  if (rate > 0) return 'text-rose-600'
  if (rate < 0) return 'text-blue-600'
  return 'text-slate-500'
}

export function getRateBadgeClass(rate: number): string {
  if (rate > 0) return 'bg-rose-100 text-rose-700'
  if (rate < 0) return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

export function formatRate(rate: number): string {
  return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`
}
