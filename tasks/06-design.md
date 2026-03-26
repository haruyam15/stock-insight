# Task 06: 디자인 개선

## 상태: ✅ 완료

## 목표

전체 UI의 색상 가독성과 디자인 일관성을 개선한다.
`docs/design-guide.md` 의 토큰 시스템을 기준으로 모든 컴포넌트를 통일한다.

## 사전 확인 사항

- **반드시 `docs/design-guide.md` 를 먼저 읽는다** — 모든 색상·타이포·여백 결정의 기준
- Task 05 완료 상태에서 진행
- 기능 변경 없음, UI/스타일만 수정 (커밋 타입: `style`)
- `'use client'` 없는 서버 컴포넌트의 구조는 건드리지 않는다

## 핵심 변경 방향

### 1. 색상 시스템 교체

현재 문제:
- `text-gray-*` 계열 사용 → `text-slate-*` 으로 교체 (명도 구분 명확)
- `text-red-500` / `text-blue-500` → `text-rose-600` / `text-blue-600` (대비 확보)
- 배경 대비가 낮은 연한 텍스트 색상 전면 개선

교체 규칙:
```
text-gray-900  →  text-slate-900
text-gray-800  →  text-slate-800
text-gray-700  →  text-slate-700
text-gray-600  →  text-slate-600
text-gray-500  →  text-slate-500
text-gray-400  →  text-slate-400
text-gray-300  →  text-slate-300
text-gray-200  →  text-slate-200
text-gray-100  →  text-slate-100
bg-gray-*      →  bg-slate-*
border-gray-*  →  border-slate-*
divide-gray-*  →  divide-slate-*
text-red-500   →  text-rose-600
text-blue-500  →  text-blue-600
```

### 2. 등락률 색상 유틸 함수 추가

`components/utils.ts` 에 유틸 함수를 만들어 모든 컴포넌트에서 재사용한다:

```typescript
export function getRateColor(rate: number): string {
  if (rate > 0) return 'text-rose-600'
  if (rate < 0) return 'text-blue-600'
  return 'text-slate-500'
}

export function getRateBadgeClass(rate: number): string {
  if (rate > 0) return 'bg-rose-100 text-rose-700'
  if (rate < 0) return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

export function formatRate(rate: number): string {
  return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`
}
```

### 3. 페이지 배경

`app/layout.tsx` 의 body 배경을 `bg-slate-50` 으로 설정한다.
카드는 `bg-white border border-slate-200 rounded-xl shadow-sm` 패턴을 사용한다.

### 4. 탭 디자인 개선 (`RankingTabs.tsx`)

현재: 단순 border-b 탭
개선: `docs/design-guide.md` 의 탭 패턴 적용
- 활성: `text-indigo-600 border-b-2 border-indigo-600 font-semibold`
- 비활성: `text-slate-500 border-b-2 border-transparent hover:text-slate-700`

### 5. 테이블 개선 (`RankingTable.tsx`)

- 헤더: `text-xs font-semibold text-slate-500 uppercase tracking-wide`
- 행 hover: `hover:bg-slate-50 transition-colors`
- 구분선: `divide-y divide-slate-100`
- 순위 숫자: 1~3위는 `font-bold text-indigo-600` 강조

### 6. Header 개선

- 배경: `bg-white border-b border-slate-200`
- 검색창: `border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`
- 드롭다운 hover: `hover:bg-slate-50`
- 네비게이션 활성 링크: `text-indigo-600 font-semibold` (현재 페이지 표시)

### 7. 분석 카드 (`AnalysisCard.tsx`)

- 변동성 등급 색상: `docs/design-guide.md` 의 변동성 등급 색상 적용
- 추세 신호: `docs/design-guide.md` 의 추세 신호 아이콘 사용

### 8. 시장 요약 카드 (`MarketSummary.tsx`)

- 상승 종목 수: `text-rose-600 font-bold`
- 하락 종목 수: `text-blue-600 font-bold`
- 카드 테두리/배경 `docs/design-guide.md` 기준 적용

---

## 수정 대상 파일 목록

```
components/utils.ts          # 신규 생성 — 유틸 함수
components/Header.tsx        # 색상 + 검색창 스타일
components/RankingTabs.tsx   # 탭 디자인
components/RankingTable.tsx  # 테이블 스타일
components/MarketSummary.tsx # 카드 색상
components/AnalysisCard.tsx  # 변동성/추세 색상
components/StockChart.tsx    # 차트 색상 (rose/blue 계열로)
app/layout.tsx               # body 배경색
app/page.tsx                 # 홈 페이지 카드 스타일
app/ranking/page.tsx         # 페이지 래퍼 스타일
app/stock/[code]/page.tsx    # 종목 상세 스타일
```

---

## 완료 기준

- [x] `components/utils.ts` 생성 및 유틸 함수 정의
- [x] 모든 `text-gray-*` → `text-slate-*` 교체 완료
- [x] 상승: `text-rose-600`, 하락: `text-blue-600` 일관 적용
- [x] 페이지 배경 `bg-slate-50`, 카드 `bg-white border-slate-200` 적용
- [x] 탭 디자인 `indigo` 계열로 통일
- [x] 테이블 hover 및 구분선 개선
- [x] Header 검색창 focus 스타일 개선
- [x] 변동성 등급 색상 (`emerald` / `amber` / `rose`) 적용
- [x] 모바일 화면 레이아웃 깨짐 없음 확인

## 다음 단계

Task 07 (검색 기능 구현) 으로 이동한다.
