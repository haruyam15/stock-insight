export const revalidate = 3600

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateMA } from '@/lib/analysis/movingAverage'
import { calculateVolatility } from '@/lib/analysis/volatility'
import { calculateRiseProbability } from '@/lib/analysis/riseProbability'
import { determineTrend } from '@/lib/analysis/trend'
import { calculateCorrelation } from '@/lib/analysis/correlation'
import { StockChart } from '@/components/StockChart'
import { AnalysisCard } from '@/components/AnalysisCard'
import { getRateColor, formatRate } from '@/components/utils'

function fmt(n: number | null | undefined) {
  if (n == null) return '-'
  return n.toLocaleString('ko-KR')
}

function fmtValue(n: number | null | undefined) {
  if (n == null) return '-'
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(0)}억원`
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만원`
  return `${n.toLocaleString('ko-KR')}원`
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const { data: stock, error: stockError } = await supabaseAdmin
    .from('stocks')
    .select('code, name')
    .eq('code', code)
    .single()

  if (stockError || !stock) notFound()

  const { data: priceRows } = await supabaseAdmin
    .from('stock_prices')
    .select('base_date, open_price, close_price, high_price, low_price, volume, trading_value, change_rate, change_amount')
    .eq('stock_code', code)
    .order('base_date', { ascending: true })
    .limit(60)

  if (!priceRows || priceRows.length === 0) notFound()

  const latest = priceRows[priceRows.length - 1]
  const history = priceRows.map((p) => ({
    date: p.base_date as string,
    close: p.close_price as number,
  }))

  const closePrices = priceRows.map((p) => p.close_price as number)
  const ma = calculateMA(closePrices)
  const volatility = calculateVolatility(closePrices)
  const riseProbability = calculateRiseProbability(closePrices)
  const trend = determineTrend(ma)

  const startDate = priceRows[0].base_date
  const endDate = latest.base_date

  const { data: candidates } = await supabaseAdmin
    .from('stock_prices')
    .select('stock_code, close_price, base_date, stocks!inner(name)')
    .neq('stock_code', code)
    .gte('base_date', startDate)
    .lte('base_date', endDate)
    .order('volume', { ascending: false })
    .limit(300)

  type CandidateRow = {
    stock_code: string
    close_price: number
    base_date: string
    stocks: { name: string }
  }

  const candidateRows = (candidates ?? []) as unknown as CandidateRow[]
  const candidateMap = new Map<string, { name: string; prices: number[] }>()
  for (const row of candidateRows) {
    if (!candidateMap.has(row.stock_code)) {
      candidateMap.set(row.stock_code, { name: row.stocks?.name ?? '', prices: [] })
    }
    candidateMap.get(row.stock_code)!.prices.push(row.close_price)
  }

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
  const top3Similar = similarStocks.slice(0, 3)

  const displayDate = `${(latest.base_date as string).slice(0, 4)}년 ${(latest.base_date as string).slice(5, 7)}월 ${(latest.base_date as string).slice(8, 10)}일`

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{displayDate} 기준</p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{stock.name}</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{stock.code}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{fmt(latest.close_price)}원</p>
            <p className={`text-lg font-semibold mt-1 tabular-nums ${getRateColor(latest.change_rate ?? 0)}`}>
              {formatRate(latest.change_rate ?? 0)}
              {latest.change_amount != null && (
                <span className="text-sm ml-1">({latest.change_amount > 0 ? '+' : ''}{fmt(latest.change_amount)}원)</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 sm:grid-cols-4">
          {[
            ['시가', latest.open_price],
            ['고가', latest.high_price],
            ['저가', latest.low_price],
            ['거래량', latest.volume],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                {label === '거래량' ? fmt(val as number) : `${fmt(val as number)}원`}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">거래대금</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmtValue(latest.trading_value)}</p>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <StockChart history={history} />

      {/* 분석 지표 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">분석 지표</h2>
        <AnalysisCard
          currentPrice={latest.close_price as number}
          ma={ma}
          volatility={volatility}
          riseProbability={riseProbability}
          trend={trend}
        />
      </div>

      {/* 비슷한 종목 */}
      {top3Similar.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">비슷한 종목</h2>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 shadow-sm">
            {top3Similar.map((s) => (
              <Link
                key={s.code}
                href={`/stock/${s.code}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{s.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">상관계수</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{s.correlation.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
