# Task 11: 타임머신 모의투자

## 상태: ⬜ 미착수

## 목표

사용자가 **과거 날짜로 이동**해 그 시점의 주가로 모의 매수를 하고,
이후 날짜로 이동해 투자 결과(수익/손실)를 확인할 수 있는 기능을 제공한다.

- "만약 그때 샀다면?" 시뮬레이션
- 로그인/저장 없음 — localStorage 기반 세션 유지 (새로고침 후에도 유지, 탭 닫으면 초기화)
- 실시간 데이터 없음 — DB에 있는 과거 데이터만 사용

대상 사용자: 주식 초보자 → 직접 투자해보는 체험으로 시장 감각 익히기

## 사전 확인 사항

- `docs/architecture.md` DB 구조 확인 (stock_prices, stocks 테이블)
- Task 07 완료 후 진행 (종목 검색 기능 필요)
- 별도 페이지 `/time-travel` 로 구현

---

## 전체 흐름

```
[1단계: 투자 날짜 선택]
  └─ 과거 날짜 선택 → 해당일 종목 목록 표시

[2단계: 종목 매수]
  └─ 종목 선택 → 수량 입력 → 포트폴리오에 추가
  └─ 총 투자금 실시간 표시

[3단계: 결과 확인 날짜 선택]
  └─ 투자일 이후의 날짜 선택 → 수익/손실 계산
  └─ 종목별 등락률, 전체 수익률 표시
```

---

## Part 1: 라우팅 & 레이아웃

### 1-1. 페이지 생성

**파일**: `app/time-travel/page.tsx`

```typescript
export const revalidate = 3600

export default function TimeTravelPage() {
  // 서버 컴포넌트 — 초기 데이터(가능한 날짜 범위) 제공
  // 실제 상태 관리는 클라이언트 컴포넌트에 위임
}
```

**페이지 레이아웃**:
```
┌─────────────────────────────────────────────┐
│  ⏰ 타임머신 모의투자                         │
│  "과거로 돌아가 투자해보세요"                 │
├─────────────────────────────────────────────┤
│  [Step 1: 투자 날짜] → [Step 2: 종목 선택] → [Step 3: 결과 확인] │
│  ●─────────────────────────────────         │
├─────────────────────────────────────────────┤
│  (각 단계별 컨텐츠)                          │
└─────────────────────────────────────────────┘
```

### 1-2. 네비게이션 링크 추가

홈 페이지(`app/page.tsx`) 또는 헤더 컴포넌트에 "타임머신 모의투자" 링크 추가.

---

## Part 2: 날짜 선택 — 투자 시점 설정

### 2-1. 투자 날짜 선택 UI

**파일**: `components/time-travel/InvestDatePicker.tsx` (`'use client'`)

```typescript
interface Props {
  availableDates: string[]  // DB에 있는 거래일 목록 (서버에서 전달)
  onSelect: (date: string) => void
}
```

UI:
```
┌──────────────────────────────────────────┐
│  Step 1: 언제로 돌아갈까요?              │
│                                          │
│  빠른 선택: [1년 전] [2년 전] [3년 전]  │
│                                          │
│  직접 선택: [____-__-__] (날짜 입력)    │
│                                          │
│  ⚠️ 영업일 기준으로 가장 가까운 날짜로  │
│     자동 조정됩니다.                    │
│                          [다음 →]        │
└──────────────────────────────────────────┘
```

규칙:
- 선택 가능 범위: DB 최초 날짜 ~ DB 최신 날짜보다 최소 7일 이전 (결과 확인 날짜가 있어야 함)
- 입력한 날짜가 거래일이 아니면 가장 가까운 이전 거래일로 자동 조정
- 빠른 선택 버튼: 최신 날짜 기준 1년 전, 2년 전, 3년 전

### 2-2. 날짜 범위 API

**엔드포인트**: `GET /api/trading-dates`

**파일**: `app/api/trading-dates/route.ts` (신규)

