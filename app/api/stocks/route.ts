import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate, isValidDate, toIsoDate } from '@/lib/db'

type StockRow = {
  stock_code: string
  close_price: number | null
  change_rate: number | null
  volume: number | null
  stocks: { name: string }
}

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

    let stockCodes: string[] | null = null

    if (q) {
      // 종목명으로 검색: stocks 테이블에서 먼저 코드 목록 조회
      const { data: nameMatches } = await supabaseAdmin
        .from('stocks')
        .select('code')
        .ilike('name', `%${q}%`)
        .limit(50)

      const nameMatchCodes = (nameMatches ?? []).map((r: { code: string }) => r.code)

      // 종목코드 직접 매칭 (6자리 숫자 패턴 포함)
      const isCodeLike = /^\d/.test(q)
      if (isCodeLike) {
        const { data: codeMatches } = await supabaseAdmin
          .from('stocks')
          .select('code')
          .ilike('code', `%${q}%`)
          .limit(50)
        const codeMatchCodes = (codeMatches ?? []).map((r: { code: string }) => r.code)
        stockCodes = [...new Set([...nameMatchCodes, ...codeMatchCodes])]
      } else {
        stockCodes = nameMatchCodes
      }
    }

    let query = supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
      .eq('base_date', targetDate)
      .order('volume', { ascending: false })
      .limit(50)

    if (stockCodes !== null) {
      if (stockCodes.length === 0) {
        return NextResponse.json({ date: targetDate, stocks: [] })
      }
      query = query.in('stock_code', stockCodes)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as unknown as StockRow[]
    const stocks = rows.map((row) => ({
      code: row.stock_code,
      name: row.stocks?.name ?? '',
      close: row.close_price,
      changeRate: row.change_rate,
      volume: row.volume,
    }))

    return NextResponse.json({ date: targetDate, stocks })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '서버 오류가 발생했습니다'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
