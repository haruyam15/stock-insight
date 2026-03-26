# API 명세서

## 공공데이터 API (외부)

### 금융위원회 주식시세정보 API

- 출처: 공공데이터포털 (https://www.data.go.kr/data/15094808/openapi.do)
- 인증: serviceKey (환경변수 PUBLIC_DATA_API_KEY)
- 기본 URL: `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService`
- 응답 형식: XML 또는 JSON

#### 주요 파라미터

| 파라미터 | 설명 |
|----------|------|
| serviceKey | 발급받은 API 키 |
| numOfRows | 한 번에 가져올 행 수 (최대 1000) |
| pageNo | 페이지 번호 |
| resultType | json |
| basDt | 기준일자 (YYYYMMDD) |
| likeSrtnCd | 종목코드 (선택) |
| likeItmsNm | 종목명 (선택) |

#### 응답 필드

| 필드명 | 설명 |
|--------|------|
| basDt | 기준일자 |
| srtnCd | 종목코드 |
| itmsNm | 종목명 |
| mkp | 시가 |
| clpr | 종가 |
| hipr | 고가 |
| lopr | 저가 |
| trqu | 거래량 |
| trPrc | 거래대금 |
| fltRt | 등락률 |
| vs | 전일 대비 등락액 |

---

## 내부 API Routes (Next.js)

### GET /api/stocks

종목 목록 조회 (검색)

**쿼리 파라미터**
- `q` : 종목명 또는 종목코드 (검색어)
- `date` : 기준일자 (기본값: 최신 영업일)

**응답**
```json
{
  "date": "20250325",
  "stocks": [
    {
      "code": "005930",
      "name": "삼성전자",
      "close": 72000,
      "changeRate": 1.23,
      "volume": 15000000
    }
  ]
}
```

---

### GET /api/stocks/[code]

특정 종목 상세 데이터 조회

**경로 파라미터**
- `code` : 종목코드

**쿼리 파라미터**
- `days` : 조회 기간 (기본값: 30)

**응답**
```json
{
  "code": "005930",
  "name": "삼성전자",
  "latest": {
    "date": "20250325",
    "open": 71500,
    "close": 72000,
    "high": 72500,
    "low": 71000,
    "volume": 15000000,
    "tradingValue": 1080000000000,
    "changeRate": 1.23
  },
  "history": [
    { "date": "20250324", "close": 71100, "volume": 13000000 }
  ]
}
```

---

### GET /api/ranking

랭킹 데이터 조회

**쿼리 파라미터**
- `type` : `rise` | `fall` | `volume` | `value` (기본값: `rise`)
- `limit` : 결과 수 (기본값: 50)
- `date` : 기준일자 (기본값: 최신 영업일)

**응답**
```json
{
  "type": "rise",
  "date": "20250325",
  "ranking": [
    {
      "rank": 1,
      "code": "012345",
      "name": "종목명",
      "close": 5000,
      "changeRate": 29.9,
      "volume": 3000000
    }
  ]
}
```

---

### GET /api/market

시장 리포트 데이터 조회

**쿼리 파라미터**
- `date` : 기준일자 (기본값: 최신 영업일)

**응답**
```json
{
  "date": "20250325",
  "summary": {
    "riseCount": 512,
    "fallCount": 403,
    "unchangedCount": 45,
    "avgChangeRate": 0.34
  },
  "topRise": [...],
  "topFall": [...],
  "topVolume": [...]
}
```

---

### GET /api/analysis/[code]

특정 종목 분석 데이터 조회

**경로 파라미터**
- `code` : 종목코드

**응답**
```json
{
  "code": "005930",
  "name": "삼성전자",
  "ma": {
    "ma5": 71800,
    "ma20": 70500,
    "ma60": 68000
  },
  "volatility": {
    "stdDev": 1200.5,
    "level": "보통"
  },
  "riseProbability": {
    "days": 30,
    "riseCount": 19,
    "probability": 63.3
  },
  "trend": "상승 추세",
  "similarStocks": [
    { "code": "000660", "name": "SK하이닉스", "correlation": 0.87 }
  ]
}
```