```typescript
// 응답: DB에 있는 거래일 목록 (가장 오래된 날짜 ~ 가장 최신 날짜)
interface TradingDatesResponse {
  dates: string[]      // YYYY-MM-DD 형식, 오름차순
  earliest: string     // 가장 오래된 거래일
  latest: string       // 가장 최신 거래일
}
```

---

## Part 3: 종목 매수 — 포트폴리오 구성

### 3-1. 종목 검색 & 가격 표시

**파일**: `components/time-travel/StockSearchForDate.tsx` (`'use client'`)

투자 날짜 기준 종목 이름/코드 검색 → 해당일 시가/종가/등락률 표시

```
┌──────────────────────────────────────────┐
│  Step 2: 어떤 종목을 살까요?             │
│  기준일: 2023-01-05                      │
│                                          │
│  [종목 이름 또는 코드 검색...]           │
│                                          │
│  검색 결과:                              │
│  삼성전자 (005930)  │ 종가: 55,400원    │
│                     │ 전일 대비: -1.2%  │
│                     │ [+ 추가하기]      │
└──────────────────────────────────────────┘
```

### 3-2. 수량 입력 & 포트폴리오 추가

**파일**: `components/time-travel/AddStockModal.tsx` (`'use client'`)

```
┌─────────────────────────────────┐
│  삼성전자 매수                   │
│  매수가: 55,400원               │
│                                  │
│  수량: [___] 주                 │
│  총 매수금액: 0원               │
│                                  │
│  [취소]  [포트폴리오에 추가]    │
└─────────────────────────────────┘
```

### 3-3. 포트폴리오 현황

**파일**: `components/time-travel/Portfolio.tsx` (`'use client'`)

```
┌──────────────────────────────────────────┐
│  내 포트폴리오 (투자일: 2023-01-05)      │
├──────────────────────────────────────────┤
│  종목명      │ 수량  │ 매수가  │ 매수금액 │
│  삼성전자    │ 10주  │ 55,400 │ 554,000  │
│  SK하이닉스  │ 5주   │ 78,200 │ 391,000  │
├──────────────────────────────────────────┤
│  총 투자금액: 945,000원                  │
│  종목 수: 2개                            │
│                                          │
│  [비우기]         [결과 확인 →]          │
└──────────────────────────────────────────┘
```

조건:
- 최소 1개 종목 추가 후 "결과 확인" 버튼 활성화
- 동일 종목 재추가 시 수량 합산

### 3-4. 가격 조회 API

**엔드포인트**: `GET /api/time-travel/stocks?date=2023-01-05&q=삼성`

**파일**: `app/api/time-travel/stocks/route.ts` (신규)

```typescript
interface StockPriceOnDate {
  code: string
  name: string
  closePrice: number
  changeRate: number
  openPrice: number
  highPrice: number
  lowPrice: number
  volume: number
}
```

---

## Part 4: 결과 확인 — 수익/손실 계산

### 4-1. 결과 날짜 선택

**파일**: `components/time-travel/ResultDatePicker.tsx` (`'use client'`)

```
┌──────────────────────────────────────────┐
│  Step 3: 언제 확인할까요?                │
│  (투자일 이후의 날짜를 선택하세요)       │
│                                          │
│  빠른 선택: [1개월 후] [3개월 후] [6개월 후] [1년 후] │
│  직접 선택: [____-__-__]                │
│  (선택 가능: 2023-01-05 ~ 현재 최신 데이터) │
│                                          │
│                     [결과 보기]          │
└──────────────────────────────────────────┘
```

### 4-2. 결과 계산 API

**엔드포인트**: `GET /api/time-travel/result`

**파일**: `app/api/time-travel/result/route.ts` (신규)

Request body (POST로 변경 가능):
```typescript
interface ResultRequest {
  investDate: string
  checkDate: string
  holdings: { code: string; quantity: number; buyPrice: number }[]
}
```

