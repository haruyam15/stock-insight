# Task 08: 페이지네이션

## 상태: ⬜ 미착수

## 목표

랭킹 페이지에서 현재 50건으로 제한된 데이터를 페이지 단위로 계속 불러올 수 있도록 구현한다.
"더 보기" 방식의 클라이언트 사이드 페이지네이션을 적용한다.

## 사전 확인 사항

- `docs/design-guide.md` 의 색상·버튼 스타일 사용
- Task 06 완료 후 진행 (스타일 기준 통일 후)
- 랭킹 탭(상승률/하락률/거래량/거래대금)별로 독립적으로 동작해야 함
- ISR 서버 컴포넌트(`app/ranking/page.tsx`)는 초기 데이터만 담당, 추가 로드는 클라이언트에서 처리

## 라이브러리 선정

**추가 라이브러리 불필요** — Next.js + Intersection Observer API로 구현한다.

- `react-intersection-observer` 패키지 설치
  ```bash
  npm install react-intersection-observer
  ```
  - 크기: ~2KB (경량)
  - 역할: 스크롤 하단 감지 → 자동 추가 로드 트리거
  - 페이지 번호 버튼 없이 자연스럽게 스크롤하면 자동으로 다음 데이터 로드

## 구현 전략

### 방식: 무한 스크롤 (Infinite Scroll)

- 초기 50건: 서버 컴포넌트(ISR)에서 렌더링 → SEO, 초기 로드 성능 유리
- 추가 데이터: 클라이언트 컴포넌트에서 `/api/ranking` API 호출
- 스크롤 하단 도달 → Intersection Observer 감지 → 다음 페이지 요청

### 데이터 흐름

```
서버 (ISR)
  app/ranking/page.tsx
    → 초기 50건 쿼리 (offset 0)
    → <RankingInfiniteList initialItems={...} type={rankingType} />

클라이언트
  components/RankingInfiniteList.tsx
    → 초기 데이터 표시
    → 스크롤 하단 감지 (useInView)
    → GET /api/ranking?type=rise&offset=50&limit=50
    → 데이터 누적 표시
    → 더 이상 데이터 없으면 "마지막 종목입니다" 표시
```

### API 수정: `/api/ranking`

`app/api/ranking/route.ts` 에 `offset`, `limit` 파라미터 추가:

```typescript
// GET /api/ranking?type=rise&offset=0&limit=50
const offset = Number(searchParams.get('offset') ?? 0)
const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100) // 최대 100

query = query.range(offset, offset + limit - 1)

// 응답에 hasMore 포함
return NextResponse.json({
  items: [...],
  offset,
  limit,
  hasMore: data.length === limit, // limit 만큼 왔으면 더 있을 수 있음
})
```

### 컴포넌트 구조

#### `components/RankingInfiniteList.tsx` (신규, 'use client')

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { RankingTable } from './RankingTable'

interface Props {
  initialItems: RankingItem[]
  type: 'rise' | 'fall' | 'volume' | 'value'
}

export function RankingInfiniteList({ initialItems, type }: Props) {
  const [items, setItems] = useState(initialItems)
  const [offset, setOffset] = useState(initialItems.length)
  const [hasMore, setHasMore] = useState(initialItems.length === 50)
  const [loading, setLoading] = useState(false)

  const { ref, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    // 탭 변경 시 초기화
    setItems(initialItems)
    setOffset(initialItems.length)
    setHasMore(initialItems.length === 50)
  }, [type, initialItems])

  useEffect(() => {
    if (!inView || !hasMore || loading) return
    loadMore()
  }, [inView])

  async function loadMore() {
    setLoading(true)
    const res = await fetch(`/api/ranking?type=${type}&offset=${offset}&limit=50`)
    const data = await res.json()
    const newItems = data.items ?? []
    setItems(prev => [...prev, ...newItems.map((item, i) => ({ ...item, rank: offset + i + 1 }))])
    setOffset(prev => prev + newItems.length)
    setHasMore(data.hasMore)
    setLoading(false)
  }

  return (
    <div>
      <RankingTable items={items} />

      {/* 스크롤 감지 트리거 */}
      <div ref={ref} className="py-4 text-center">
        {loading && (
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
        {!hasMore && !loading && (
          <p className="text-xs text-slate-400">마지막 종목입니다</p>
        )}
      </div>
    </div>
  )
}
```

### `app/ranking/page.tsx` 수정

```typescript
// 기존: .limit(50)
// 변경: 초기 50건만, offset/range 방식으로

const { data } = await query.range(0, 49) // 첫 50건

// RankingTable 대신 RankingInfiniteList 사용
return (
  <RankingInfiniteList initialItems={items} type={rankingType} />
)
```

---

## 파일 목록

```
app/api/ranking/route.ts          # offset, limit 파라미터 추가
app/ranking/page.tsx              # RankingInfiniteList 사용으로 변경
components/RankingInfiniteList.tsx  # 신규 — 무한 스크롤 컴포넌트
```

---

## 완료 기준

- [ ] `npm install react-intersection-observer` 설치 완료
- [ ] `/api/ranking?type=rise&offset=50&limit=50` 호출 시 51~100위 데이터 반환
- [ ] 랭킹 페이지 스크롤 하단 도달 시 추가 데이터 자동 로드
- [ ] 로딩 중 점 애니메이션 표시
- [ ] 탭 전환 시 데이터 초기화 후 해당 탭 데이터 표시
- [ ] 마지막 데이터 도달 시 "마지막 종목입니다" 표시
- [ ] 연속 스크롤로 100위 이상 데이터 로드 확인

## 다음 단계

Task 09 (기간별 인사이트) 으로 이동한다.
