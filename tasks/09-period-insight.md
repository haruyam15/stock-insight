# Task 09: 기간별 인사이트 & 종목 상세 강화

## 상태: ⬜ 미착수

## 목표

1. **기간별 인사이트**: 사용자가 날짜 범위를 선택하면 해당 기간의 시장/종목 분석 결과를 보여준다
2. **종목 상세 강화**: 각 종목 상세 페이지에 그래프 및 텍스트 인사이트를 보강한다

대상 사용자: 주식 초보자 → 어려운 용어 없이 "이 기간에 어떤 일이 있었나요?" 형태로 설명

## 사전 확인 사항

- `docs/design-guide.md` 의 색상·스타일 토큰 사용
- `docs/analysis-algorithms.md` 의 분석 수식 확인
- Task 06, 07, 08 완료 후 진행

---

## Part 1: 기간별 인사이트

### 1-1. 기간 선택 UI

**위치**: 홈 페이지(`app/page.tsx`) 하단 또는 별도 `/insight` 페이지

**권장 방식**: 홈 페이지에 기간 인사이트 섹션 추가 (별도 페이지는 만들지 않음)

날짜 선택 컴포넌트: `components/PeriodSelector.tsx` (`'use client'`)

```typescript
'use client'

// 선택 방식: 드롭다운 프리셋 + 직접 입력
// 프리셋: 최근 1주일 / 최근 1개월 / 최근 3개월
// 직접 입력: <input type="date" /> 두 개 (시작일, 종료일)

interface Props {
  onSelect: (startDate: string, endDate: string) => void
}
```

프리셋 버튼 디자인:
```
[최근 1주일] [최근 1개월] [최근 3개월]
시작일: [____-__-__]  종료일: [____-__-__]  [조회]
```

### 1-2. 기간 인사이트 API

**엔드포인트**: `GET /api/insight?start=2025-01-01&end=2025-03-01`

**파일**: `app/api/insight/route.ts` (신규)

계산 항목:
```typescript
interface PeriodInsightResponse {
  period: { start: string; end: string; tradingDays: number }
  market: {
    avgChangeRate: number      // 기간 평균 등락률
    riseCount: number          // 상승 마감일 수
    fallCount: number          // 하락 마감일 수
    totalStocks: number        // 분석 종목 수
    topRisers: StockSummary[]  // 기간 최다 상승 종목 TOP 5
    topFallers: StockSummary[] // 기간 최다 하락 종목 TOP 5
  }
  summary: string // 텍스트 요약 (아래 참고)
}
```

**텍스트 요약 생성 규칙** (`lib/analysis/insightText.ts`):

```typescript
// 규칙 기반 텍스트 생성 (AI 없음)
export function generatePeriodSummary(data: PeriodData): string {
  const { tradingDays, riseCount, fallCount, avgChangeRate, topRiser, topFaller } = data
  const riseRatio = riseCount / tradingDays

  let trend = ''
  if (riseRatio >= 0.6) trend = '전반적으로 상승세를 보인'
  else if (riseRatio <= 0.4) trend = '전반적으로 하락세를 보인'
  else trend = '혼조세를 보인'

  return `이 기간(${tradingDays}거래일)은 ${trend} 구간입니다. ` +
    `상승 마감일이 ${riseCount}일, 하락 마감일이 ${fallCount}일이었으며, ` +
    `평균 등락률은 ${avgChangeRate > 0 ? '+' : ''}${avgChangeRate.toFixed(2)}%였습니다. ` +
    `가장 많이 오른 종목은 ${topRiser.name}(+${topRiser.changeRate.toFixed(1)}%), ` +
    `가장 많이 내린 종목은 ${topFaller.name}(${topFaller.changeRate.toFixed(1)}%)입니다.`
}
```

### 1-3. 기간 인사이트 표시 컴포넌트

**`components/PeriodInsight.tsx`** (`'use client'`):

레이아웃:
```
┌─────────────────────────────────────────┐
│  기간 분석: 2025.01.01 ~ 2025.03.01    │
│  (총 42거래일)                          │
├─────────────────────────────────────────┤
│  📝 요약                                │
│  "이 기간은 전반적으로 상승세를 보인..." │
├──────────────┬──────────────────────────┤
│ 상승 마감    │ 하락 마감                │
│ 28일 (67%)  │ 14일 (33%)              │
├──────────────┴──────────────────────────┤
│  🏆 이 기간 TOP 상승 종목               │
│  1. 삼성전자  +23.5%                   │
│  2. SK하이닉스 +18.2%                  │
│  ...                                    │
├─────────────────────────────────────────┤
│  📉 이 기간 TOP 하락 종목               │
│  1. 카카오  -15.3%                     │
│  ...                                    │
└─────────────────────────────────────────┘
```

동작:
1. 날짜 선택 → API 호출 → 결과 표시
2. 로딩 중: 스켈레톤 카드
3. 데이터 없음: "선택한 기간에 데이터가 없습니다. 영업일 기준 데이터만 제공됩니다."

---

## Part 2: 종목 상세 인사이트 강화

**위치**: `app/stock/[code]/page.tsx` 기존 페이지에 섹션 추가

### 2-1. 기간별 종목 차트 강화

기존 `StockChart.tsx`(30일 고정) → 기간 선택 가능하도록 확장

**`components/StockChartWithPeriod.tsx`** (`'use client'`):

```
기간 선택: [1개월] [3개월] [6개월] [1년]
┌──────────────────────────────────────────┐
│            가격 차트 (Recharts)           │
│  ─ 종가   ─ MA5   ─ MA20               │
└──────────────────────────────────────────┘
```