Response:
```typescript
interface ResultResponse {
  investDate: string
  checkDate: string
  totalInvested: number     // 총 투자금액
  totalCurrentValue: number // 현재(체크일) 평가금액
  totalPnl: number          // 손익금액 (+ / -)
  totalPnlRate: number      // 손익률 (%)
  holdings: HoldingResult[]
  message: string           // 텍스트 요약
}

interface HoldingResult {
  code: string
  name: string
  quantity: number
  buyPrice: number          // 매수가 (투자일 종가)
  currentPrice: number      // 현재가 (체크일 종가)
  pnl: number               // 종목별 손익금액
  pnlRate: number           // 종목별 손익률
}
```

계산 로직 (`lib/analysis/paperTrading.ts`):
```typescript
export function calculateResult(
  holdings: { code: string; quantity: number; buyPrice: number }[],
  currentPrices: Record<string, number>
): PnlResult {
  const results = holdings.map(h => {
    const currentPrice = currentPrices[h.code] ?? h.buyPrice
    const pnl = (currentPrice - h.buyPrice) * h.quantity
    const pnlRate = ((currentPrice - h.buyPrice) / h.buyPrice) * 100
    return { ...h, currentPrice, pnl, pnlRate }
  })

  const totalInvested = results.reduce((sum, r) => sum + r.buyPrice * r.quantity, 0)
  const totalCurrentValue = results.reduce((sum, r) => sum + r.currentPrice * r.quantity, 0)
  const totalPnl = totalCurrentValue - totalInvested
  const totalPnlRate = (totalPnl / totalInvested) * 100

  return { results, totalInvested, totalCurrentValue, totalPnl, totalPnlRate }
}
```

### 4-3. 결과 표시 컴포넌트

**파일**: `components/time-travel/TradingResult.tsx` (`'use client'`)

```
┌──────────────────────────────────────────┐
│  📊 투자 결과                            │
│  2023-01-05 → 2024-01-05 (약 1년)       │
├──────────────────────────────────────────┤
│         총 손익                          │
│      +182,500원                          │
│        +19.3%                            │
│  투자원금: 945,000  현재가치: 1,127,500  │
├──────────────────────────────────────────┤
│  종목별 결과                             │
│  삼성전자  │ 10주 │ 55,400→72,900 │ +17,500 (+31.6%) │
│  SK하이닉스│ 5주  │ 78,200→82,400 │ +21,000 (+5.4%)  │
├──────────────────────────────────────────┤
│  💬 요약                                 │
│  "1년 투자로 +19.3% 수익을 올렸어요.    │
│   삼성전자가 가장 많이 올랐네요!"       │
├──────────────────────────────────────────┤
│  ⚠️ 과거 데이터 기반 시뮬레이션입니다.  │
│  실제 투자 결과와 다를 수 있습니다.     │
├──────────────────────────────────────────┤
│  [다시 해보기]    [다른 날짜로 확인]    │
└──────────────────────────────────────────┘
```

손익 색상:
- 수익: `text-red-500` (한국 주식 관행: 빨강 = 상승)
- 손실: `text-blue-500` (파랑 = 하락)

---

## Part 5: 상태 관리 & localStorage 연동

**파일**: `lib/hooks/useTimeTravelPortfolio.ts` (`'use client'`)

localStorage key: `stock-insight-time-travel`

```typescript
interface TimeTravelState {
  investDate: string | null
  holdings: { code: string; name: string; quantity: number; buyPrice: number }[]
  step: 1 | 2 | 3  // 현재 단계
}

export function useTimeTravelPortfolio() {
  // 1. 초기화: localStorage에서 복원
  // 2. 상태 변경 시 localStorage에 저장
  // 3. 반환: state, addHolding, removeHolding, reset, setInvestDate
}
```

규칙:
- `localStorage`는 클라이언트 전용 — SSR hydration 오류 방지를 위해 `useEffect`로 초기화
- JSON 직렬화/역직렬화

---

## 결과 텍스트 생성

**파일**: `lib/analysis/paperTrading.ts`에 함수 추가

