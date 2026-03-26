# Task 10: 데이터 패칭 성능 개선 & 캐싱 전략

## 상태: ⬜ 미착수

## 목표

현재 발생 중인 데이터 패칭 병목을 제거한다.
외부 라이브러리 추가 없이 **Next.js 내장 캐싱 API + Supabase 쿼리 최적화**로 해결한다.

## 사전 확인 사항

- `docs/architecture.md` 의 DB 구조 확인
- Task 08 완료 후 진행 (랭킹 API가 offset 파라미터를 지원하는 상태여야 함)
- 기능 변경 없음. 동일한 결과를 더 빠르게 반환하는 것이 목표

---

## 현재 병목 분석

### 병목 1 — 홈 페이지: 전체 2880+ 행 풀스캔 (가장 심각)

```typescript
// app/page.tsx — 현재
// 2880개 행 전체를 JS로 가져온 뒤 메모리에서 계산
const { data } = await supabaseAdmin
  .from('stock_prices')
  .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
  .eq('base_date', date)
// → 필요한 건 요약 통계 3개 + TOP 종목 9개뿐인데 2880행 전송
```

`/api/market/route.ts`도 동일한 풀스캔 로직이 중복되어 있음.

### 병목 2 — `getLatestDate()` 중복 호출

```
app/page.tsx          → getLatestDate() 호출
app/ranking/page.tsx  → getLatestDate() 호출 (별도 DB 왕복)
app/stock/[code]/page.tsx → 호출 안 하지만 개별 쿼리
```

같은 요청 사이클 내에서 동일한 쿼리가 여러 번 나감.

### 병목 3 — 종목 상세: 상관계수 후보 300행 인메모리 계산

```typescript
// app/stock/[code]/page.tsx
.limit(300)  // 300행을 JS로 가져와 피어슨 계산
```

결과가 자주 바뀌지 않는데 매 요청마다 재계산.

### 병목 4 — Supabase 클라이언트: 커넥션 풀링 미적용

```typescript
// lib/supabase.ts — 현재
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
// Serverless 환경에서 매 요청마다 새 DB 커넥션 생성 위험
```

---

## 개선 전략 (우선순위 순)

---

### 개선 1 — `getLatestDate()` 에 `React.cache()` 적용 【즉시 효과】

**파일**: `lib/db.ts`

```typescript
import { cache } from 'react'
import { supabaseAdmin } from './supabase'

// React.cache(): 동일 요청 사이클 내 중복 호출을 1번으로 줄임
export const getLatestDate = cache(async (): Promise<string> => {
  const { data, error } = await supabaseAdmin
    .from('stock_prices')
    .select('base_date')
    .order('base_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) throw new Error('최신 날짜 조회 실패')
  return data.base_date
})
```

**효과**: 하나의 SSR 렌더에서 `getLatestDate()`를 3번 호출해도 DB 쿼리는 1번만 실행.

---

### 개선 2 — 홈 페이지 쿼리 분리 (풀스캔 제거) 【가장 큰 효과】

**파일**: `app/page.tsx` + `app/api/market/route.ts`

2880행 전체 fetch → 5개의 작고 빠른 쿼리로 분리:

```typescript
// 1. 기준일자 (이미 cache()로 1번만 실행)
const date = await getLatestDate()

// 2. 요약 통계: 상승/하락/보합 수, 평균 등락률
// Supabase RPC (PostgreSQL 함수) 또는 병렬 count 쿼리 사용
const [riseResult, fallResult, unchangedResult] = await Promise.all([
  supabaseAdmin
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })
    .eq('base_date', date)
    .gt('change_rate', 0),
  supabaseAdmin
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })
    .eq('base_date', date)
    .lt('change_rate', 0),
  supabaseAdmin
    .from('stock_prices')
    .select('*', { count: 'exact', head: true })
    .eq('base_date', date)
    .eq('change_rate', 0),
])

// 3. 평균 등락률: 상위 N개로 근사 또는 별도 쿼리
// (Supabase는 AVG 집계를 직접 지원하지 않으므로 RPC 또는 상위 샘플링)

// 4. TOP 3 (각각 3행씩, 총 9행)
const [topRise, topFall, topVolume] = await Promise.all([
  supabaseAdmin
    .from('stock_prices')
    .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
    .eq('base_date', date)
    .gt('change_rate', 0)
    .order('change_rate', { ascending: false })
    .limit(3),
  supabaseAdmin
    .from('stock_prices')
    .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
    .eq('base_date', date)
    .lt('change_rate', 0)
    .order('change_rate', { ascending: true })
    .limit(3),
  supabaseAdmin
    .from('stock_prices')
    .select('stock_code, close_price, change_rate, volume, stocks!inner(name)')
    .eq('base_date', date)
    .order('volume', { ascending: false })
    .limit(3),
])
```

