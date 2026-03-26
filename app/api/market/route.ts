import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate, isValidDate, toIsoDate } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
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

    const { data, error } = await supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
      .eq('base_date', targetDate)

    if (error) throw error
    if (!data || data.length === 0) {
      return NextResponse.json({ error: '해당 날짜의 데이터가 없습니다' }, { status: 404 })
    }

    // 통계 계산
    let riseCount = 0, fallCount = 0, unchangedCount = 0, rateSum = 0
    for (const row of data) {
      const rate = row.change_rate ?? 0
      rateSum += rate
      if (rate > 0) riseCount++
      else if (rate < 0) fallCount++
      else unchangedCount++
    }
    const avgChangeRate = Number((rateSum / data.length).toFixed(2))

    // TOP 3
    const sorted = [...data].sort((a, b) => (b.change_rate ?? 0) - (a.change_rate ?? 0))

    const toTop = (rows: typeof data) =>
      rows.map((r: any) => ({
        code: r.stock_code,
        name: r.stocks?.name ?? '',
        changeRate: r.change_rate,
        close: r.close_price,
        volume: r.volume,
      }))

    return NextResponse.json({
      date: targetDate,
      summary: { riseCount, fallCount, unchangedCount, avgChangeRate },
      topRise: toTop(sorted.slice(0, 3)),
      topFall: toTop(sorted.slice(-3).reverse()),
      topVolume: toTop([...data].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 3)),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