### 2-2. 텍스트 인사이트 카드

**`components/StockInsightText.tsx`** (서버 컴포넌트):

분석 데이터를 받아 초보자 친화적 텍스트로 변환한다.

표시 항목:
```
┌─────────────────────────────────────────┐
│  🔍 이 종목은 어떤가요?                  │
├─────────────────────────────────────────┤
│  📈 추세                                │
│  "최근 5일 평균이 20일 평균보다 높아요.  │
│   단기적으로 상승 흐름을 보이고 있어요." │
├─────────────────────────────────────────┤
│  📊 변동성                              │
│  "최근 20일 기준 변동성이 '보통' 수준   │
│   입니다. 가격이 크게 흔들리지 않는     │
│   편이에요."                            │
├─────────────────────────────────────────┤
│  🎲 최근 30일 상승 확률                 │
│  [████████░░] 62%                       │
│  "최근 30일 중 19일이 전날보다          │
│   올랐어요."                            │
├─────────────────────────────────────────┤
│  ⚠️ 투자 주의 안내                      │
│  "이 정보는 과거 데이터 기반 분석..."   │
└─────────────────────────────────────────┘
```

**텍스트 생성 함수** (`lib/analysis/stockInsightText.ts`):

```typescript
export function generateTrendText(trend: string, ma: MAResult): string {
  switch (trend) {
    case '강한 상승 추세':
      return `MA5(${ma.ma5?.toLocaleString()}원)가 MA20(${ma.ma20?.toLocaleString()}원)과 MA60(${ma.ma60?.toLocaleString()}원)보다 높아요. 단기·중기·장기 모두 상승 흐름입니다.`
    case '단기 상승 추세':
      return `최근 5일 평균이 20일 평균보다 높아요. 단기적으로 상승 흐름을 보이고 있어요.`
    case '횡보':
      return `이동평균선들이 비슷한 수준이에요. 뚜렷한 방향 없이 횡보 중입니다.`
    case '단기 하락 추세':
      return `최근 5일 평균이 20일 평균보다 낮아요. 단기적으로 하락 흐름을 보이고 있어요.`
    case '강한 하락 추세':
      return `단기·중기·장기 평균 모두 하락 구조예요. 전반적인 하락 추세입니다.`
    default:
      return `데이터가 충분하지 않아 추세를 판단하기 어렵습니다.`
  }
}

export function generateVolatilityText(level: string, stdDev: number): string {
  const map = {
    '낮음': `최근 20일 기준 변동성이 낮은 편이에요 (표준편차 ${stdDev.toFixed(1)}%). 가격이 비교적 안정적으로 움직이고 있어요.`,
    '보통': `최근 20일 기준 변동성이 보통 수준이에요 (표준편차 ${stdDev.toFixed(1)}%). 크게 흔들리지 않는 편입니다.`,
    '높음': `최근 20일 기준 변동성이 높아요 (표준편차 ${stdDev.toFixed(1)}%). 가격이 하루하루 크게 움직일 수 있어요.`,
  }
  return map[level] ?? '변동성 데이터를 계산할 수 없어요.'
}

export function generateRiseProbabilityText(probability: number, riseCount: number, days: number): string {
  return `최근 ${days}일 중 ${riseCount}일이 전날보다 올랐어요. 상승 확률은 ${probability.toFixed(0)}%입니다.`
}
```

### 2-3. 미니 시장 컨텍스트

종목 상세 하단에 "이 종목과 같은 날 시장은?" 요약 추가:

```
┌─────────────────────────────────────────┐
│  📅 가장 최근 거래일 시장 요약          │
│  상승 종목: 823개  하락 종목: 1,205개   │
│  → 전체 시장이 약세였던 날, 이 종목은  │
│     +2.3% 상승했습니다.                │
└─────────────────────────────────────────┘
```

---

## 파일 목록

### 신규 파일

```
app/api/insight/route.ts            # 기간 인사이트 API
lib/analysis/insightText.ts         # 기간 인사이트 텍스트 생성
lib/analysis/stockInsightText.ts    # 종목 인사이트 텍스트 생성
components/PeriodSelector.tsx       # 날짜 범위 선택 UI
components/PeriodInsight.tsx        # 기간 인사이트 표시
components/StockChartWithPeriod.tsx # 기간 선택 가능한 차트
components/StockInsightText.tsx     # 종목 텍스트 인사이트 카드
```

### 수정 파일

```
app/page.tsx                        # 기간 인사이트 섹션 추가
app/stock/[code]/page.tsx           # 텍스트 인사이트 카드, 강화된 차트 추가
```

---

## 완료 기준

### 기간 인사이트

- [ ] `PeriodSelector` — 프리셋(1주/1달/3달) + 직접 날짜 입력 동작
- [ ] `/api/insight?start=&end=` — 기간 내 상승/하락일 수, TOP 종목 반환
- [ ] 기간 텍스트 요약 자동 생성 및 표시
- [ ] TOP 상승/하락 종목 5개 표시, 클릭 시 종목 상세 이동
- [ ] 데이터 없는 날짜 범위 선택 시 안내 메시지

### 종목 상세 강화

- [ ] 차트 기간 버튼(1달/3달/6달/1년) 전환 동작
- [ ] 추세 텍스트 인사이트 카드 표시
- [ ] 변동성 텍스트 설명 표시
- [ ] 상승 확률 프로그레스바 + 텍스트 설명 표시
- [ ] 면책 문구 표준 문안(`docs/design-guide.md`) 적용

## 다음 단계

별도 task 없음. 이후 추가 기능은 새 task 파일을 생성한다.