> **주의**: 평균 등락률(avgChangeRate) 계산은 전체 행이 필요하다.
> 두 가지 방법 중 선택:
> - **방법 A** (권장): Supabase RPC로 PostgreSQL `AVG()` 함수 호출
> - **방법 B** (단순): 평균 등락률 표시를 홈에서 제거하거나 랭킹 TOP 500 샘플로 근사

**방법 A — RPC 사용 (Supabase Dashboard에서 함수 생성 필요)**:

```sql
-- Supabase Dashboard → SQL Editor에서 실행
CREATE OR REPLACE FUNCTION get_market_summary(p_date DATE)
RETURNS JSON AS $$
  SELECT json_build_object(
    'riseCount',   COUNT(*) FILTER (WHERE change_rate > 0),
    'fallCount',   COUNT(*) FILTER (WHERE change_rate < 0),
    'unchangedCount', COUNT(*) FILTER (WHERE change_rate = 0),
    'avgChangeRate', ROUND(AVG(change_rate)::numeric, 2)
  )
  FROM stock_prices
  WHERE base_date = p_date
$$ LANGUAGE sql STABLE;
```

```typescript
// 사용
const { data: summary } = await supabaseAdmin.rpc('get_market_summary', {
  p_date: date,
})
```

**효과**: 2880행 전체 전송 → 1행(JSON) 전송으로 전환. 예상 속도 5~10배 향상.

---

### 개선 3 — `unstable_cache` 로 비싼 쿼리 캐싱 【ISR 보완】

**파일**: `lib/cache.ts` (신규)

Next.js의 `unstable_cache`는 서버 액션과 서버 컴포넌트에서 사용하는 캐시로,
React `cache()`와 달리 **요청 간에도 유지**된다.

```typescript
import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from './supabase'

// 시장 요약 — 1시간 캐시, 'market' 태그로 무효화 가능
export const getCachedMarketSummary = unstable_cache(
  async (date: string) => {
    // 개선 2의 분리된 쿼리 또는 RPC 호출
    const { data } = await supabaseAdmin.rpc('get_market_summary', { p_date: date })
    return data
  },
  ['market-summary'],
  { revalidate: 3600, tags: ['market'] }
)

// 최신 날짜 — 1시간 캐시
export const getCachedLatestDate = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from('stock_prices')
      .select('base_date')
      .order('base_date', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) throw new Error('최신 날짜 조회 실패')
    return data.base_date as string
  },
  ['latest-date'],
  { revalidate: 3600, tags: ['market'] }
)

// 종목 상세 분석 결과 — 1시간 캐시
export const getCachedStockAnalysis = unstable_cache(
  async (code: string, date: string) => {
    const { data } = await supabaseAdmin
      .from('stock_prices')
      .select('base_date, close_price')
      .eq('stock_code', code)
      .lte('base_date', date)
      .order('base_date', { ascending: true })
      .limit(60)
    return data
  },
  ['stock-analysis'],
  { revalidate: 3600, tags: ['stock'] }
)
```

**사용 패턴**:

```typescript
// app/page.tsx
import { getCachedLatestDate, getCachedMarketSummary } from '@/lib/cache'

// lib/db.ts의 getLatestDate()를 캐시 버전으로 교체
const date = await getCachedLatestDate()
const summary = await getCachedMarketSummary(date)
```

---

### 개선 4 — Supabase 커넥션 풀러 적용 【Serverless 안정성】

**파일**: `lib/supabase.ts`

Supabase는 Direct connection(포트 5432)과 Transaction Pooler(포트 6543) 두 가지를 제공한다.
Next.js 서버리스 환경에서는 **Transaction Pooler** 사용을 권장한다.

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 클라이언트 컴포넌트용 (변경 없음)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 전용: db 옵션으로 스키마 고정, 서버리스 최적화
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'public' },
    global: {
      headers: { 'x-my-custom-header': 'stock-insight' },
    },
  }
)
```

> **환경변수 추가**: Supabase 대시보드 → Settings → Database → Connection String → Transaction pooler URL
> ```
> # .env.local
> SUPABASE_DB_URL=postgres://postgres.xxxx:password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
> ```
> `supabaseAdmin`에서 직접 사용하지 않아도, `SUPABASE_DB_URL`이 설정되면 Supabase 클라이언트가 자동으로 활용함.

---

### 개선 5 — 종목 상세 상관계수: 쿼리 범위 축소

**파일**: `app/stock/[code]/page.tsx`

```typescript
// 현재: 전체 거래량 기준 상위 300개 종목의 60일치 가격
.limit(300)

