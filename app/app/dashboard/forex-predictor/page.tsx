'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
  BarChart, Bar, LineChart, Line, LabelList,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus, Brain, Newspaper,
  RefreshCw, ArrowRight, Clock,
} from 'lucide-react'

const CURRENCIES = [
  'INR','USD','AED','EUR','GBP','JPY','CAD','AUD','CHF','CNY','HKD','SGD',
  'SAR','QAR','KWD','MYR','THB','PHP','IDR','PKR','BDT','LKR','NPR','EGP',
  'NGN','KES','ZAR','BRL','MXN','TRY','RUB','KRW','TWD','VND','SEK','NOK',
  'DKK','PLN','CZK','HUF','RON','BGN','UAH','ILS','JOD','OMR','BHD','NZD',
  'CLP','COP','PEN','ARS','GHS','TZS',
]

type DataPoint = { label: string; rate?: number; predicted?: number }
type Analysis = {
  trend: 'up' | 'down' | 'stable'
  prediction_3m: number
  best_time: string
  reasoning: string
  confidence: string
  next_3_months?: { month: string; predicted_rate: number }[]
}
type NewsItem = { title: string; snippet: string; source: string; date: string; link: string; imageUrl?: string }

const BEST_TIME_MAP: Record<string, { label: string; tone: string; desc: string }> = {
  now:      { label: 'Send now',      tone: 'sx-pill-mint',   desc: 'Current rate looks favorable.' },
  wait_1w:  { label: 'Wait ~1 week',  tone: 'sx-pill-amber',  desc: 'Slight improvement likely in 7 days.' },
  wait_1m:  { label: 'Wait ~1 month', tone: 'sx-pill-amber',  desc: 'Better rate expected within 30 days.' },
  wait_3m:  { label: 'Wait ~3 months', tone: 'sx-pill-coral', desc: 'Significant improvement in 3 months.' },
}

const CHART_TYPES = ['area', 'line', 'bar'] as const
type ChartType = typeof CHART_TYPES[number]

