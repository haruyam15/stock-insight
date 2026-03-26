export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'
import { getLatestDate } from '@/lib/db'
import { SearchResultCard, SearchEmptyState } from '@/components/SearchResultCard'

type StockRow = {
  stock_code: string
  close_price: number | null
  change_rate: number | null
  stocks: { name: string }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  if (!query) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">종목 검색</h1>
        <SearchEmptyState />
      </div>
    )
  }

  const date = await getLatestDate()

  // 종목명으로 검색
  const { data: nameMatches } = await supabaseAdmin
    .from('stocks')
    .select('code')
    .ilike('name', `%${query}%`)
    .limit(50)

  const nameMatchCodes = (nameMatches ?? []).map((r: { code: string }) => r.code)

  // 종목코드 패턴이면 코드로도 검색
  const isCodeLike = /^\d/.test(query)
  let allCodes = nameMatchCodes
  if (isCodeLike) {
    const { data: codeMatches } = await supabaseAdmin
      .from('stocks')
      .select('code')
      .ilike('code', `%${query}%`)
      .limit(50)
    const codeMatchCodes = (codeMatches ?? []).map((r: { code: string }) => r.code)
    allCodes = [...new Set([...nameMatchCodes, ...codeMatchCodes])]
  }

  if (allCodes.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          &lsquo;{query}&rsquo; 검색 결과
        </h1>
        <SearchEmptyState query={query} />
      </div>
    )
  }

  const { data, error } = await supabaseAdmin
    .from('stock_prices')
    .select('stock_code, close_price, change_rate, stocks!inner(name)')
    .eq('base_date', date)
    .in('stock_code', allCodes)
    .order('volume', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          &lsquo;{query}&rsquo; 검색 결과
        </h1>
        <p className="text-center py-20 text-slate-400 dark:text-slate-500">데이터를 불러오지 못했습니다.</p>
      </div>
    )
  }

  const rows = (data ?? []) as unknown as StockRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          &lsquo;{query}&rsquo; 검색 결과
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{rows.length}건</p>
      </div>

      {rows.length === 0 ? (
        <SearchEmptyState query={query} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <SearchResultCard
              key={row.stock_code}
              code={row.stock_code}
              name={row.stocks?.name ?? ''}
              close={row.close_price}
              changeRate={row.change_rate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
