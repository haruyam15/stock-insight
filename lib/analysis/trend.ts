/**
 * 추세 판단 (Trend Signal)
 * MA5, MA20, MA60 간의 관계로 추세를 판단
 */

export function determineTrend(ma: {
  ma5: number | null
  ma20: number | null
  ma60: number | null
}): '강한 상승 추세' | '단기 상승 추세' | '강한 하락 추세' | '단기 하락 추세' | '횡보' | '판단 불가' {
  const { ma5, ma20, ma60 } = ma

  if (ma5 === null || ma20 === null) return '판단 불가'

  if (ma5 > ma20 && ma60 !== null && ma20 > ma60) return '강한 상승 추세'
  if (ma5 > ma20) return '단기 상승 추세'
  if (ma5 < ma20 && ma60 !== null && ma20 < ma60) return '강한 하락 추세'
  if (ma5 < ma20) return '단기 하락 추세'

  return '횡보'
}
