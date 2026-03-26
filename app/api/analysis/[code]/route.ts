import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateMA } from '@/lib/analysis/movingAverage'
import { calculateVolatility } from '@/lib/analysis/volatility'
import { calculateRiseProbability } from '@/lib/analysis/riseProbability'
import { determineTrend } from '@/lib/analysis/trend'
import { calculateCorrelation } from '@/lib/analysis/correlation'

type CandidateRow = {
  stock_code: string
  close_price: number
  base_date: string
  stocks: { name: string }
}

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

    // 최근 60일 종가 조회 (과거 → 최신 오름차순)
    const { data: prices, error: priceError } = await supabaseAdmin
      .from('stock_prices')
      .select('base_date, close_price')
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
        trend: '판단 불가',
        similarStocks: [],
      })
    }

    const closePrices = prices.map((p) => p.close_price as number)

    // 분석 지표 계산
    const ma = calculateMA(closePrices)
    const volatility = calculateVolatility(closePrices)
    const riseProbability = calculateRiseProbability(closePrices)
    const trend = determineTrend(ma)

    // 비슷한 종목 계산 (같은 날짜 범위의 TOP 거래량 종목 대상)
    const startDate = prices[0].base_date
    const endDate = prices[prices.length - 1].base_date

    const { data: candidatesRaw } = await supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, base_date, stocks!inner(name)')
      .neq('stock_code', code)
      .gte('base_date', startDate)
      .lte('base_date', endDate)
      .order('volume', { ascending: false })
      .limit(300)

    const candidates = (candidatesRaw ?? []) as unknown as CandidateRow[]

    // 후보 종목별 종가 배열 구성
    const candidateMap = new Map<string, { name: string; prices: number[] }>()
    for (const row of candidates) {
      if (!candidateMap.has(row.stock_code)) {
        candidateMap.set(row.stock_code, { name: row.stocks?.name ?? '', prices: [] })
      }
      candidateMap.get(row.stock_code)!.prices.push(row.close_price)
    }

    // 상관계수 계산 후 TOP 3 추출
    const similarStocks: { code: string; name: string; correlation: number }[] = []
    for (const [candCode, { name, prices: candPrices }] of candidateMap.entries()) {
      if (candPrices.length < 5) continue
      const len = Math.min(closePrices.length, candPrices.length)
      const r = calculateCorrelation(closePrices.slice(-len), candPrices.slice(-len))
      if (r !== null && r > 0.7) {
        similarStocks.push({ code: candCode, name, correlation: r })
      }
    }

    similarStocks.sort((a, b) => b.correlation - a.correlation)

    return NextResponse.json({
      code: stock.code,
      name: stock.name,
      ma,
      volatility,
      riseProbability,
      trend,
      similarStocks: similarStocks.slice(0, 3),
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '서버 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
