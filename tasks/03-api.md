# Task 03: API Routes 구현

## 목표

Next.js App Router 기반의 API Routes를 구현한다. Supabase에서 데이터를 조회하여 JSON으로 응답한다.

## 사전 확인 사항

- Task 01, 02 완료 후 진행 (DB에 데이터가 있어야 테스트 가능)
- `docs/api-spec.md` 의 응답 형식을 정확히 따를 것
- 모든 API는 서버 컴포넌트에서 실행되므로 `supabaseAdmin` 클라이언트 사용

## 구현할 파일 목록

```
src/app/api/
├── stocks/
│   ├── route.ts          # GET /api/stocks
│   └── [code]/
│       └── route.ts      # GET /api/stocks/[code]
├── ranking/
│   └── route.ts          # GET /api/ranking
├── market/
│   └── route.ts          # GET /api/market
└── analysis/
    └── [code]/
        └── route.ts      # GET /api/analysis/[code]
```

---

## 각 Route 구현 지침

### GET /api/stocks

- `q` 파라미터가 있으면 종목명 또는 종목코드로 검색 (ILIKE 사용)
- `date` 파라미터가 없으면 stock_prices 테이블에서 가장 최신 base_date를 가져와 사용
- stocks 테이블과 stock_prices 테이블을 조인하여 응답
- 결과는 최대 50건으로 제한

### GET /api/stocks/[code]

- 해당 종목코드의 최신 시세 1건 (latest) 조회
- `days` 파라미터 기준 최근 N일 히스토리 조회 (기본 30일)
- 데이터가 없으면 404 응답

### GET /api/ranking

- `type`: `rise`(상승률) | `fall`(하락률) | `volume`(거래량) | `value`(거래대금)
- `limit`: 기본 50, 최대 100
- 기준일자는 최신 영업일 자동 사용
- rise/fall은 change_rate 기준 정렬, volume/value는 각 컬럼 기준 정렬

### GET /api/market

- 특정 날짜의 전체 종목 통계 계산
  - 상승 종목 수: change_rate > 0
  - 하락 종목 수: change_rate < 0
  - 보합 종목 수: change_rate = 0
  - 평균 등락률
- 상승률 TOP 3, 하락률 TOP 3, 거래량 TOP 3 포함

### GET /api/analysis/[code]

- 해당 종목의 최근 60일 데이터를 가져온다
- `src/lib/analysis/` 의 함수들을 호출하여 지표 계산
- 계산 결과를 조합하여 응답
- 데이터가 부족한 경우 (5일 미만) null 반환

---

## 공통 규칙

- 모든 route는 `try/catch` 로 감싸고 에러 시 500 응답
- `NextResponse.json()` 사용
- 날짜 파라미터는 항상 유효성 검사 (8자리 숫자 형식)
- 환경변수 없으면 명확한 에러 메시지 출력

## 에러 응답 형식

```json
{ "error": "에러 메시지" }
```

## 완료 기준

- [ ] `/api/stocks` 검색 동작 확인
- [ ] `/api/stocks/[code]` 특정 종목 조회 확인
- [ ] `/api/ranking?type=rise` 상승률 랭킹 확인
- [ ] `/api/market` 시장 요약 확인
- [ ] `/api/analysis/[code]` 분석 데이터 확인
- [ ] 존재하지 않는 종목코드 요청 시 404 응답 확인

## 다음 단계

Task 04 (분석 로직) 로 이동한다.
