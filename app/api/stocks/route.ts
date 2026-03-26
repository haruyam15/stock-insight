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

    let query = supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
      .eq('base_date', targetDate)
      .order('volume', { ascending: false })
      .limit(50)

    if (q) {
      query = query.or(`stock_code.ilike.%${q}%,stocks.name.ilike.%${q}%`)
    }

    const { data, error } = await query
    if (error) throw error

    const stocks = (data ?? []).map((row: any) => ({
      code: row.stock_code,
      name: row.stocks?.name ?? '',
      close: row.close_price,
      changeRate: row.change_rate,
      volume: row.volume,
    }))

    return NextResponse.json({ date: targetDate, stocks })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