// 개선: 상위 50개 종목만 대상으로 (정확도 소폭 감소, 속도 대폭 향상)
.limit(150)  // 50 종목 × 약 3일치 → 아니면
// 더 나은 방법: 거래량 상위 50 종목 코드를 먼저 가져온 후 해당 기간 가격만 조회
```

**최적화된 쿼리**:

```typescript
// Step 1: 거래량 상위 50 종목 코드 조회 (최신일 기준)
const { data: topCodes } = await supabaseAdmin
  .from('stock_prices')
  .select('stock_code')
  .eq('base_date', endDate)
  .neq('stock_code', code)
  .order('volume', { ascending: false })
  .limit(50)

const codeList = (topCodes ?? []).map(r => r.stock_code)

// Step 2: 해당 종목들의 기간 가격만 조회
const { data: candidates } = await supabaseAdmin
  .from('stock_prices')
  .select('stock_code, close_price, base_date, stocks!inner(name)')
  .in('stock_code', codeList)
  .gte('base_date', startDate)
  .lte('base_date', endDate)
  .order('stock_code')
  .order('base_date')
```

---

### 개선 6 — `Promise.all` 병렬 패칭 적용 패턴

이미 여러 쿼리를 순차 실행하는 곳을 병렬로 전환:

```typescript
// 현재 (순차): 각 쿼리가 이전 쿼리 완료를 기다림
const date = await getLatestDate()
const stock = await fetchStock(code)
const prices = await fetchPrices(code)

// 개선 (병렬): getLatestDate 이후 독립 쿼리들은 동시에 실행
const date = await getLatestDate()
const [stock, prices] = await Promise.all([
  fetchStock(code),
  fetchPrices(code),
])
```

`app/stock/[code]/page.tsx`에서 종목 기본정보와 가격 데이터를 병렬로 패칭.

---

## 구현 순서

1. **개선 1** — `lib/db.ts` `React.cache()` 적용 (5분, 즉시 효과)
2. **개선 3** — `lib/cache.ts` `unstable_cache` 생성 (20분)
3. **개선 2** — 홈 페이지 쿼리 분리 (가장 임팩트 큼)
   - 방법 A: Supabase RPC 함수 생성 후 호출
   - 방법 B: 평균 등락률 제외 후 5개 병렬 쿼리
4. **개선 5** — 종목 상세 상관계수 쿼리 최적화 (10분)
5. **개선 6** — `Promise.all` 병렬화 적용 (10분)
6. **개선 4** — Supabase 풀러 환경변수 확인 (배포 환경)

---

## 파일 목록

```
lib/db.ts                        # React.cache() 적용
lib/cache.ts                     # 신규 — unstable_cache 래퍼들
lib/supabase.ts                  # 서버리스 옵션 추가
app/page.tsx                     # 분리된 쿼리로 교체
app/api/market/route.ts          # 분리된 쿼리로 교체 (page.tsx와 동기화)
app/stock/[code]/page.tsx        # 상관계수 쿼리 최적화 + Promise.all
```

---

## 완료 기준

- [ ] `getLatestDate()`에 `React.cache()` 적용 확인
- [ ] `lib/cache.ts` 생성 및 `unstable_cache` 래퍼 구현
- [ ] 홈 페이지: 전체 행 fetch 제거, 분리된 쿼리로 교체
- [ ] 홈 페이지: 동일한 요약 데이터(상승/하락/보합/평균) 정상 표시 확인
- [ ] 종목 상세: 상관계수 후보 쿼리 2단계로 분리 확인
- [ ] `app/stock/[code]/page.tsx`: 종목 기본정보 + 가격 데이터 `Promise.all` 병렬화
- [ ] 브라우저 Network 탭에서 응답 시간 개선 확인 (홈 페이지 목표: 1s 이하)

## 참고

- [Next.js `unstable_cache` 문서](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [React `cache()` 문서](https://react.dev/reference/react/cache)
- [Supabase 서버리스 가이드](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## 다음 단계

Task 08, 09 완료 후 진행하거나 병렬로 진행 가능.
```
