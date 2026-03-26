# Task 01: 데이터베이스 스키마 설계

## 상태: ✅ 완료

## 목표

Supabase(PostgreSQL)에 Stock Insight 서비스에 필요한 테이블을 생성한다.

## 사전 확인 사항

- `docs/architecture.md` 를 읽고 전체 흐름을 파악할 것
- 환경변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 가 `.env.local` 에 설정되어 있어야 한다
- Supabase 클라이언트 설정은 `src/lib/supabase.ts` 에 작성한다

## 생성할 테이블

### 1. stocks 테이블

종목 기본 정보를 저장한다. 한 번 저장되면 자주 바뀌지 않는 정보.

```sql
CREATE TABLE stocks (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,   -- 종목코드 (예: 005930)
  name VARCHAR(100) NOT NULL,          -- 종목명 (예: 삼성전자)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stocks_code ON stocks(code);
CREATE INDEX idx_stocks_name ON stocks(name);
```

### 2. stock_prices 테이블

일별 시세 데이터를 저장한다. 공공 API에서 가져온 데이터가 여기에 쌓인다.

```sql
CREATE TABLE stock_prices (
  id BIGSERIAL PRIMARY KEY,
  stock_code VARCHAR(20) NOT NULL,     -- 종목코드 (stocks.code 참조)
  base_date DATE NOT NULL,             -- 기준일자
  open_price BIGINT,                   -- 시가
  close_price BIGINT NOT NULL,         -- 종가
  high_price BIGINT,                   -- 고가
  low_price BIGINT,                    -- 저가
  volume BIGINT,                       -- 거래량
  trading_value BIGINT,                -- 거래대금
  change_rate DECIMAL(8,2),            -- 등락률 (%)
  change_amount BIGINT,                -- 전일 대비 등락액
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stock_code, base_date)        -- 같은 종목 + 날짜 중복 방지
);

CREATE INDEX idx_stock_prices_code ON stock_prices(stock_code);
CREATE INDEX idx_stock_prices_date ON stock_prices(base_date DESC);
CREATE INDEX idx_stock_prices_code_date ON stock_prices(stock_code, base_date DESC);
CREATE INDEX idx_stock_prices_change_rate ON stock_prices(base_date, change_rate DESC);
CREATE INDEX idx_stock_prices_volume ON stock_prices(base_date, volume DESC);
```

## 작업 순서

1. `src/lib/supabase.ts` 파일을 생성한다

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 전용 클라이언트 (API Routes, 스크립트에서 사용)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

2. Supabase 대시보드 SQL Editor에서 위의 CREATE TABLE 쿼리를 순서대로 실행한다
3. 테이블 생성 후 Supabase 대시보드에서 테이블과 인덱스가 정상 생성됐는지 확인한다

## 완료 기준

- [x] `lib/supabase.ts` 생성 완료 (경로 변경: src/ 없음)
- [x] `stocks` 테이블 생성 완료
- [x] `stock_prices` 테이블 생성 완료
- [x] 인덱스 생성 완료
- [x] Supabase에서 테이블 확인 완료

## 다음 단계

Task 02 (데이터 수집 스크립트) 로 이동한다.
