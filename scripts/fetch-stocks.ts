import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL =
  'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo'
const API_KEY = process.env.PUBLIC_DATA_API_KEY!

interface ApiItem {
  basDt: string
  srtnCd: string
  itmsNm: string
  mkp: string
  clpr: string
  hipr: string
  lopr: string
  trqu: string
  trPrc: string
  fltRt: string
  vs: string
}

interface ApiResponse {
  response?: {
    body?: {
      items?: {
        item?: ApiItem | ApiItem[]
      }
    }
  }
}

// 날짜를 YYYYMMDD 형식으로 변환
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// 최신 영업일 계산 (토/일 제외)
function getLatestBusinessDate(): string {
  const date = new Date()
  // T+1이므로 어제부터 시작
  date.setDate(date.getDate() - 1)
  // 일요일(0) → 금요일, 토요일(6) → 금요일
  const day = date.getDay()
  if (day === 0) date.setDate(date.getDate() - 2)
  if (day === 6) date.setDate(date.getDate() - 1)
  return formatDate(date)
}

// 숫자 변환 (빈 문자열 또는 '-' 처리)
function toNumber(val: string): number | null {
  if (!val || val === '-' || val.trim() === '') return null
  const n = Number(val.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

// 공공 API 한 페이지 호출
async function fetchPage(basDt: string, pageNo: number): Promise<ApiItem[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows: '1000',
    pageNo: String(pageNo),
    resultType: 'json',
    basDt,
  })

  const url = `${BASE_URL}?${params.toString()}`
  const res = await fetch(url)

  if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`)

  const json = await res.json() as ApiResponse
  const item = json?.response?.body?.items?.item

  if (!item) return []
  return Array.isArray(item) ? item : [item]
}

// 전체 데이터 수집 (페이징)
async function fetchAllStocks(basDt: string): Promise<ApiItem[]> {
  const all: ApiItem[] = []
  let pageNo = 1

  console.log(`공공 API 호출 시작 (기준일자: ${basDt})`)

  while (true) {
    process.stdout.write(`  페이지 ${pageNo} 수집 중...`)
    const items = await fetchPage(basDt, pageNo)

    if (items.length === 0) {
      console.log(' 데이터 없음, 종료')
      break
    }

    all.push(...items)
    console.log(` ${items.length}건`)

    if (items.length < 1000) break

    pageNo++
    // API 서버 부하 방지
    await new Promise((r) => setTimeout(r, 500))
  }

  return all
}

// Supabase에 저장
async function saveToDatabase(records: ApiItem[]): Promise<void> {
  if (records.length === 0) {
    console.log('저장할 데이터가 없습니다.')
    return
  }

  // stocks upsert
  const stockRows = records.map((r) => ({
    code: r.srtnCd,
    name: r.itmsNm,
  }))

  // 중복 제거 (같은 종목코드)
  const uniqueStocks = Array.from(
    new Map(stockRows.map((s) => [s.code, s])).values()
  )

  console.log(`\nstocks 테이블 저장 중... (${uniqueStocks.length}개 종목)`)
  const { error: stockError } = await supabase
    .from('stocks')
    .upsert(uniqueStocks, { onConflict: 'code' })

  if (stockError) throw new Error(`stocks 저장 실패: ${stockError.message}`)
  console.log('stocks 저장 완료')

  // stock_prices upsert (500건씩 배치)
  const priceRows = records.map((r) => ({
    stock_code: r.srtnCd,
    base_date: `${r.basDt.slice(0, 4)}-${r.basDt.slice(4, 6)}-${r.basDt.slice(6, 8)}`,
    open_price: toNumber(r.mkp),
    close_price: toNumber(r.clpr),
    high_price: toNumber(r.hipr),
    low_price: toNumber(r.lopr),
    volume: toNumber(r.trqu),
    trading_value: toNumber(r.trPrc),
    change_rate: toNumber(r.fltRt),
    change_amount: toNumber(r.vs),
  })).filter((r) => r.close_price !== null)

  console.log(`stock_prices 테이블 저장 중... (${priceRows.length}건)`)

  const BATCH = 500
  for (let i = 0; i < priceRows.length; i += BATCH) {
    const batch = priceRows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('stock_prices')
      .upsert(batch, { onConflict: 'stock_code,base_date' })

    if (error) throw new Error(`stock_prices 저장 실패: ${error.message}`)
    console.log(`  ${Math.min(i + BATCH, priceRows.length)} / ${priceRows.length}건 저장`)
  }

  console.log('stock_prices 저장 완료')
}

// 메인 실행
async function main() {
  const basDt = process.argv[2] || getLatestBusinessDate()
  console.log(`=== Stock Insight 데이터 수집 ===`)
  console.log(`기준일자: ${basDt}`)

  const records = await fetchAllStocks(basDt)
  console.log(`\n총 ${records.length}건 수집`)

  await saveToDatabase(records)
  console.log(`\n✅ 완료`)
}

main().catch((e: unknown) => {
  console.error('❌ 오류:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