export default function ForexPredictorPage() {
  const [base, setBase] = useState('INR')
  const [target, setTarget] = useState('USD')
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentRate, setCurrentRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [chartType, setChartType] = useState<ChartType>('area')
  const [showGrid, setShowGrid] = useState(true)
  const [showPrediction, setShowPrediction] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRate = useCallback(async (b: string, t: string) => {
    const res = await fetch(`/api/forex?base=${b}&target=${t}`)
    if (res.ok) {
      const d = await res.json()
      if (d.rate) { setCurrentRate(d.rate); setLastUpdated(new Date()) }
    }
  }, [])

  useEffect(() => {
    if (!base || !target || base === target) return
    fetchRate(base, target)
    intervalRef.current = setInterval(() => fetchRate(base, target), 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [base, target, fetchRate])

  const analyze = useCallback(async () => {
    if (base === target) return
    setLoading(true)
    try {
      const [predRes, newsRes] = await Promise.all([
        fetch('/api/forex/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base, target }),
        }),
        fetch(`/api/forex/news?base=${base}&target=${target}`),
      ])
      const predData = predRes.ok ? await predRes.json() : {}
      const newsData = newsRes.ok ? await newsRes.json() : { news: [] }

      if (predData.currentRate) {
        setCurrentRate(predData.currentRate)
        setLastUpdated(new Date())
        setAnalysis(predData.analysis)
        const hist = (predData.historical ?? []).map((h: any) => ({
          label: h.label,
          rate: h.rate != null ? Number(h.rate) : null,
          predicted: null as number | null,
        }))
        if (hist.length > 0) hist[hist.length - 1].predicted = hist[hist.length - 1].rate
        const preds = (predData.analysis?.next_3_months ?? []).map((p: any) => ({
          label: String(p.month),
          rate: null as number | null,
          predicted: p.predicted_rate != null ? Number(p.predicted_rate) : null,
        }))
        setChartData([...hist, ...preds])
      }
      setNews(newsData.news ?? [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [base, target])

  const TrendIcon = analysis?.trend === 'up' ? TrendingUp : analysis?.trend === 'down' ? TrendingDown : Minus
  const trendPill = analysis?.trend === 'up' ? 'sx-pill-mint' : analysis?.trend === 'down' ? 'sx-pill-coral' : 'sx-pill-amber'
  const bestTime = analysis ? (BEST_TIME_MAP[analysis.best_time] ?? BEST_TIME_MAP.now) : null

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-xl p-3 shadow-xl text-xs"
           style={{ background: 'var(--sx-panel)', border: '1px solid var(--sx-line)' }}>
        <p className="mb-1 font-semibold" style={{ color: 'var(--sx-ink-3)' }}>{label}</p>
        {payload.map((p: any) => p.value != null && (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-bold" style={{ color: 'var(--sx-ink)' }}>{Number(p.value).toFixed(6)}</span>
          </p>
        ))}
      </div>
    )
  }

  const allValues = chartData.flatMap(d => [d.rate, d.predicted].filter((v): v is number => v != null && !isNaN(Number(v))))
  const yMin = allValues.length ? Math.min(...allValues) * 0.98 : 'auto'
  const yMax = allValues.length ? Math.max(...allValues) * 1.02 : 'auto'

  const chartProps = { data: chartData, margin: { top: 40, right: 20, left: 0, bottom: 50 } }

  const labelFormatter = (v: any) => {
    const val = Array.isArray(v) ? v[1] : v
    return val != null && !isNaN(Number(val)) ? Number(val).toFixed(4) : ''
  }

  const ForecastDot = (props: any) => {
    const { cx, cy, value } = props
    if (value == null || isNaN(cx) || isNaN(cy)) return null
    const numericValue = Array.isArray(value) ? value[1] : value
    if (numericValue == null) return null
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />
        <text x={cx} y={cy - 14} textAnchor="middle" fill="#6d28d9" fontSize={10} fontWeight="700">
          {Number(numericValue).toFixed(4)}
        </text>
      </g>
    )
  }

  const renderChart = () => {
    const commonAxis = (
      <>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sx-line)" />}
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
               interval={0} angle={-40} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
               domain={[yMin, yMax]} tickFormatter={(v: number) => v.toFixed(4)} width={72} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <ReferenceLine x="Now" stroke="#94a3b8" strokeDasharray="4 4"
                       label={{ value: 'Today', fill: '#64748b', fontSize: 9, position: 'insideTopRight' }} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: '#64748b' }} />
      </>
    )

    if (chartType === 'bar') return (
      <BarChart {...chartProps}>
        {commonAxis}
        <Bar dataKey="rate" fill="#4f46e5" name={`${base}/${target}`} radius={[4,4,0,0]} opacity={0.9}>
          <LabelList dataKey="rate" position="top" fill="#4f46e5" style={{ fontSize: 8 }} formatter={labelFormatter} />
        </Bar>
        {showPrediction && (
          <Bar dataKey="predicted" fill="#8b5cf6" name="AI Forecast" radius={[4,4,0,0]} opacity={0.9}>
            <LabelList dataKey="predicted" position="top" fill="#6d28d9" style={{ fontSize: 9, fontWeight: 700 }} formatter={labelFormatter} />
          </Bar>
        )}
      </BarChart>
    )

    if (chartType === 'line') return (
      <LineChart {...chartProps}>
        {commonAxis}
        <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2.5}
              dot={{ fill: '#4f46e5', r: 3, strokeWidth: 0 }} activeDot={{ r: 6 }}
              name={`${base}/${target}`} connectNulls={false} />
        {showPrediction && (
          <Line type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2.5}
                strokeDasharray="6 3" dot={<ForecastDot />} activeDot={{ r: 7, fill: '#8b5cf6' }}
                name="AI Forecast" connectNulls={true} />
        )}
      </LineChart>
    )

    return (
      <AreaChart {...chartProps}>
        <defs>
          <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        {commonAxis}
        <Area type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2.5}
              fill="url(#rateGrad)" dot={{ fill: '#4f46e5', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 6 }} name={`${base}/${target}`} connectNulls={false} />
        {showPrediction && (
          <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={2.5}
                strokeDasharray="6 3" fill="url(#predGrad)"
                dot={<ForecastDot />} activeDot={{ r: 7, fill: '#8b5cf6' }}
                name="AI Forecast" connectNulls={true} />
        )}
      </AreaChart>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="sx-h-eyebrow"><Brain size={12} className="inline -mt-0.5 mr-1" /> Rate Intelligence</p>
        <h1 className="sx-h-title mt-2">Forex predictor & market signals</h1>
        <p className="sx-h-sub mt-1">AI-driven projections, live rates, and the news shaping them.</p>
      </header>

      {/* Currency selector card */}
      <div className="sx-card p-5">
        <div className="grid md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          <label className="sx-field">
            <select value={base} onChange={e => setBase(e.target.value)} className="font-bold">
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <span>From</span>
          </label>
          <span className="pb-3 hidden md:inline" style={{ color: 'var(--sx-ink-3)' }}>
            <ArrowRight size={20} />
          </span>
          <label className="sx-field">
            <select value={target} onChange={e => setTarget(e.target.value)} className="font-bold">
              {CURRENCIES.filter(c => c !== base).map(c => <option key={c}>{c}</option>)}
            </select>
            <span>To</span>
          </label>
          <button onClick={analyze} disabled={loading || base === target}
            className="sx-btn sx-btn-primary h-[58px]">
            {loading ? <><RefreshCw size={15} className="animate-spin" /> Analyzing</> : <><Brain size={15} /> Analyze</>}
          </button>
        </div>

        {currentRate && (
          <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 border"
               style={{ background: 'var(--sx-panel-2)', borderColor: 'var(--sx-line)' }}>
            <span className="sx-pulse-dot" />
            <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
              1 {base} = {currentRate.toFixed(6)} {target}
            </span>
            <span className="ml-auto text-xs flex items-center gap-1" style={{ color: 'var(--sx-ink-3)' }}>
              <RefreshCw size={10} /> Live · {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      {analysis && currentRate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="sx-card p-5">
            <p className="sx-h-eyebrow">Market trend</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex w-11 h-11 rounded-xl items-center justify-center"
                    style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
                <TrendIcon size={20} />
              </span>
              <span className="text-xl font-extrabold capitalize" style={{ color: 'var(--sx-ink)' }}>{analysis.trend}</span>
            </div>
            <span className={`sx-pill ${trendPill} mt-3`}>{analysis.confidence} confidence</span>
          </div>

          <div className="sx-card p-5">
            <p className="sx-h-eyebrow flex items-center gap-1"><Clock size={11} /> Best time to send</p>
            <p className="text-xl font-extrabold mt-2" style={{ color: 'var(--sx-ink)' }}>{bestTime?.label}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--sx-ink-3)' }}>{bestTime?.desc}</p>
          </div>

          <div className="sx-card p-5">
            <p className="sx-h-eyebrow">3-month forecast</p>
            <p className="text-xl font-extrabold mt-2" style={{ color: 'var(--sx-violet)' }}>
              {Number(analysis.prediction_3m).toFixed(6)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--sx-ink-3)' }}>
              {analysis.prediction_3m > currentRate
                ? `▲ +${((analysis.prediction_3m - currentRate) / currentRate * 100).toFixed(2)}% expected`
                : `▼ ${((analysis.prediction_3m - currentRate) / currentRate * 100).toFixed(2)}% expected`}
            </p>
          </div>
        </div>
      )}

      {/* AI reasoning */}
      {analysis?.reasoning && (
        <div className="sx-card p-5 flex gap-3" style={{ background: 'var(--sx-primary-soft)' }}>
          <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center shrink-0"
                style={{ background: 'rgba(99,102,241,0.20)', color: 'var(--sx-primary)' }}>
            <Brain size={16} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sx-primary)' }}>AI analysis</p>
            <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--sx-ink-2)' }}>{analysis.reasoning}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="sx-card p-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>
                12-month history + 3-month forecast
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sx-ink-3)' }}>{base}/{target} exchange rate</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex p-0.5 rounded-lg" style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
                {CHART_TYPES.map(t => {
                  const active = chartType === t
                  return (
                    <button key={t} onClick={() => setChartType(t)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold transition capitalize"
                      style={{
                        background: active ? 'var(--sx-panel)' : 'transparent',
                        color: active ? 'var(--sx-primary)' : 'var(--sx-ink-3)',
                      }}>
                      {t}
                    </button>
                  )
                })}
              </div>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--sx-ink-3)' }}>
                <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="accent-indigo-600" />
                Grid
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--sx-ink-3)' }}>
                <input type="checkbox" checked={showPrediction} onChange={e => setShowPrediction(e.target.checked)} className="accent-indigo-600" />
                Forecast
              </label>
            </div>
          </div>
          <div className="min-w-[600px]">
            <ResponsiveContainer width="100%" height={420}>
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* News */}
      <div className="sx-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center"
                style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
            <Newspaper size={16} />
          </span>
          <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>Market pulse</h3>
        </div>

        {!news.length ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--sx-ink-3)' }}>
            Click <span className="font-bold" style={{ color: 'var(--sx-primary)' }}>Analyze</span> to load latest news.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {news.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                 className="flex gap-3 p-4 rounded-xl border hover:shadow-sm transition group"
                 style={{ background: 'var(--sx-panel-2)', borderColor: 'var(--sx-line)' }}>
                {n.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0"
                       onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-indigo-600 transition"
                     style={{ color: 'var(--sx-ink)' }}>{n.title}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--sx-ink-3)' }}>{n.snippet}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-semibold" style={{ color: 'var(--sx-primary)' }}>{n.source}</span>
                    {n.date && <span className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>· {n.date}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
