import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate, isValidDate, toIsoDate } from '@/lib/db'

type RankingType = 'rise' | 'fall' | 'volume' | 'value'

const COLUMN_MAP: Record<RankingType, string> = {
  rise: 'change_rate',
  fall: 'change_rate',
  volume: 'volume',
  value: 'trading_value',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = (searchParams.get('type') ?? 'rise') as RankingType
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
    const dateParam = searchParams.get('date')

    if (!['rise', 'fall', 'volume', 'value'].includes(type)) {
      return NextResponse.json({ error: 'type은 rise | fall | volume | value 중 하나여야 합니다' }, { status: 400 })
    }

    let targetDate: string
    if (dateParam) {
      if (!isValidDate(dateParam)) {
        return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다 (YYYYMMDD)' }, { status: 400 })
      }
      targetDate = toIsoDate(dateParam)
    } else {
      targetDate = await getLatestDate()
    }

    const column = COLUMN_MAP[type]
    const ascending = type === 'fall'

    const { data: prices, error } = await supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume, trading_value')
      .eq('base_date', targetDate)
      .not(column, 'is', null)
      .order(column, { ascending })
      .limit(limit)

    if (error) throw error

    // 종목명 매핑
    const codes = (prices ?? []).map((p) => p.stock_code)
    const { data: stockNames } = await supabaseAdmin
      .from('stocks')
      .select('code, name')
      .in('code', codes)

    const nameMap = Object.fromEntries((stockNames ?? []).map((s) => [s.code, s.name]))

    const ranking = (prices ?? []).map((row, i) => ({
      rank: i + 1,
      code: row.stock_code,
      name: nameMap[row.stock_code] ?? '',
      close: row.close_price,
      changeRate: row.change_rate,
      volume: row.volume,
      tradingValue: row.trading_value,
    }))

    return NextResponse.json({ type, date: targetDate, ranking })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
