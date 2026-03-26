# Stock Insight 디자인 가이드

> Claude Code가 디자인 작업 시 반드시 이 파일을 먼저 읽는다.
> 모든 컴포넌트는 이 가이드의 토큰 시스템을 준수한다.

---

## 디자인 원칙

1. **가독성 우선** — 텍스트 대비비율 WCAG AA 이상 (4.5:1)
2. **일관성** — 동일한 의미에는 동일한 색/크기/여백 사용
3. **초보자 친화** — 복잡한 정보는 단계적으로 노출
4. **모바일 우선** — sm → md → lg 순서로 반응형 작성

---

## 색상 토큰

### 시멘틱 색상

| 역할 | Tailwind 클래스 | Hex | 사용 위치 |
|------|-----------------|-----|-----------|
| 상승 (양봉) | `text-rose-600` `bg-rose-50` | #e11d48 | 등락률 양수, 상승 배지 |
| 하락 (음봉) | `text-blue-600` `bg-blue-50` | #2563eb | 등락률 음수, 하락 배지 |
| 보합 | `text-slate-500` `bg-slate-100` | #64748b | 등락률 0, 중립 |
| 강조 (Primary) | `text-indigo-600` `bg-indigo-600` | #4f46e5 | 버튼, 링크, 탭 활성 |
| 경고 | `text-amber-600` `bg-amber-50` | #d97706 | 변동성 높음, 주의 메시지 |
| 성공 | `text-emerald-600` `bg-emerald-50` | #059669 | 변동성 낮음, 긍정 신호 |

### 중립 팔레트 (배경·텍스트·테두리)

| 역할 | Tailwind 클래스 |
|------|-----------------|
| 페이지 배경 | `bg-slate-50` |
| 카드 배경 | `bg-white` |
| 카드 테두리 | `border border-slate-200` |
| 구분선 | `divide-slate-100` |
| 본문 텍스트 (강) | `text-slate-900` |
| 본문 텍스트 (중) | `text-slate-700` |
| 보조 텍스트 | `text-slate-500` |
| 플레이스홀더 | `text-slate-400` |
| 비활성/disabled | `text-slate-300` |

### 금지 사항
- `text-gray-*` 대신 `text-slate-*` 사용 (더 명도 구분이 명확함)
- `text-red-500` 대신 `text-rose-600` 사용 (배경 대비 확보)
- `text-blue-500` 대신 `text-blue-600` 사용 (배경 대비 확보)
- 배경 `bg-white` 위에 `text-gray-300` 이하 사용 금지 (대비 부족)

---

## 타이포그래피

| 역할 | Tailwind 클래스 |
|------|-----------------|
| 페이지 제목 (H1) | `text-2xl font-bold text-slate-900` |
| 섹션 제목 (H2) | `text-lg font-semibold text-slate-800` |
| 카드 제목 | `text-sm font-semibold text-slate-700` |
| 본문 | `text-sm text-slate-700` |
| 보조 설명 | `text-xs text-slate-500` |
| 숫자·데이터 | `tabular-nums` 추가 (숫자 정렬) |
| 가격 | `text-base font-bold text-slate-900 tabular-nums` |

---

## 간격·레이아웃

| 역할 | 값 |
|------|-----|
| 페이지 최대 너비 | `max-w-4xl mx-auto px-4` |
| 섹션 간격 | `space-y-6` |
| 카드 내부 패딩 | `p-5` (기본), `p-4` (조밀) |
| 카드 간격 | `gap-4` |
| 인라인 요소 간격 | `gap-2` |

---

## 카드 컴포넌트 패턴

```tsx
// 기본 카드
<div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">

// 강조 카드 (색상 배경)
<div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">

// 상승 강조
<div className="bg-rose-50 border border-rose-100 rounded-xl p-4">

// 하락 강조
<div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
```

---

## 배지 (Badge) 패턴

```tsx
// 상승 배지
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
  +2.35%
</span>

// 하락 배지
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
  -1.20%
</span>

// 중립 배지
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
  0.00%
</span>
```

---

## 버튼 패턴

```tsx
// Primary 버튼
<button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">

// Secondary 버튼
<button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">

// 텍스트 버튼 (링크형)
<button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
```

---

## 탭 패턴

```tsx
// 활성 탭
<button className="px-4 py-2 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600">

// 비활성 탭
<button className="px-4 py-2 text-sm font-medium text-slate-500 border-b-2 border-transparent hover:text-slate-700 hover:border-slate-300">
```

---

## 테이블 패턴

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-slate-200">
      <th className="text-left py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-3 px-2 text-slate-900 font-medium">
    </tr>
  </tbody>
</table>
```

---

## 등락률 텍스트 유틸 함수

```tsx
// components 어디서든 재사용
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

---

## 변동성 등급 색상

| 등급 | 클래스 |
|------|--------|
| 낮음 | `text-emerald-600 bg-emerald-50` |
| 보통 | `text-amber-600 bg-amber-50` |
| 높음 | `text-rose-600 bg-rose-50` |

---

## 추세 신호 아이콘

| 추세 | 아이콘 텍스트 | 색상 |
|------|-------------|------|
| 강한 상승 추세 | `↑↑` | `text-rose-600` |
| 단기 상승 추세 | `↑` | `text-rose-500` |
| 횡보 | `→` | `text-slate-500` |
| 단기 하락 추세 | `↓` | `text-blue-500` |
| 강한 하락 추세 | `↓↓` | `text-blue-600` |
| 판단 불가 | `-` | `text-slate-400` |

---

## 스켈레톤 로딩

```tsx
// 텍스트 줄 스켈레톤
<div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />

// 카드 스켈레톤
<div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
  <div className="h-5 bg-slate-200 rounded w-1/3" />
  <div className="h-4 bg-slate-200 rounded w-full" />
  <div className="h-4 bg-slate-200 rounded w-2/3" />
</div>
```

---

## 반응형 규칙

- 모바일(기본): 1열 레이아웃, `px-4`
- 태블릿(`sm:`): 2열 그리드 가능
- 데스크탑(`md:`): 3열 그리드, 사이드바 레이아웃
- 최대 너비: `max-w-4xl` (960px) — 이 이상은 늘리지 않는다

---

## 면책 문구 표준 문안

```
이 정보는 과거 데이터를 기반으로 한 수학적 분석 결과이며, 투자 권유가 아닙니다.
투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
```

클래스: `text-xs text-slate-400 border-t border-slate-100 pt-3 mt-4`
