# Task 07: 검색 기능 구현

## 상태: ✅ 완료

## 목표

종목명 또는 종목코드로 검색하여 결과를 확인하고 상세 페이지로 이동할 수 있는 검색 기능을 구현한다.
Header의 자동완성 드롭다운 외에, 검색어가 없거나 다수 결과가 있을 경우를 위한 검색 결과 페이지도 제공한다.

## 사전 확인 사항

- `docs/design-guide.md` 의 색상·스타일 토큰 사용
- `docs/architecture.md` 의 렌더링 전략 확인
- `/api/stocks?q=검색어` API가 정상 동작하는지 먼저 확인
- Header.tsx의 기존 자동완성 로직과 충돌하지 않도록 주의

## 현재 상태 파악

`Header.tsx` 에 자동완성 드롭다운은 구현되어 있으나 다음 문제가 있다:
1. 자동완성 결과가 없을 때 엔터를 치면 아무 동작 안 함
2. 검색어로 직접 종목코드 입력 시 해당 페이지로 이동 안 됨
3. 검색 결과를 목록으로 보여주는 페이지 없음
4. `/api/stocks?q=` 의 실제 동작 여부 확인 필요

## 구현 내용

### 1. `/api/stocks` 라우트 검색 기능 확인 및 보완

`app/api/stocks/route.ts` 에서 `q` 파라미터를 받아 종목명/코드로 검색한다:

```typescript
// GET /api/stocks?q=삼성
// 종목명 ILIKE '%삼성%' 또는 종목코드 ILIKE '%005930%' 검색
// 최신 날짜 기준 가격 정보와 조인하여 반환
// 결과: { stocks: [{ code, name, close, changeRate }] }
```

확인사항:
- `q` 파라미터 없으면 전체 목록 반환 (또는 빈 배열)
- 종목명과 종목코드 모두 검색 가능한지 확인
- 결과가 없을 때 빈 배열 반환

### 2. Header.tsx 자동완성 로직 보완

현재 문제 수정:
```typescript
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!query.trim()) return

  const trimmed = query.trim()

  // 1. 자동완성 결과 중 첫 번째로 이동
  if (suggestions.length > 0) {
    router.push(`/stock/${suggestions[0].code}`)
    setOpen(false)
    setQuery('')
    return
  }

  // 2. 6자리 숫자면 종목코드로 바로 이동 시도
  if (/^\d{6}$/.test(trimmed)) {
    router.push(`/stock/${trimmed}`)
    setOpen(false)
    setQuery('')
    return
  }

  // 3. 그 외: 검색 결과 페이지로 이동
  router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  setOpen(false)
  setQuery('')
}
```

### 3. 검색 결과 페이지 (`/search`)

**파일 위치**: `app/search/page.tsx`

렌더링 전략: **동적 렌더링** (검색어가 사용자 입력 기반이므로 ISR 불가)
→ `export const dynamic = 'force-dynamic'`

구성:
```
app/search/
└── page.tsx    # 검색 결과 서버 컴포넌트
```

페이지 레이아웃:
```
[검색어] 검색 결과 (N건)
─────────────────────────────
종목카드 목록
  ┌─────────────────────────┐
  │ 삼성전자       005930   │
  │ ₩75,400       +1.23%   │
  └─────────────────────────┘
  ...

[결과 없음 시]
"'검색어'에 대한 결과가 없습니다"
종목명 또는 6자리 종목코드로 검색해보세요.
```

구현 예시:
```typescript
export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  if (!q?.trim()) {
    // 검색어 없으면 안내 메시지
    return <SearchEmptyState />
  }

  // API 호출하여 결과 가져오기
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stocks?q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
  })
  const data = await res.json()
  const stocks = data.stocks ?? []

  return <SearchResults query={q} stocks={stocks} />
}
```

> **주의**: 서버 컴포넌트에서 `fetch`를 내부 API로 호출하는 것은 불필요한 네트워크 왕복을 만든다.
> 대신 `supabaseAdmin`을 직접 사용하여 DB 쿼리를 페이지 내에서 실행한다.

실제 구현:
```typescript
// supabaseAdmin으로 직접 쿼리
const date = await getLatestDate()
const { data } = await supabaseAdmin
  .from('stock_prices')
  .select('stock_code, close_price, change_rate, stocks!inner(name, code)')
  .eq('base_date', date)
  .or(`stocks.name.ilike.%${q}%,stock_code.ilike.%${q}%`)
  .limit(50)
```

### 4. 검색 결과 카드 컴포넌트

`components/SearchResultCard.tsx` (서버 컴포넌트):
- 종목명, 종목코드, 현재가, 등락률 표시
- 카드 전체 클릭 시 `/stock/[code]` 이동 (Link 컴포넌트)
- 등락률 색상: `docs/design-guide.md` 의 getRateColor 사용

---

## 파일 목록

```
app/search/
└── page.tsx                  # 검색 결과 페이지 (신규)
components/SearchResultCard.tsx  # 검색 결과 카드 (신규)
components/Header.tsx            # handleSubmit 로직 보완
app/api/stocks/route.ts          # 검색 기능 확인 및 보완
```

---

## 완료 기준

- [x] `/api/stocks?q=삼성` 호출 시 종목 목록 반환 확인
- [x] Header 검색창에서 엔터 시 `/search?q=삼성` 으로 이동
- [x] 6자리 숫자 입력 후 엔터 시 `/stock/005930` 으로 바로 이동
- [x] 자동완성 목록 클릭 시 해당 종목 상세로 이동
- [x] `/search?q=삼성` 페이지에서 검색 결과 카드 목록 표시
- [x] 검색 결과 없을 때 안내 메시지 표시
- [x] 검색어 없이 `/search` 접근 시 검색 유도 메시지 표시
- [x] 모바일 레이아웃 깨짐 없음

## 다음 단계

Task 08 (페이지네이션) 으로 이동한다.
