import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // 종목 존재 여부 확인
    const { data: stock, error: stockError } = await supabaseAdmin
      .from('stocks')
      .select('code, name')
      .eq('code', code)
      .single()

    if (stockError || !stock) {
      return NextResponse.json({ error: '종목을 찾을 수 없습니다' }, { status: 404 })
    }

    // 최근 60일 종가 데이터 조회
    const { data: prices, error: priceError } = await supabaseAdmin
      .from('stock_prices')
      .select('base_date, close_price, volume')
      .eq('stock_code', code)
      .order('base_date', { ascending: true })
      .limit(60)

    if (priceError) throw priceError

    if (!prices || prices.length < 5) {
      return NextResponse.json({
        code: stock.code,
        name: stock.name,
        message: '데이터가 부족합니다',
        ma: null,
        volatility: null,
        riseProbability: null,
        trend: null,
        similarStocks: [],
      })
    }

    const closePrices = prices.map((p) => p.close_price as number)

    // 분석 함수 import (Task 04에서 구현)
    const { calculateMA } = await import('@/lib/analysis/movingAverage')
    const { calculateVolatility } = await import('@/lib/analysis/volatility')
    const { calculateRiseProbability } = await import('@/lib/analysis/riseProbability')
    const { determineTrend } = await import('@/lib/analysis/trend')

    const ma = calculateMA(closePrices)
    const volatility = calculateVolatility(closePrices)
    const riseProbability = calculateRiseProbability(closePrices)
    const trend = determineTrend(ma)

    return NextResponse.json({
      code: stock.code,
      name: stock.name,
      ma,
      volatility,
      riseProbability,
      trend,
      similarStocks: [], // Task 04 완성 후 구현
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
