# Stock Insight

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-black?logo=anthropic)](https://claude.ai/code)

**🔗 https://k-stock-insight.vercel.app/**

> 어제 데이터를 기반으로 오늘을 공부하는 주식 분석 서비스

공공데이터(금융위원회 주식시세 API)를 활용한 주식 초보자 친화적 데이터 분석 서비스입니다.
실시간 매매가 아닌, 수학 기반 지표로 주식 데이터를 이해하는 것을 목표로 합니다.

## 주요 기능

- **시장 리포트** — 전체 상승/하락 종목 수, 주요 종목 요약
- **TOP 랭킹** — 상승률 / 하락률 / 거래량 / 거래대금 TOP 종목
- **종목 검색** — 종목명 또는 종목코드로 실시간 검색
- **종목 상세 분석**
  - 최근 30일 가격 차트 + 이동평균선 (MA5, MA20, MA60)
  - 변동성, 상승 확률, 추세 판단 지표
  - 상관계수 기반 비슷한 종목 추천
  - 각 지표에 대한 초보자용 설명 제공

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router), TypeScript |
| 스타일링 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |
| 차트 | Recharts |
| 배포 | Vercel |
| 데이터 출처 | 금융위원회 주식시세정보 API (공공데이터포털) |

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

`http://localhost:3000` 에서 확인합니다.

## 환경 변수

`.env.local` 파일을 생성하고 아래 변수를 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://[프로젝트ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PUBLIC_DATA_API_KEY=...
```

- Supabase 키: [Supabase 대시보드](https://supabase.com) → Project Settings → API
- 공공데이터 API 키: [공공데이터포털](https://www.data.go.kr) → 금융위원회 주식시세정보

## 데이터 수집

주식 시세 데이터는 T+1 (영업일 기준 다음날 오후 1시 이후)에 갱신됩니다.

```bash
npm run fetch
```

매일 영업일 오후 1시 이후에 실행합니다. 이미 저장된 날짜의 데이터는 안전하게 중복 처리됩니다.

## 프로젝트 구조

```
stock-insight/
├── app/                  # Next.js 페이지 및 API Routes
│   ├── page.tsx          # 홈 (시장 리포트)
│   ├── ranking/          # TOP 랭킹
│   ├── stock/[code]/     # 종목 상세
│   └── api/              # API Routes
├── components/           # React 컴포넌트
├── lib/
│   ├── supabase.ts       # Supabase 클라이언트
│   └── analysis/         # 분석 로직 (이동평균, 변동성, 상관계수 등)
└── scripts/
    └── fetch-stocks.ts   # 공공데이터 수집 스크립트
```

## 주의사항

이 서비스에서 제공하는 분석 결과는 과거 데이터 기반의 수학적 계산값이며, **투자 권유가 아닌 정보 제공 목적**입니다.