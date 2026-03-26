# 시스템 아키텍처

## 전체 흐름

```
[금융위원회 공공데이터 API]
        ↓ (T+1, 영업일 오후 1시 이후)
[데이터 수집 스크립트]
  scripts/fetch-stocks.ts
        ↓
[Supabase (PostgreSQL)]
  - stocks (종목 기본 정보)
  - stock_prices (일별 시세)
        ↓
[Next.js API Routes]
  /api/stocks
  /api/stocks/[code]
  /api/ranking
  /api/market
  /api/analysis/[code]
        ↓
[분석 로직]
  lib/analysis/
        ↓
[Next.js 프론트엔드]
  App Router Pages (ISR, revalidate: 3600)
```

---

## 디렉토리 구조

> 주의: 이 프로젝트는 `src/` 폴더를 사용하지 않는다. `app/`, `lib/`, `components/` 모두 프로젝트 루트에 위치한다.

```
stock-insight/
├── scripts/
│   └── fetch-stocks.ts          # 공공데이터 수집 스크립트
├── app/
│   ├── page.tsx                 # 홈 (시장 리포트)
│   ├── ranking/
│   │   └── page.tsx             # TOP 랭킹
│   ├── stock/
│   │   └── [code]/
│   │       └── page.tsx         # 종목 상세
│   └── api/
│       ├── stocks/
│       │   ├── route.ts         # GET /api/stocks
│       │   └── [code]/
│       │       └── route.ts     # GET /api/stocks/[code]
│       ├── ranking/
│       │   └── route.ts         # GET /api/ranking
│       ├── market/
│       │   └── route.ts         # GET /api/market
│       └── analysis/
│           └── [code]/
│               └── route.ts     # GET /api/analysis/[code]
├── lib/
│   ├── supabase.ts              # Supabase 클라이언트
│   ├── db.ts                    # 공통 DB 유틸 (최신 날짜 조회 등)
│   └── analysis/
│       ├── movingAverage.ts
│       ├── volatility.ts
│       ├── riseProbability.ts
│       ├── trend.ts
│       └── correlation.ts
├── components/
│   ├── Header.tsx               # 상단 네비게이션 + 검색창
│   ├── StockChart.tsx           # 가격 차트
│   ├── RankingTable.tsx         # 랭킹 테이블
│   ├── MarketSummary.tsx        # 시장 요약
│   ├── AnalysisCard.tsx         # 분석 지표 카드
│   └── GuideTooltip.tsx         # 초보자 설명 툴팁
├── docs/                        # 프로젝트 문서
└── tasks/                       # 클로드 작업 지침
```

---

## 경로 별칭

`tsconfig.json`에서 `@/*` 는 프로젝트 루트(`./`)를 가리킨다.

```
@/lib/supabase    →  ./lib/supabase.ts
@/lib/analysis/   →  ./lib/analysis/
@/components/     →  ./components/
```

---

## 데이터베이스 (Supabase)

### stocks 테이블
종목 기본 정보. `code` 컬럼이 고유 키.

### stock_prices 테이블
일별 시세 데이터. (`stock_code` + `base_date`)가 복합 고유 키.

상세 스키마는 [tasks/01-database.md](../tasks/01-database.md) 참고.

### 중요: 외래키 없음
`stock_prices.stock_code` 와 `stocks.code` 사이에 외래키 제약이 없다.
Supabase 조인 문법(`stocks!inner`)을 사용하면 "relationship not found" 에러 발생.

**따라서 모든 API Route에서 쿼리를 분리하여 작성한다:**
```typescript
// ❌ 이렇게 하면 에러
supabase.from('stock_prices').select('*, stocks!inner(name)')

// ✅ 이렇게 두 번 쿼리 후 JS에서 합친다
const { data: prices } = await supabase.from('stock_prices').select(...)
const { data: stocks } = await supabase.from('stocks').select('code, name').in('code', codes)
const nameMap = Object.fromEntries(stocks.map(s => [s.code, s.name]))
```

---

## 페이지 렌더링 전략

데이터가 T+1(하루 1회 갱신)이므로 ISR을 사용한다.

```typescript
// 모든 page.tsx 상단에 추가
export const revalidate = 3600 // 1시간마다 재생성
```

| 페이지 | 전략 | 이유 |
|--------|------|------|
| 홈 (시장 리포트) | ISR (3600) | 하루 1회 갱신 |
| 랭킹 | ISR (3600) | 하루 1회 갱신 |
| 종목 상세 | ISR (3600) | 2880개 전부 빌드 불필요 |
| 검색 | 클라이언트 fetch | 사용자 입력 기반 |

---

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=https://[프로젝트ID].supabase.co   # 반드시 전체 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PUBLIC_DATA_API_KEY=...
```

> 주의: `NEXT_PUBLIC_SUPABASE_URL` 은 프로젝트 ID만 넣으면 안 되고 반드시 `https://` 로 시작하는 전체 URL이어야 한다.

---

## 데이터 수집 정책

- 공공 API는 T+1이므로 매일 영업일 오후 1시 이후 실행
- 스크립트 실행: `npm run fetch` 또는 `npx tsx scripts/fetch-stocks.ts`
- 한 번에 최대 1000건씩 페이징, 500건씩 배치 upsert
- 이미 저장된 날짜의 데이터는 upsert로 처리 (중복 실행 안전)
