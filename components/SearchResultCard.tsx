import Link from 'next/link'
import { getRateColor, getRateBadgeClass, formatRate } from './utils'

interface SearchResultCardProps {
  code: string
  name: string
  close: number | null
  changeRate: number | null
}

export function SearchResultCard({ code, name, close, changeRate }: SearchResultCardProps) {
  const rate = changeRate ?? 0
  const price = close ?? 0

  return (
    <Link
      href={`/stock/${code}`}
      className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all"
    >
      <div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">{name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{code}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {price > 0 ? `${price.toLocaleString('ko-KR')}원` : '-'}
        </p>
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 tabular-nums ${getRateBadgeClass(rate)}`}>
          {formatRate(rate)}
        </span>
      </div>
    </Link>
  )
}

export function SearchEmptyState({ query }: { query?: string }) {
  if (!query) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-slate-700 dark:text-slate-300 font-medium">종목을 검색해보세요</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">종목명 또는 6자리 종목코드로 검색할 수 있어요</p>
      </div>
    )
  }

  return (
    <div className="text-center py-20">
      <p className="text-4xl mb-4">😅</p>
      <p className="text-slate-700 dark:text-slate-300 font-medium">&lsquo;{query}&rsquo;에 대한 결과가 없습니다</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">종목명 또는 6자리 종목코드로 다시 검색해보세요</p>
    </div>
  )
}
