import { supabaseAdmin } from './supabase'

// stock_prices 테이블에서 가장 최신 기준일자 조회
export async function getLatestDate(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('stock_prices')
    .select('base_date')
    .order('base_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) throw new Error('최신 날짜 조회 실패')
  return data.base_date
}

// 날짜 파라미터 유효성 검사 (YYYYMMDD 또는 YYYY-MM-DD)
export function isValidDate(date: string): boolean {
  return /^\d{8}$/.test(date) || /^\d{4}-\d{2}-\d{2}$/.test(date)
}

// YYYYMMDD → YYYY-MM-DD 변환
export function toIsoDate(date: string): string {
  if (date.includes('-')) return date
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
}
