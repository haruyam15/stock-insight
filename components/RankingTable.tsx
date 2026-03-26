import Link from 'next/link'
import { getRateColor, formatRate } from './utils'

export interface RankingItem {
  rank: number
  code: string
  name: string
  close: number
  changeRate: number
  volume: number
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export function RankingTable({ items }: { items: RankingItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="py-3 px-2 text-left w-10 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">순위</th>
            <th className="py-3 px-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">종목명</th>
            <th className="py-3 px-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">현재가</th>
            <th className="py-3 px-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">등락률</th>
            <th className="py-3 px-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hidden sm:table-cell">거래량</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((item) => (
            <tr key={item.code} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <td className="py-3 px-2">
                {item.rank === 1 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold">1</span>
                ) : item.rank === 2 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold">2</span>
                ) : item.rank === 3 ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 text-xs font-bold">3</span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums pl-1">{item.rank}</span>
                )}
              </td>
              <td className="py-3 px-2">
                <Link href={`/stock/${item.code}`} className="group">
                  <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{item.code}</p>
                </Link>
              </td>
              <td className="py-3 px-2 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {fmt(item.close)}원
              </td>
              <td className={`py-3 px-2 text-right font-medium tabular-nums ${getRateColor(item.changeRate)}`}>
                {formatRate(item.changeRate)}
              </td>
              <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400 tabular-nums hidden sm:table-cell">
                {fmt(item.volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
