export const revalidate = 3600

import { MarketSummary } from '@/components/MarketSummary'
import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate } from '@/lib/db'
import Link from 'next/link'

type MarketRow = {
  stock_code: string
  close_price: number | null
  change_rate: number | null
  volume: number | null
  stocks: { name: string }
}

export default async function HomePage() {
  let date = ''
  let data: MarketRow[] | null = null

  try {
    date = await getLatestDate()
    const result = await supabaseAdmin
      .from('stock_prices')
      .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
      .eq('base_date', date)
    if (!result.error) {
      data = (result.data ?? []) as unknown as MarketRow[]
    }
  } catch {
    return (
      <div className="text-center py-20 text-slate-400">
        데이터를 불러오지 못했습니다.
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        데이터를 불러오지 못했습니다.
      </div>
    )
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
  const sorted = [...data].sort((a, b) => (b.change_rate ?? 0) - (a.change_rate ?? 0))
  const toTop = (items: MarketRow[]) =>
    items.map((r) => ({
      code: r.stock_code,
      name: r.stocks?.name ?? '',
      changeRate: r.change_rate ?? 0,
      close: r.close_price ?? 0,
      volume: r.volume ?? 0,
    }))

  const summary = {
    riseCount,
    fallCount,
    unchangedCount,
    avgChangeRate: Number((rateSum / data.length).toFixed(2)),
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Daily Market</p>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">시장 리포트</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">어제 데이터로 오늘을 공부해요</p>
        </div>
        <Link
          href="/ranking"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
        >
          전체 랭킹
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      <MarketSummary
        date={date}
        summary={summary}
        topRise={toTop(sorted.slice(0, 3))}
        topFall={toTop(sorted.slice(-3).reverse())}
        topVolume={toTop([...data].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, 3))}
      />
    </div>
  )
}
