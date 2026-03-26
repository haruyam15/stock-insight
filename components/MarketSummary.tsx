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

function StockRow({ stock }: { stock: TopStock }) {
  return (
    <Link
      href={`/stock/${stock.code}`}
      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-slate-900">{stock.name}</p>
        <p className="text-xs text-slate-400">{stock.code}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900 tabular-nums">{fmt(stock.close)}원</p>
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

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">{displayDate} 기준</p>

      {/* 시장 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">상승 종목</p>
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{summary.riseCount}</p>
          <p className="text-xs text-slate-400">/ {total}종목</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">하락 종목</p>
          <p className="text-2xl font-bold text-blue-600 tabular-nums">{summary.fallCount}</p>
          <p className="text-xs text-slate-400">/ {total}종목</p>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">보합 종목</p>
          <p className="text-2xl font-bold text-slate-600 tabular-nums">{summary.unchangedCount}</p>
          <p className="text-xs text-slate-400">/ {total}종목</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">평균 등락률</p>
          <p className={`text-2xl font-bold tabular-nums ${getRateColor(summary.avgChangeRate)}`}>
            {formatRate(summary.avgChangeRate)}
          </p>
        </div>
      </div>

      {/* TOP 3 섹션 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">📈 상승률 TOP 3</h3>
          <div className="space-y-1">
            {topRise.map((s) => <StockRow key={s.code} stock={s} />)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">📉 하락률 TOP 3</h3>
          <div className="space-y-1">
            {topFall.map((s) => <StockRow key={s.code} stock={s} />)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">🔥 거래량 TOP 3</h3>
          <div className="space-y-1">
            {topVolume.map((s) => <StockRow key={s.code} stock={s} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
