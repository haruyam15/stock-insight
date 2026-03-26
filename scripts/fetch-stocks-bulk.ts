/**
 * 기간 내 모든 영업일 데이터를 일괄 수집
 * 실행: npx tsx scripts/fetch-stocks-bulk.ts [시작일] [종료일]
 * 예시: npx tsx scripts/fetch-stocks-bulk.ts 20230101 20261231
 */

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

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// 시작일~종료일 사이 모든 날짜 생성 (토/일 제외)
function getBusinessDays(from: string, to: string): string[] {
  const days: string[] = []
  const start = new Date(`${from.slice(0, 4)}-${from.slice(4, 6)}-${from.slice(6, 8)}`)
  const end = new Date(`${to.slice(0, 4)}-${to.slice(4, 6)}-${to.slice(6, 8)}`)
  const cur = new Date(start)

  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) {
      days.push(formatDate(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }

  return days
}

// DB에 이미 있는 날짜 조회
async function getExistingDates(): Promise<Set<string>> {
  const { data } = await supabase
    .from('stock_prices')
    .select('base_date')
    .order('base_date', { ascending: true })

  const dates = new Set<string>()
  for (const row of data ?? []) {
    // YYYY-MM-DD → YYYYMMDD
    dates.add((row.base_date as string).replace(/-/g, ''))
  }
  return dates
}

function toNumber(val: string): number | null {
  if (!val || val === '-' || val.trim() === '') return null
  const n = Number(val.replace(/,/g, ''))
  return isNaN(n) ? null : n
}

async function fetchPage(basDt: string, pageNo: number): Promise<ApiItem[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows: '1000',
    pageNo: String(pageNo),
    resultType: 'json',
    basDt,
  })

  const res = await fetch(`${BASE_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`API 호출 실패: ${res.status}`)

  const json = await res.json() as ApiResponse
  const item = json?.response?.body?.items?.item
  if (!item) return []
  return Array.isArray(item) ? item : [item]
}

async function fetchAllStocks(basDt: string): Promise<ApiItem[]> {
  const all: ApiItem[] = []
  let pageNo = 1

  while (true) {
    const items = await fetchPage(basDt, pageNo)
    if (items.length === 0) break
    all.push(...items)
    if (items.length < 1000) break
    pageNo++
    await new Promise((r) => setTimeout(r, 500))
  }

  return all
}

async function saveToDatabase(records: ApiItem[]): Promise<void> {
  if (records.length === 0) return

  const uniqueStocks = Array.from(
    new Map(records.map((r) => [r.srtnCd, { code: r.srtnCd, name: r.itmsNm }])).values()
  )

  await supabase.from('stocks').upsert(uniqueStocks, { onConflict: 'code' })

  const priceRows = records
    .map((r) => ({
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
    }))
    .filter((r) => r.close_price !== null)

  const BATCH = 500
  for (let i = 0; i < priceRows.length; i += BATCH) {
    const { error } = await supabase
      .from('stock_prices')
      .upsert(priceRows.slice(i, i + BATCH), { onConflict: 'stock_code,base_date' })
    if (error) throw new Error(`저장 실패: ${error.message}`)
  }
}

async function main() {
  // 기본값: 3년 전 ~ 어제
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const threeYearsAgo = new Date(today)
  threeYearsAgo.setFullYear(today.getFullYear() - 3)

  const fromArg = process.argv[2] ?? formatDate(threeYearsAgo)
  const toArg = process.argv[3] ?? formatDate(yesterday)

  console.log(`=== 일괄 데이터 수집 ===`)
  console.log(`기간: ${fromArg} ~ ${toArg}`)

  const allDays = getBusinessDays(fromArg, toArg)
  console.log(`영업일 총 ${allDays.length}일`)

  console.log('DB에 이미 있는 날짜 확인 중...')
  const existingDates = await getExistingDates()
  const targetDays = allDays.filter((d) => !existingDates.has(d))

  if (targetDays.length === 0) {
    console.log('✅ 모든 날짜의 데이터가 이미 존재합니다.')
    return
  }

  console.log(`수집 필요: ${targetDays.length}일 (이미 있음: ${allDays.length - targetDays.length}일)\n`)

  let success = 0
  let skip = 0

  for (let i = 0; i < targetDays.length; i++) {
    const basDt = targetDays[i]
    process.stdout.write(`[${i + 1}/${targetDays.length}] ${basDt} 수집 중...`)

    try {
      const records = await fetchAllStocks(basDt)
      if (records.length === 0) {
        console.log(' 데이터 없음 (휴장일)')
        skip++
      } else {
        await saveToDatabase(records)
        console.log(` ${records.length}건 저장`)
        success++
      }
    } catch (e: unknown) {
      console.log(` ❌ 실패: ${e instanceof Error ? e.message : String(e)}`)
    }

    // API 호출 간격
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log(`\n✅ 완료: 성공 ${success}일 / 휴장일 ${skip}일 / 총 ${targetDays.length}일`)
}

main().catch((e: unknown) => {
  console.error('❌ 오류:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
