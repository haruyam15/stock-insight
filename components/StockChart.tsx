'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface HistoryItem {
  date: string
  close: number
}

function computeMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null
    const slice = prices.slice(i - period + 1, i + 1)
    return Math.round(slice.reduce((a, b) => a + b, 0) / period)
  })
}

export function StockChart({ history }: { history: HistoryItem[] }) {
  const [showMA5, setShowMA5] = useState(true)
  const [showMA20, setShowMA20] = useState(true)

  const prices = history.map((h) => h.close)
  const ma5 = computeMA(prices, 5)
  const ma20 = computeMA(prices, 20)

  const data = history.map((h, i) => ({
    date: (h.date as string).slice(5).replace('-', '/'),
    종가: h.close,
    MA5: ma5[i],
    MA20: ma20[i],
  }))

  const minPrice = Math.min(...prices) * 0.98
  const maxPrice = Math.max(...prices) * 1.02

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700">가격 차트 (최근 {history.length}일)</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMA5(!showMA5)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              showMA5
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            MA5
          </button>
          <button
            onClick={() => setShowMA20(!showMA20)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              showMA20
                ? 'bg-violet-500 border-violet-500 text-white'
                : 'border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            MA20
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v) => v.toLocaleString('ko-KR')}
            width={60}
          />
          <Tooltip
            formatter={(value, name) => [
              value != null ? `${Number(value).toLocaleString('ko-KR')}원` : '-',
              name,
            ]}
            labelStyle={{ fontSize: 12, color: '#0f172a' }}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}
          />
          <Line
            type="monotone"
            dataKey="종가"
            stroke="#0f172a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {showMA5 && (
            <Line
              type="monotone"
              dataKey="MA5"
              stroke="#4f46e5"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          )}
          {showMA20 && (
            <Line
              type="monotone"
              dataKey="MA20"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {/* 범례 */}
      <div className="flex gap-4 mt-2 justify-center text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5 bg-slate-900" />종가
        </span>
        {showMA5 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-indigo-600" />MA5
          </span>
        )}
        {showMA20 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-violet-500" />MA20
          </span>
        )}
      </div>
    </div>
  )
}
