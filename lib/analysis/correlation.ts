/**
 * 피어슨 상관계수 (Pearson Correlation Coefficient)
 * r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
 * 범위: -1 ~ 1 (1에 가까울수록 같은 방향으로 움직임)
 */

export function calculateCorrelation(
  pricesA: number[],
  pricesB: number[]
): number | null {
  if (!pricesA || !pricesB) return null
  if (pricesA.length !== pricesB.length) return null
  if (pricesA.length < 5) return null

  const n = pricesA.length
  const avgA = pricesA.reduce((s, v) => s + v, 0) / n
  const avgB = pricesB.reduce((s, v) => s + v, 0) / n

  let numerator = 0
  let denomA = 0
  let denomB = 0

  for (let i = 0; i < n; i++) {
    const diffA = pricesA[i] - avgA
    const diffB = pricesB[i] - avgB
    numerator += diffA * diffB
    denomA += diffA * diffA
    denomB += diffB * diffB
  }

  const denominator = Math.sqrt(denomA * denomB)
  if (denominator === 0) return null

  return Number((numerator / denominator).toFixed(2))
}
