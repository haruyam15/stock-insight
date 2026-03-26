/**
 * 변동성 (Volatility)
 * 표준편차 = √( Σ(종가 - 평균)² / N )
 * 등급 기준: 평균가 대비 표준편차 비율
 *   낮음: 2% 미만 / 보통: 2~5% / 높음: 5% 초과
 */

export function calculateVolatility(
  prices: number[],
  period: number = 20
): { stdDev: number; level: '낮음' | '보통' | '높음' } | null {
  if (!prices || prices.length < period) return null

  const slice = prices.slice(-period)
  const avg = slice.reduce((sum, p) => sum + p, 0) / period
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / period
  const stdDev = Number(Math.sqrt(variance).toFixed(2))

  const ratio = (stdDev / avg) * 100
  const level = ratio < 2 ? '낮음' : ratio <= 5 ? '보통' : '높음'

  return { stdDev, level }
}
