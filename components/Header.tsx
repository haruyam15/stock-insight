'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getRateColor, formatRate } from './utils'
import { useTheme } from './ThemeProvider'

interface StockSuggestion {
  code: string
  name: string
  close: number
  changeRate: number
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
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
  const { theme, toggle } = useTheme()

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
    return `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
    }`
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold leading-none">S</span>
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Stock<span className="text-indigo-600 dark:text-indigo-400">Insight</span>
          </span>
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
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 dark:bg-slate-800 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </form>
          {open && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.code}
                  onClick={() => handleSelect(s.code)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{s.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-800 dark:text-slate-200 tabular-nums">{s.close.toLocaleString('ko-KR')}원</p>
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
        <nav className="flex gap-1 shrink-0">
          <Link href="/" className={navClass('/')}>홈</Link>
          <Link href="/ranking" className={navClass('/ranking')}>랭킹</Link>
        </nav>

        {/* 테마 토글 */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label="테마 변경"
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  )
}
