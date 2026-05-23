'use client'
import { useState, useTransition } from 'react'
import { Search, RefreshCw, X, ArrowRight, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Plan = {
  name: string; type: string; returns: string; risk: string
  minAmount: string; duration: string; description: string
  highlight?: string; icon: string; color: string; link: string
}

const RISK_STYLES: Record<string, string> = {
  Low: 'sx-pill-mint',
  Medium: 'sx-pill-amber',
  High: 'sx-pill-coral',
}

const TONE_ACCENT: Record<string, string> = {
  emerald: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  blue:    'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
  purple:  'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
  orange:  'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
  yellow:  'linear-gradient(135deg, #ca8a04 0%, #facc15 100%)',
  teal:    'linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%)',
}

export default function InvestmentSearch({ plans }: { plans: Plan[] }) {
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = query.trim()
    ? plans.filter(p =>
        [p.name, p.type, p.description, p.returns, p.risk].join(' ')
          .toLowerCase().includes(query.toLowerCase())
      )
    : plans

  function refresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--sx-ink-3)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Try 'low risk', 'tax free', 'retirement'…"
            className="w-full rounded-xl pl-10 pr-10 py-3 text-sm font-medium focus:outline-none transition border"
            style={{
              background: 'var(--sx-panel)',
              borderColor: 'var(--sx-line)',
              color: 'var(--sx-ink)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5"
                    style={{ color: 'var(--sx-ink-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={refresh} disabled={isPending} className="sx-btn sx-btn-ghost">
          <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
          {isPending ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      {query && (
        <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>
          <span className="font-bold" style={{ color: 'var(--sx-ink)' }}>{filtered.length}</span>{' '}
          plan{filtered.length !== 1 ? 's' : ''} matching{' '}
          <span style={{ color: 'var(--sx-primary)' }}>"{query}"</span>
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Search size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--sx-ink-3)' }} />
          <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>No plans match "{query}"</p>
          <button onClick={() => setQuery('')} className="sx-btn sx-btn-secondary mt-3 text-xs">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((plan, i) => (
            <div key={i} className="sx-card p-6 relative flex flex-col gap-4 overflow-hidden">
              <span className="absolute -top-14 -right-14 w-32 h-32 rounded-full opacity-[0.08]"
                    style={{ background: TONE_ACCENT[plan.color] ?? 'var(--sx-primary)' }} />
              {plan.highlight && (
                <span className="absolute -top-2.5 left-5 sx-pill sx-pill-mint">
                  <Star size={10} /> {plan.highlight}
                </span>
              )}
              <div className="flex items-start justify-between mt-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-white text-xl"
                        style={{ background: TONE_ACCENT[plan.color] ?? 'var(--sx-primary)' }}>
                    {plan.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>{plan.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>{plan.type}</p>
                  </div>
                </div>
                <span className={`sx-pill ${RISK_STYLES[plan.risk] ?? ''}`}>{plan.risk}</span>
              </div>

              <div className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
                {plan.returns}
                <span className="text-xs font-medium ml-2" style={{ color: 'var(--sx-ink-3)' }}>est. returns</span>
              </div>

              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--sx-ink-2)' }}>{plan.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg" style={{ background: 'var(--sx-panel-2)' }}>
                  <p style={{ color: 'var(--sx-ink-3)' }}>Min. amount</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--sx-ink)' }}>{plan.minAmount}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: 'var(--sx-panel-2)' }}>
                  <p style={{ color: 'var(--sx-ink-3)' }}>Duration</p>
                  <p className="font-semibold mt-0.5" style={{ color: 'var(--sx-ink)' }}>{plan.duration}</p>
                </div>
              </div>

              <a href={plan.link} target="_blank" rel="noopener noreferrer"
                 className="sx-btn sx-btn-ghost w-full text-sm">
                Learn more <ArrowRight size={14} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
