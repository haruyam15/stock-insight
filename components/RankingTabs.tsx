'use client'

import { useRouter } from 'next/navigation'

const TABS = [
  { id: 'rise', label: '상승률' },
  { id: 'fall', label: '하락률' },
  { id: 'volume', label: '거래량' },
  { id: 'value', label: '거래대금' },
] as const

export function RankingTabs({ current }: { current: string }) {
  const router = useRouter()

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`/ranking?type=${tab.id}`)}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            current === tab.id
              ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
