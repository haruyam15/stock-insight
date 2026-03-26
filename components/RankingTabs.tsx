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
    <div className="flex border-b border-slate-200">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`/ranking?type=${tab.id}`)}
          className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            current === tab.id
              ? 'text-indigo-600 border-indigo-600 font-semibold'
              : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
