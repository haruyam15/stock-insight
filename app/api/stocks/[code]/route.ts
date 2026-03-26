import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { searchParams } = req.nextUrl
    const days = Math.min(Number(searchParams.get('days') ?? 30), 90)

    // 종목 기본 정보 조회
    const { data: stock, error: stockError } = await supabaseAdmin
      .from('stocks')
      .select('code, name')
      .eq('code', code)
      .single()

    if (stockError || !stock) {
      return NextResponse.json({ error: '종목을 찾을 수 없습니다' }, { status: 404 })
    }

    // 최근 N일 시세 조회
    const { data: prices, error: priceError } = await supabaseAdmin
      .from('stock_prices')
      .select('base_date, open_price, close_price, high_price, low_price, volume, trading_value, change_rate, change_amount')
      .eq('stock_code', code)
      .order('base_date', { ascending: false })
      .limit(days)

    if (priceError) throw priceError

    if (!prices || prices.length === 0) {
      return NextResponse.json({ error: '시세 데이터가 없습니다' }, { status: 404 })
    }

    const latest = prices[0]
    const history = [...prices].reverse().map((p) => ({
      date: p.base_date,
      open: p.open_price,
      close: p.close_price,
      high: p.high_price,
      low: p.low_price,
      volume: p.volume,
      tradingValue: p.trading_value,
      changeRate: p.change_rate,
    }))

    return NextResponse.json({
      code: stock.code,
      name: stock.name,
      latest: {
        date: latest.base_date,
        open: latest.open_price,
        close: latest.close_price,
        high: latest.high_price,
        low: latest.low_price,
        volume: latest.volume,
        tradingValue: latest.trading_value,
        changeRate: latest.change_rate,
        changeAmount: latest.change_amount,
      },
      history,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
