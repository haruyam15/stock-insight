import { GuideTooltip } from './GuideTooltip'

interface MA {
  ma5: number | null
  ma20: number | null
  ma60: number | null
}

interface Volatility {
  stdDev: number
  level: string
}

interface RiseProbability {
  days: number
  riseCount: number
  probability: number
}

interface AnalysisCardProps {
  currentPrice: number
  ma: MA | null
  volatility: Volatility | null
  riseProbability: RiseProbability | null
  trend: string
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

function maColor(ma: number | null, current: number) {
  if (ma === null) return 'text-slate-400'
  return ma < current ? 'text-rose-600' : 'text-blue-600'
}

function volatilityBadge(level: string) {
  if (level === '낮음') return 'bg-emerald-100 text-emerald-700'
  if (level === '높음') return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function trendColor(trend: string) {
  if (trend.includes('강한 상승')) return 'text-rose-600'
  if (trend.includes('단기 상승')) return 'text-rose-500'
  if (trend.includes('강한 하락')) return 'text-blue-600'
  if (trend.includes('단기 하락')) return 'text-blue-500'
  if (trend === '횡보') return 'text-slate-500'
  return 'text-slate-400'
}

function trendIcon(trend: string) {
  if (trend.includes('강한 상승')) return '↑↑'
  if (trend.includes('단기 상승')) return '↑'
  if (trend.includes('강한 하락')) return '↓↓'
  if (trend.includes('단기 하락')) return '↓'
  if (trend === '횡보') return '→'
  return '-'
}

function riseProbabilityBarColor(prob: number) {
  if (prob >= 60) return 'bg-rose-500'
  if (prob <= 40) return 'bg-blue-500'
  return 'bg-slate-500'
}

export function AnalysisCard({ currentPrice, ma, volatility, riseProbability, trend }: AnalysisCardProps) {
  return (
    <div className="space-y-4">
      {/* 이동평균 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          이동평균선
          <GuideTooltip text="일정 기간 동안의 평균 가격을 선으로 이은 것이에요. 현재 가격보다 낮으면 빨강(상승 신호), 높으면 파랑(하락 신호)으로 표시돼요." />
        </h3>
        {ma ? (
          <div className="grid grid-cols-3 gap-3">
            {([['MA5', ma.ma5], ['MA20', ma.ma20], ['MA60', ma.ma60]] as [string, number | null][]).map(([label, val]) => (
              <div key={label} className="text-center bg-slate-50 rounded-lg py-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-semibold tabular-nums ${maColor(val, currentPrice)}`}>
                  {val !== null ? `${fmt(val)}원` : '-'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">데이터 부족</p>
        )}
      </div>

      {/* 변동성 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          변동성
          <GuideTooltip text="가격이 얼마나 들쭉날쭉한지 나타내요. 높을수록 가격이 크게 오르거나 내릴 수 있어요." />
        </h3>
        {volatility ? (
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${volatilityBadge(volatility.level)}`}>
              {volatility.level}
            </span>
            <span className="text-xs text-slate-500">표준편차 {fmt(Math.round(volatility.stdDev))}원</span>
          </div>
        ) : (
          <p className="text-sm text-slate-400">데이터 부족</p>
        )}
      </div>

      {/* 상승 확률 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          최근 30일 상승 확률
          <GuideTooltip text="과거 30일 동안 전날보다 오른 날이 몇 %인지 보여줘요. 미래를 보장하지 않아요." />
        </h3>
        {riseProbability ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>상승 {riseProbability.riseCount}일 / {riseProbability.days}일</span>
              <span className={`font-bold tabular-nums ${riseProbability.probability >= 60 ? 'text-rose-600' : riseProbability.probability <= 40 ? 'text-blue-600' : 'text-slate-700'}`}>
                {riseProbability.probability.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${riseProbabilityBarColor(riseProbability.probability)}`}
                style={{ width: `${riseProbability.probability}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              최근 {riseProbability.days}일 기준 · 하락 확률 {(100 - riseProbability.probability).toFixed(1)}%
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">데이터 부족</p>
        )}
      </div>

      {/* 추세 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
          추세 판단
          <GuideTooltip text="이동평균선의 관계로 현재 추세를 판단해요. MA5 > MA20이면 단기 상승 추세 신호예요." />
        </h3>
        <p className={`text-base font-semibold ${trendColor(trend)}`}>
          {trendIcon(trend)} {trend}
        </p>
      </div>

      <p className="text-xs text-slate-400 text-center border-t border-slate-100 pt-3">
        이 정보는 과거 데이터를 기반으로 한 수학적 분석 결과이며, 투자 권유가 아닙니다.
        투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
      </p>
    </div>
  )
}
