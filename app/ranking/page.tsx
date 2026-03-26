export const revalidate = 3600

import { RankingTabs } from '@/components/RankingTabs'
import { RankingTable } from '@/components/RankingTable'
import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate } from '@/lib/db'

type RankingRow = {
  stock_code: string
  close_price: number | null
  change_rate: number | null
  volume: number | null
  stocks: { name: string }
}

const VALID_TYPES = ['rise', 'fall', 'volume', 'value'] as const
type RankingType = typeof VALID_TYPES[number]

const LABEL: Record<RankingType, string> = {
  rise: '상승률',
  fall: '하락률',
  volume: '거래량',
  value: '거래대금',
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const rankingType: RankingType = VALID_TYPES.includes(type as RankingType)
    ? (type as RankingType)
    : 'rise'

  const date = await getLatestDate()

  let query = supabaseAdmin
    .from('stock_prices')
    .select('stock_code, close_price, change_rate, volume, trading_value, stocks!inner(name)')
    .eq('base_date', date)
    .limit(50)

  if (rankingType === 'rise') {
    query = query.order('change_rate', { ascending: false }).gt('change_rate', 0)
  } else if (rankingType === 'fall') {
    query = query.order('change_rate', { ascending: true }).lt('change_rate', 0)
  } else if (rankingType === 'volume') {
    query = query.order('volume', { ascending: false })
  } else {
    query = query.order('trading_value', { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return <p className="text-center py-20 text-slate-400">데이터를 불러오지 못했습니다.</p>
  }

  const rows = (data ?? []) as unknown as RankingRow[]
  const items = rows.map((r, i) => ({
    rank: i + 1,
    code: r.stock_code,
    name: r.stocks?.name ?? '',
    close: r.close_price ?? 0,
    changeRate: r.change_rate ?? 0,
    volume: r.volume ?? 0,
  }))

  const displayDate = `${date.slice(0, 4)}년 ${date.slice(5, 7)}월 ${date.slice(8, 10)}일`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">TOP 랭킹</h1>
        <p className="text-slate-500 mt-1">{displayDate} 기준</p>
      </div>

      <RankingTabs current={rankingType} />

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">{LABEL[rankingType]} 순위</h2>
        <RankingTable items={items} />
      </div>
    </div>
  )
}
