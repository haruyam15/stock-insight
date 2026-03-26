/**
 * 이동평균선 (Moving Average)
 * MA(N) = 최근 N일 종가의 합 / N
 * prices 배열은 날짜 오름차순(과거 → 최신) 정렬 상태를 가정
 */

/** N일 이동평균. 데이터가 N개 미만이면 null 반환 */
export function calculateMAn(prices: number[], n: number): number | null {
  if (!prices || prices.length < n) return null
  const slice = prices.slice(-n)
  const avg = slice.reduce((sum, p) => sum + p, 0) / n
  return Number(avg.toFixed(2))
}

/** MA5, MA20, MA60 한번에 계산 */
export function calculateMA(prices: number[]): {
  ma5: number | null
  ma20: number | null
  ma60: number | null
} {
  return {
    ma5: calculateMAn(prices, 5),
    ma20: calculateMAn(prices, 20),
    ma60: calculateMAn(prices, 60),
  }
}
