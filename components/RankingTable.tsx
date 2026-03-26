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
          <tr className="border-b border-slate-200">
            <th className="py-3 px-2 text-left w-10 text-xs font-semibold text-slate-500 uppercase tracking-wide">순위</th>
            <th className="py-3 px-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">종목명</th>
            <th className="py-3 px-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">현재가</th>
            <th className="py-3 px-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">등락률</th>
            <th className="py-3 px-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">거래량</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.code} className="hover:bg-slate-50 transition-colors">
              <td className={`py-3 px-2 font-medium tabular-nums ${item.rank <= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                {item.rank}
              </td>
              <td className="py-3 px-2">
                <Link href={`/stock/${item.code}`} className="hover:underline">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.code}</p>
                </Link>
              </td>
              <td className="py-3 px-2 text-right font-semibold text-slate-900 tabular-nums">
                {fmt(item.close)}원
              </td>
              <td className={`py-3 px-2 text-right font-medium tabular-nums ${getRateColor(item.changeRate)}`}>
                {formatRate(item.changeRate)}
              </td>
              <td className="py-3 px-2 text-right text-slate-600 tabular-nums hidden sm:table-cell">
                {fmt(item.volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
