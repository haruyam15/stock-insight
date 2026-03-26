import Link from 'next/link'
import { getRateColor, formatRate } from './utils'

interface TopStock {
  code: string
  name: string
  close: number
  changeRate: number
  volume: number
}

interface MarketSummaryProps {
  date: string
  summary: {
    riseCount: number
    fallCount: number
    unchangedCount: number
    avgChangeRate: number
  }
  topRise: TopStock[]
  topFall: TopStock[]
  topVolume: TopStock[]
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

function StockRow({ stock, rank }: { stock: TopStock; rank: number }) {
  const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700']
  const rankColor = rank <= 3 ? rankColors[rank - 1] : 'text-slate-300 dark:text-slate-600'

  return (
    <Link
      href={`/stock/${stock.code}`}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
    >
      <span className={`text-xs font-bold w-4 tabular-nums ${rankColor}`}>{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{stock.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{stock.code}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{fmt(stock.close)}원</p>
        <p className={`text-xs font-medium tabular-nums ${getRateColor(stock.changeRate)}`}>
          {formatRate(stock.changeRate)}
        </p>
      </div>
    </Link>
  )
}

export function MarketSummary({ date, summary, topRise, topFall, topVolume }: MarketSummaryProps) {
  const total = summary.riseCount + summary.fallCount + summary.unchangedCount
  const displayDate = `${date.slice(0, 4)}년 ${date.slice(5, 7)}월 ${date.slice(8, 10)}일`

  const riseRatio = total > 0 ? (summary.riseCount / total) * 100 : 0
  const fallRatio = total > 0 ? (summary.fallCount / total) * 100 : 0
  const unchangedRatio = total > 0 ? (summary.unchangedCount / total) * 100 : 0

  return (
    <div className="space-y-5">
      {/* 날짜 배지 */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
          {displayDate} 기준
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">전체 {total.toLocaleString()}종목</span>
      </div>

      {/* 시장 현황 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">상승</p>
            <span className="text-xs text-rose-500 font-medium">{riseRatio.toFixed(0)}%</span>
          </div>
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{summary.riseCount.toLocaleString()}</p>
          <div className="mt-2 h-1 bg-rose-100 dark:bg-rose-950/50 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${riseRatio}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">하락</p>
            <span className="text-xs text-blue-500 font-medium">{fallRatio.toFixed(0)}%</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 tabular-nums">{summary.fallCount.toLocaleString()}</p>
          <div className="mt-2 h-1 bg-blue-100 dark:bg-blue-950/50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${fallRatio}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">보합</p>
            <span className="text-xs text-slate-400 font-medium">{unchangedRatio.toFixed(0)}%</span>
          </div>
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-300 tabular-nums">{summary.unchangedCount.toLocaleString()}</p>
          <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${unchangedRatio}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">평균 등락률</p>
          <p className={`text-2xl font-bold tabular-nums ${getRateColor(summary.avgChangeRate)}`}>
            {formatRate(summary.avgChangeRate)}
          </p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">전 종목 평균</p>
        </div>
      </div>

      {/* 시장 폭 바 */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">시장 폭</p>
        <div className="flex rounded-full overflow-hidden h-2">
          <div className="bg-rose-500 transition-all" style={{ width: `${riseRatio}%` }} />
          <div className="bg-slate-200 dark:bg-slate-600 transition-all" style={{ width: `${unchangedRatio}%` }} />
          <div className="bg-blue-500 transition-all" style={{ width: `${fallRatio}%` }} />
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />상승 {riseRatio.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500 inline-block" />보합 {unchangedRatio.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />하락 {fallRatio.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* TOP 3 섹션 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              상승률 TOP 3
            </h3>
          </div>
          <div className="px-1 py-2">
            {topRise.map((s, i) => <StockRow key={s.code} stock={s} rank={i + 1} />)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              하락률 TOP 3
            </h3>
          </div>
          <div className="px-1 py-2">
            {topFall.map((s, i) => <StockRow key={s.code} stock={s} rank={i + 1} />)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              거래량 TOP 3
            </h3>
          </div>
          <div className="px-1 py-2">
            {topVolume.map((s, i) => <StockRow key={s.code} stock={s} rank={i + 1} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