```typescript
export function generateResultMessage(totalPnlRate: number, topGainer: HoldingResult, topLoser: HoldingResult, daysHeld: number): string {
  const period = daysHeld >= 365
    ? `약 ${Math.floor(daysHeld / 365)}년`
    : daysHeld >= 30
    ? `약 ${Math.floor(daysHeld / 30)}개월`
    : `${daysHeld}일`

  if (totalPnlRate >= 20) {
    return `${period} 투자로 +${totalPnlRate.toFixed(1)}% 큰 수익을 올렸어요! ${topGainer.name}이(가) 가장 많이 올랐네요.`
  } else if (totalPnlRate >= 5) {
    return `${period} 투자로 +${totalPnlRate.toFixed(1)}% 수익을 올렸어요. ${topGainer.name}이(가) 수익에 기여했어요.`
  } else if (totalPnlRate >= -5) {
    return `${period} 투자 결과 거의 본전이에요 (${totalPnlRate.toFixed(1)}%). 시장이 크게 움직이지 않았네요.`
  } else if (totalPnlRate >= -20) {
    return `${period} 투자로 ${totalPnlRate.toFixed(1)}% 손실이 발생했어요. ${topLoser.name}의 하락이 컸네요.`
  } else {
    return `${period} 투자로 ${totalPnlRate.toFixed(1)}% 큰 손실이 발생했어요. 어려운 시장이었네요.`
  }
}
```

---

## 파일 목록

### 신규 파일

```
app/time-travel/page.tsx                    # 타임머신 모의투자 페이지
app/api/trading-dates/route.ts              # 거래일 목록 API
app/api/time-travel/stocks/route.ts         # 특정 날짜 종목 검색 API
app/api/time-travel/result/route.ts         # 투자 결과 계산 API
components/time-travel/InvestDatePicker.tsx # 투자 날짜 선택
components/time-travel/StockSearchForDate.tsx # 날짜별 종목 검색
components/time-travel/AddStockModal.tsx    # 수량 입력 모달
components/time-travel/Portfolio.tsx        # 포트폴리오 현황
components/time-travel/ResultDatePicker.tsx # 결과 확인 날짜 선택
components/time-travel/TradingResult.tsx    # 투자 결과 표시
lib/hooks/useTimeTravelPortfolio.ts         # 포트폴리오 상태 관리 훅
lib/analysis/paperTrading.ts               # 손익 계산 로직
```

### 수정 파일

```
app/page.tsx 또는 components/Header.tsx    # 타임머신 링크 추가
```

---

## 완료 기준

### 날짜 선택

- [ ] 거래일 목록 API (`/api/trading-dates`) 정상 동작
- [ ] 빠른 선택(1년 전/2년 전/3년 전) 버튼 동작
- [ ] 비거래일 입력 시 가장 가까운 이전 거래일로 자동 조정

### 종목 검색 & 매수

- [ ] 특정 날짜 기준 종목 이름/코드 검색 동작
- [ ] 해당일 종가 기준 종목 추가
- [ ] 동일 종목 재추가 시 수량 합산
- [ ] 총 투자금액 실시간 표시
- [ ] localStorage에 포트폴리오 저장 (새로고침 후에도 유지)

### 결과 확인

- [ ] 결과 날짜 선택 (투자일 이후만 선택 가능)
- [ ] 체크일 기준 종가로 손익 계산 정확성 확인
- [ ] 종목별 손익률 및 전체 손익률 표시
- [ ] 결과 텍스트 요약 표시
- [ ] "다시 해보기" → 포트폴리오 초기화 후 Step 1으로

### 기타

- [ ] 포트폴리오 비어있을 때 "결과 확인" 버튼 비활성화
- [ ] 체크일에 데이터가 없는 종목 처리 (안내 메시지)
- [ ] 면책 문구 표시

## 다음 단계

별도 task 없음. 이후 추가 기능(로그인 후 포트폴리오 저장 등)은 새 task 파일을 생성한다.
