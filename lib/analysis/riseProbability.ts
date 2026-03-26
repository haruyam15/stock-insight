/**
 * 상승 확률 (Rise Probability)
 * 최근 N일 중 전일 대비 종가가 오른 날의 비율
 * 비교 가능한 쌍 = period - 1 개
 */

export function calculateRiseProbability(
  prices: number[],
  period: number = 30
): { days: number; riseCount: number; probability: number } | null {
  if (!prices || prices.length < 2) return null

  const slice = prices.slice(-period)
  const comparableDays = slice.length - 1

  let riseCount = 0
  for (let i = 1; i < slice.length; i++) {
    if (slice[i] > slice[i - 1]) riseCount++
  }

  const probability = Number(((riseCount / comparableDays) * 100).toFixed(1))

  return { days: comparableDays, riseCount, probability }
}
