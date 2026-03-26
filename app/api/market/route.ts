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

    // 해당 날짜 전체 데이터 조회
    const { data: prices, error } = await supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume')
      .eq('base_date', targetDate)

    if (error) throw error
    if (!prices || prices.length === 0) {
      return NextResponse.json({ error: '해당 날짜의 데이터가 없습니다' }, { status: 404 })
    }

    // 통계 계산
    let riseCount = 0, fallCount = 0, unchangedCount = 0, rateSum = 0
    for (const row of prices) {
      const rate = row.change_rate ?? 0
      rateSum += rate
      if (rate > 0) riseCount++
      else if (rate < 0) fallCount++
      else unchangedCount++
    }
    const avgChangeRate = Number((rateSum / prices.length).toFixed(2))

    // TOP 종목 코드 추출
    const sorted = [...prices].sort((a, b) => (b.change_rate ?? 0) - (a.change_rate ?? 0))
    const topRiseCodes = sorted.slice(0, 3).map((r) => r.stock_code)
    const topFallCodes = sorted.slice(-3).reverse().map((r) => r.stock_code)
    const topVolumeCodes = [...prices]
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
      .slice(0, 3)
      .map((r) => r.stock_code)

    const allTopCodes = [...new Set([...topRiseCodes, ...topFallCodes, ...topVolumeCodes])]

    // 종목명 조회
    const { data: stockNames } = await supabaseAdmin
      .from('stocks')
      .select('code, name')
      .in('code', allTopCodes)

    const nameMap = Object.fromEntries((stockNames ?? []).map((s) => [s.code, s.name]))
    const priceMap = Object.fromEntries(prices.map((p) => [p.stock_code, p]))

    const toTop = (codes: string[]) =>
      codes.map((code) => ({
        code,
        name: nameMap[code] ?? '',
        changeRate: priceMap[code]?.change_rate,
        close: priceMap[code]?.close_price,
        volume: priceMap[code]?.volume,
      }))

    return NextResponse.json({
      date: targetDate,
      summary: { riseCount, fallCount, unchangedCount, avgChangeRate },
      topRise: toTop(topRiseCodes),
      topFall: toTop(topFallCodes),
      topVolume: toTop(topVolumeCodes),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
