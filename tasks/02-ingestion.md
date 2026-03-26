# Task 02: 데이터 수집 스크립트

## 목표

금융위원회 주식시세정보 공공 API에서 데이터를 가져와 Supabase에 저장하는 스크립트를 작성한다.

## 사전 확인 사항

- Task 01 완료 후 진행 (stocks, stock_prices 테이블이 생성되어 있어야 함)
- `docs/api-spec.md` 의 공공데이터 API 파라미터를 확인할 것
- 환경변수 `PUBLIC_DATA_API_KEY` 가 `.env.local` 에 설정되어 있어야 한다
- API 키는 공공데이터포털(data.go.kr)에서 발급받는다

## 작성할 파일

`scripts/fetch-stocks.ts`

## 스크립트 동작 방식

1. 실행 시 날짜 인자를 받는다 (없으면 오늘 날짜 기준 최신 영업일 자동 계산)
2. 공공 API를 페이징하며 전체 데이터를 가져온다 (numOfRows: 1000)
3. stocks 테이블에 종목 기본 정보를 upsert한다
4. stock_prices 테이블에 시세 데이터를 upsert한다 (중복 실행해도 안전)
5. 완료 후 저장된 건수를 출력한다

## 구현 내용

```typescript
// scripts/fetch-stocks.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL = 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo'
const API_KEY = process.env.PUBLIC_DATA_API_KEY!

// 날짜를 YYYYMMDD 형식으로 변환
function formatDate(date: Date): string { ... }

// 최신 영업일 계산 (토/일/공휴일 제외, 단순 버전은 토/일만 처리)
function getLatestBusinessDate(): string { ... }

// 공공 API 한 페이지 호출
async function fetchPage(basDt: string, pageNo: number): Promise<any[]> { ... }

// 전체 데이터 수집 (페이징)
async function fetchAllStocks(basDt: string): Promise<any[]> { ... }

// Supabase에 저장
async function saveToDatabase(records: any[]): Promise<void> { ... }

// 메인 실행
async function main() {
  const basDt = process.argv[2] || getLatestBusinessDate()
  console.log(`기준일자: ${basDt}`)

  const records = await fetchAllStocks(basDt)
  await saveToDatabase(records)

  console.log(`완료: ${records.length}건 저장`)
}

main().catch(console.error)
```

## API 응답 필드 → DB 컬럼 매핑

| API 응답 필드 | DB 컬럼 | 비고 |
|-------------|---------|------|
| srtnCd | code (stocks), stock_code (stock_prices) | 종목코드 |
| itmsNm | name (stocks) | 종목명 |
| basDt | base_date | YYYYMMDD → DATE 변환 |
| mkp | open_price | 시가 |
| clpr | close_price | 종가 |
| hipr | high_price | 고가 |
| lopr | low_price | 저가 |
| trqu | volume | 거래량 |
| trPrc | trading_value | 거래대금 |
| fltRt | change_rate | 등락률 |
| vs | change_amount | 등락액 |

## 실행 방법

```bash
# 최신 영업일 데이터 수집
npx ts-node scripts/fetch-stocks.ts

# 특정 날짜 데이터 수집
npx ts-node scripts/fetch-stocks.ts 20250325
```

## 주의사항

- 공공 API는 T+1이므로 당일 데이터는 없다. 영업일 다음날 오후 1시 이후에 실행해야 한다
- API 호출 사이에 0.5초 딜레이를 넣어 서버 부하를 줄인다
- upsert 사용: `ON CONFLICT (stock_code, base_date) DO UPDATE`
- 빈 문자열이나 0인 값 처리에 주의 (API가 빈 문자열 반환하는 경우 있음)

## 완료 기준

- [ ] `scripts/fetch-stocks.ts` 작성 완료
- [ ] 스크립트 실행 후 `stock_prices` 테이블에 데이터 저장 확인
- [ ] 같은 날짜로 재실행해도 중복 없이 정상 동작 확인

## 다음 단계

Task 03 (API Routes) 로 이동한다.
