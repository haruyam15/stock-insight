'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getRateColor, formatRate } from './utils'

interface StockSuggestion {
  code: string
  name: string
  close: number
  changeRate: number
}

export function Header() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)

    if (timer.current) clearTimeout(timer.current)
    abortRef.current?.abort()

    if (!val.trim()) {
      setSuggestions([])
      setOpen(false)
      return
    }

    timer.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`/api/stocks?q=${encodeURIComponent(val)}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.stocks?.slice(0, 8) ?? [])
          setOpen(true)
        }
      } catch {
        // AbortError: 새 요청으로 대체된 경우 무시
      }
    }, 300)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (suggestions.length > 0) {
      router.push(`/stock/${suggestions[0].code}`)
    } else if (/^\d{6}$/.test(trimmed)) {
      router.push(`/stock/${trimmed}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
    clearSearch()
  }

  function handleSelect(code: string) {
    router.push(`/stock/${code}`)
    clearSearch()
  }

  function clearSearch() {
    setOpen(false)
    setSuggestions([])
  }

  function navClass(href: string) {
    const active = pathname === href
    return `text-sm font-medium transition-colors ${
      active ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
    }`
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* 로고 */}
        <Link href="/" className="text-lg font-bold text-slate-900 shrink-0">
          Stock Insight
        </Link>

        {/* 검색창 */}
        <div ref={wrapperRef} className="relative flex-1 max-w-sm">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => suggestions.length > 0 && setOpen(true)}
              placeholder="종목명 또는 코드 검색"
              className="w-full text-sm border border-slate-300 rounded-full px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900 placeholder-slate-400"
            />
          </form>
          {open && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.code}
                  onClick={() => handleSelect(s.code)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-800 tabular-nums">{s.close.toLocaleString('ko-KR')}원</p>
                    <p className={`text-xs font-medium tabular-nums ${getRateColor(s.changeRate)}`}>
                      {formatRate(s.changeRate)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 네비게이션 */}
        <nav className="flex gap-4 shrink-0">
          <Link href="/" className={navClass('/')}>홈</Link>
          <Link href="/ranking" className={navClass('/ranking')}>랭킹</Link>
        </nav>
      </div>
    </header>
  )
}
