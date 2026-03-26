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
  src/lib/analysis/
        ↓
[Next.js 프론트엔드]
  App Router Pages
```

---

## 디렉토리 구조

```
stock-insight/
├── scripts/
│   └── fetch-stocks.ts          # 공공데이터 수집 스크립트
├── src/
│   ├── app/
│   │   ├── page.tsx             # 홈 (시장 리포트)
│   │   ├── ranking/
│   │   │   └── page.tsx         # TOP 랭킹
│   │   ├── stock/
│   │   │   └── [code]/
│   │   │       └── page.tsx     # 종목 상세
│   │   └── api/
│   │       ├── stocks/
│   │       │   ├── route.ts     # GET /api/stocks
│   │       │   └── [code]/
│   │       │       └── route.ts # GET /api/stocks/[code]
│   │       ├── ranking/
│   │       │   └── route.ts     # GET /api/ranking
│   │       ├── market/
│   │       │   └── route.ts     # GET /api/market
│   │       └── analysis/
│   │           └── [code]/
│   │               └── route.ts # GET /api/analysis/[code]
│   ├── lib/
│   │   ├── supabase.ts          # Supabase 클라이언트
│   │   └── analysis/
│   │       ├── movingAverage.ts
│   │       ├── volatility.ts
│   │       ├── riseProbability.ts
│   │       ├── trend.ts
│   │       └── correlation.ts
│   └── components/
│       ├── StockChart.tsx       # 가격 차트
│       ├── RankingTable.tsx     # 랭킹 테이블
│       ├── MarketSummary.tsx    # 시장 요약
│       ├── AnalysisCard.tsx     # 분석 지표 카드
│       └── GuideTooltip.tsx     # 초보자 설명 툴팁
├── docs/                        # 프로젝트 문서
└── tasks/                       # 클로드 작업 지침
```

---

## 데이터베이스 (Supabase)

### stocks 테이블
종목 기본 정보. 종목코드가 고유 키.

### stock_prices 테이블
일별 시세 데이터. (종목코드 + 기준일자)가 복합 고유 키.

상세 스키마는 [tasks/01-database.md](../tasks/01-database.md) 참고.

---

## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_DATA_API_KEY=
```

---

## 데이터 수집 정책

- 공공 API는 T+1이므로 매일 영업일 오후 1시 이후 실행
- MVP에서는 수동으로 스크립트 실행 (`npx ts-node scripts/fetch-stocks.ts`)
- 한 번에 최대 1000건씩 페이징 처리
- 이미 저장된 날짜의 데이터는 upsert로 처리 (중복 방지)
