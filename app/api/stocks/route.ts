import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate, isValidDate, toIsoDate } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const q = searchParams.get('q') ?? ''
    const dateParam = searchParams.get('date')

    let targetDate: string
    if (dateParam) {
      if (!isValidDate(dateParam)) {
        return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다 (YYYYMMDD)' }, { status: 400 })
      }
      targetDate = toIsoDate(dateParam)
    } else {
      targetDate = await getLatestDate()
    }

    // 검색어가 있으면 stocks 테이블에서 코드 목록 먼저 조회
    let codeFilter: string[] | null = null
    if (q) {
      const { data: matched } = await supabaseAdmin
        .from('stocks')
        .select('code, name')
        .or(`code.ilike.%${q}%,name.ilike.%${q}%`)
        .limit(50)
      codeFilter = (matched ?? []).map((s) => s.code)
      if (codeFilter.length === 0) {
        return NextResponse.json({ date: targetDate, stocks: [] })
      }
    }

    // stock_prices 조회
    let priceQuery = supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume')
      .eq('base_date', targetDate)
      .order('volume', { ascending: false })
      .limit(50)

    if (codeFilter) {
      priceQuery = priceQuery.in('stock_code', codeFilter)
    }

    const { data: prices, error } = await priceQuery
    if (error) throw error

    // 종목명 매핑
    const codes = (prices ?? []).map((p) => p.stock_code)
    const { data: stockNames } = await supabaseAdmin
      .from('stocks')
      .select('code, name')
      .in('code', codes)

    const nameMap = Object.fromEntries((stockNames ?? []).map((s) => [s.code, s.name]))

    const stocks = (prices ?? []).map((row) => ({
      code: row.stock_code,
      name: nameMap[row.stock_code] ?? '',
      close: row.close_price,
      changeRate: row.change_rate,
      volume: row.volume,
    }))

    return NextResponse.json({ date: targetDate, stocks })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
