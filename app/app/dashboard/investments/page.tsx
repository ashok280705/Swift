'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, X, ExternalLink, TrendingUp, Globe } from 'lucide-react'

const COUNTRIES = [
  { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'US', flag: '🇺🇸', name: 'USA' },
  { code: 'GB', flag: '🇬🇧', name: 'UK' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
]

type Plan = {
  title: string
  link: string
  snippet: string
  source: string
  sitelinks: { title: string; link: string }[]
}

const ACCENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
  'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
  'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
  'linear-gradient(135deg, #ca8a04 0%, #facc15 100%)',
  'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
  'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
  'linear-gradient(135deg, #047857 0%, #34d399 100%)',
  'linear-gradient(135deg, #be123c 0%, #fb7185 100%)',
]

export default function InvestmentPlansPage() {
  const [country, setCountry] = useState('IN')
  const [query, setQuery] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [activeQuery, setActiveQuery] = useState('')

  const fetchPlans = useCallback(async (c: string, q?: string) => {
    setLoading(true)
    const params = new URLSearchParams({ country: c })
    if (q) params.set('q', q)
    const res = await fetch(`/api/investments?${params}`)
    const data = res.ok ? await res.json() : { plans: [] }
    setPlans(data.plans ?? [])
    setActiveQuery(data.query ?? '')
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlans(country, query || undefined) }, [country, query, fetchPlans])

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setQuery(inputVal.trim()) }
  function clearSearch() { setInputVal(''); setQuery('') }

  const selectedCountry = COUNTRIES.find(c => c.code === country)

  return (
    <div>
      <header className="mb-8">
        <p className="sx-h-eyebrow"><TrendingUp size={12} className="inline -mt-0.5 mr-1" /> Markets</p>
        <h1 className="sx-h-title mt-2">Discover investment opportunities</h1>
        <p className="sx-h-sub mt-1">Curated plans from across the web for {selectedCountry?.flag} {selectedCountry?.name}.</p>
      </header>

      {/* Country chip-bar */}
      <div className="flex gap-2 flex-wrap mb-5">
        {COUNTRIES.map(c => {
          const active = country === c.code
          return (
            <button key={c.code} onClick={() => { setCountry(c.code); setQuery(''); setInputVal('') }}
              className="text-xs font-semibold px-3.5 py-2 rounded-full border transition"
              style={{
                borderColor: active ? 'transparent' : 'var(--sx-line)',
                background: active ? 'var(--sx-primary)' : 'var(--sx-panel)',
                color: active ? '#fff' : 'var(--sx-ink-2)',
              }}>
              {c.flag} {c.name}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--sx-ink-3)' }} />
          <input value={inputVal} onChange={e => setInputVal(e.target.value)}
            placeholder={`Search plans in ${selectedCountry?.name}…`}
            className="w-full rounded-xl pl-10 pr-10 py-3 text-sm font-medium focus:outline-none border"
            style={{ background: 'var(--sx-panel)', borderColor: 'var(--sx-line)', color: 'var(--sx-ink)' }} />
          {inputVal && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5"
                    style={{ color: 'var(--sx-ink-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="sx-btn sx-btn-primary"><Search size={14} /> Search</button>
          <button type="button" onClick={() => fetchPlans(country, query || undefined)} disabled={loading} className="sx-btn sx-btn-ghost">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </form>

      {activeQuery && (
        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: 'var(--sx-ink-3)' }}>
          <Globe size={12} /> Showing results for <span className="font-bold" style={{ color: 'var(--sx-ink)' }}>"{activeQuery}"</span>
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sx-card p-6 space-y-3">
              <div className="h-4 rounded sx-shimmer w-2/3" />
              <div className="h-3 rounded sx-shimmer w-1/2" />
              <div className="h-16 rounded sx-shimmer" />
              <div className="h-9 rounded sx-shimmer" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto opacity-30" style={{ color: 'var(--sx-ink-3)' }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--sx-ink-3)' }}>No results. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div key={i} className="sx-card p-6 relative flex flex-col gap-4 overflow-hidden">
              <span className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.08]"
                    style={{ background: ACCENTS[i % ACCENTS.length] }} />
              <div className="flex items-center justify-between">
                <span className="sx-pill" style={{ background: 'var(--sx-panel-2)', color: 'var(--sx-ink-2)' }}>
                  {plan.source}
                </span>
                <span className="text-base">{selectedCountry?.flag}</span>
              </div>

              <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--sx-ink)' }}>
                {plan.title}
              </h3>

              <p className="text-xs leading-relaxed line-clamp-4 flex-1" style={{ color: 'var(--sx-ink-2)' }}>
                {plan.snippet}
              </p>

              {plan.sitelinks?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {plan.sitelinks.map((s, j) => (
                    <a key={j} href={s.link} target="_blank" rel="noopener noreferrer"
                       className="text-[11px] font-semibold px-2 py-1 rounded-full transition"
                       style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
                      {s.title}
                    </a>
                  ))}
                </div>
              )}

              <a href={plan.link} target="_blank" rel="noopener noreferrer" className="sx-btn sx-btn-ghost w-full text-xs">
                View plan <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-center mt-10" style={{ color: 'var(--sx-ink-3)' }}>
        Results sourced from public web search. SwiftX does not endorse any specific investment product — consult a registered advisor.
      </p>
    </div>
  )
}
