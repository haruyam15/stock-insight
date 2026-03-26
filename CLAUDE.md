# Stock Insight 프로젝트

## 시작 전 필독

코딩 시작 전에 반드시 `docs/` 폴더의 모든 파일을 읽는다.
특히 `docs/architecture.md` 는 디렉토리 구조, 렌더링 전략, DB 쿼리 패턴 등 핵심 규칙을 담고 있다.

## 프로젝트 개요

공공데이터(금융위원회 주식시세 API) 기반 주식 분석 서비스.
주식 초보자를 위한 데이터 시각화 및 수학 기반 분석 제공.
실시간 기능 없음. 데이터는 T+1 (다음 영업일 오후 1시 이후 갱신).

## 기술 스택

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (PostgreSQL)
- Recharts (차트)
- tsx (TypeScript 스크립트 실행)

## 디렉토리 규칙

`src/` 폴더를 사용하지 않는다. 모든 폴더는 프로젝트 루트에 위치한다.

```
app/          # Next.js 페이지 및 API Routes
lib/          # 유틸리티, Supabase 클라이언트, 분석 로직
components/   # React 컴포넌트
scripts/      # 데이터 수집 스크립트
```

경로 별칭: `@/*` → 프로젝트 루트 (`./`)

## 개발 규칙

- 모든 코드는 TypeScript로 작성
- 로직과 UI 분리: 분석 함수는 `lib/analysis/`, UI는 `components/`
- 모든 page.tsx에 `export const revalidate = 3600` 추가 (ISR)
- `'use client'`는 차트, 탭, 검색창 컴포넌트에만 사용

## 개발 순서

1. DB 스키마 (완료)
2. 데이터 수집 스크립트 (완료)
3. API Routes (완료)
4. 분석 로직
5. 프론트엔드 페이지

## 커밋 규칙

커밋은 작업 단위별로 나눠서 한다.

| 타입       | 설명                     |
| ---------- | ------------------------ |
| `feat`     | 새 기능 추가             |
| `fix`      | 버그 수정                |
| `refactor` | 동작 변경 없는 코드 개선 |
| `style`    | UI/스타일 변경           |
| `chore`    | 설정, 의존성, 문서 등    |
