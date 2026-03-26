# Task 04: 분석 로직 구현

## 상태: ✅ 완료

## 목표

주식 데이터를 분석하는 순수 함수들을 구현한다. 이 함수들은 API Route에서 호출된다.

## 사전 확인 사항

- Task 03 진행 중 또는 완료 후 함께 구현 가능
- `docs/analysis-algorithms.md` 의 수식을 정확히 따를 것
- 모든 함수는 순수 함수로 작성 (DB 접근 없음, 입력값 → 계산 결과 반환)
- 입력 데이터는 `{ date: string, close: number }[]` 형태의 배열

## 구현할 파일 목록

> 주의: `src/` 폴더 없음. 루트의 `lib/` 에 바로 생성한다.

```
lib/analysis/
├── movingAverage.ts     # 이동평균선
├── volatility.ts        # 변동성 (표준편차)
├── riseProbability.ts   # 상승 확률
├── trend.ts             # 추세 판단
└── correlation.ts       # 상관계수 (비슷한 종목)
```

---

## 각 파일 구현 지침

### movingAverage.ts

```typescript
// 입력: 종가 배열 (최신순 또는 과거순 무관하게 처리)
// 출력: { ma5: number | null, ma20: number | null, ma60: number | null }
export function calculateMA(prices: number[]): { ma5: number | null, ma20: number | null, ma60: number | null }

// 특정 N일 이동평균 계산 (가장 최근 N개 값의 평균)
export function calculateMAn(prices: number[], n: number): number | null
```

- 데이터가 N일 미만이면 해당 MA는 null 반환
- prices 배열은 날짜 오름차순(과거 → 최신) 으로 정렬된 상태를 가정

### volatility.ts

```typescript
// 입력: 종가 배열, 기간 (기본 20)
// 출력: { stdDev: number, level: '낮음' | '보통' | '높음' }
export function calculateVolatility(prices: number[], period?: number): { stdDev: number, level: string } | null
```

- 기간보다 데이터가 적으면 null 반환
- 등급 기준: docs/analysis-algorithms.md 참고

### riseProbability.ts

```typescript
// 입력: 종가 배열 (날짜 오름차순), 기간 (기본 30)
// 출력: { days: number, riseCount: number, probability: number }
export function calculateRiseProbability(prices: number[], period?: number): { days: number, riseCount: number, probability: number } | null
```

- 전일 대비 상승 여부를 하루씩 비교
- 비교 가능한 쌍이 period-1 개 생김에 주의

### trend.ts

```typescript
// 입력: MA 계산 결과
// 출력: '강한 상승 추세' | '단기 상승 추세' | '강한 하락 추세' | '단기 하락 추세' | '횡보' | '판단 불가'
export function determineTrend(ma: { ma5: number | null, ma20: number | null, ma60: number | null }): string
```

- MA 값이 null인 경우 '판단 불가' 반환
- 판단 기준: docs/analysis-algorithms.md 참고

### correlation.ts

```typescript
// 두 종가 배열 사이의 피어슨 상관계수 계산
// 입력: 두 개의 종가 배열 (같은 길이, 같은 날짜 순서)
// 출력: -1 ~ 1 사이의 숫자 (소수점 2자리)
export function calculateCorrelation(pricesA: number[], pricesB: number[]): number | null
```

- 배열 길이가 다르거나 5 미만이면 null 반환
- MVP에서는 correlation을 API에서 직접 계산하는 방식으로 구현 (성능 문제 시 추후 개선)

---

## 공통 규칙

- 모든 함수는 TypeScript 타입을 명확히 정의
- 빈 배열, null, undefined 입력에 안전하게 처리
- 소수점은 최대 2자리로 반올림하여 반환
- 함수별 간단한 JSDoc 주석 추가 (수식 설명)

## 완료 기준

- [x] `movingAverage.ts` 구현 및 MA5/MA20/MA60 계산 확인
- [x] `volatility.ts` 구현 및 등급 분류 확인
- [x] `riseProbability.ts` 구현 및 확률 계산 확인
- [x] `trend.ts` 구현 및 추세 판단 확인
- [x] `correlation.ts` 구현 및 상관계수 계산 확인
- [x] `/api/analysis/[code]` 호출 시 모든 지표가 포함된 응답 확인

## 다음 단계

Task 05 (프론트엔드 페이지) 로 이동한다.
