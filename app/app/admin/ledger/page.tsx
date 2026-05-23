'use client'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  ShieldCheck, ShieldAlert, RefreshCw, Hash, ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react'

type Ev = {
  id: number
  event_type: string
  actor_id: string | null
  target_id: string | null
  entity: string | null
  entity_id: string | null
  payload: Record<string, any>
  ip_address: string | null
  prev_hash: string
  row_hash: string
  created_at: string
}

type Verify = {
  ok: boolean
  isValid?: boolean
  brokenAt?: number | null
  totalEvents?: number
  headHash?: string
  error?: string
}

const PILL: Record<string, string> = {
  'auth.register':       'sx-pill',
  'deposit.completed':   'sx-pill-mint',
  'withdraw.requested':  'sx-pill-amber',
  'transfer.completed':  'sx-pill-violet',
  'savings.deposit':     'sx-pill-violet',
  'savings.withdraw':    'sx-pill-amber',
  'admin.freeze':        'sx-pill-coral',
  'admin.unfreeze':      'sx-pill-mint',
  'admin.kyc_verify':    'sx-pill-mint',
  'admin.kyc_reject':    'sx-pill-coral',
}

export default function LedgerPage() {
  const [events, setEvents] = useState<Ev[]>([])
  const [verify, setVerify] = useState<Verify | null>(null)
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/ledger')
      const d = await r.json()
      setEvents(d.events ?? [])
      setVerify(d.verify)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="sx-h-eyebrow"><Hash size={12} className="inline -mt-0.5 mr-1" /> Tamper-evident ledger</p>
          <h1 className="sx-h-title mt-2">Immutable activity log</h1>
          <p className="sx-h-sub mt-1">Every state change is hash-chained. Verify the chain to confirm history hasn't been altered.</p>
        </div>
        <button onClick={load} disabled={loading} className="sx-btn sx-btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <IntegrityCard verify={verify} loading={loading} />

      <section className="sx-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between"
             style={{ borderColor: 'var(--sx-line)' }}>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--sx-ink)' }}>Events</h3>
            <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>Newest first · {events.length} shown</p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <Hash size={28} className="mx-auto opacity-30" style={{ color: 'var(--sx-ink-3)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--sx-ink-3)' }}>
              No events yet — the chain begins with your first deposit, transfer, or admin action.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--sx-line)' }}>
            {events.map(ev => (
              <li key={ev.id}
                  className="px-6 py-3 hover:bg-black/[0.015] transition cursor-pointer"
                  style={{ borderTopColor: 'var(--sx-line)' }}
                  onClick={() => setOpenId(openId === ev.id ? null : ev.id)}>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <span className="col-span-1 font-mono text-xs" style={{ color: 'var(--sx-ink-3)' }}>
                    #{ev.id}
                  </span>
                  <span className={`col-span-2 sx-pill ${PILL[ev.event_type] ?? 'sx-pill'}`}>
                    {ev.event_type}
                  </span>
                  <span className="col-span-2 text-xs font-mono truncate" style={{ color: 'var(--sx-ink-2)' }}>
                    {ev.actor_id ? ev.actor_id.slice(0, 8) + '…' : '—'}
                  </span>
                  <span className="col-span-3 text-xs font-mono truncate" style={{ color: 'var(--sx-ink-3)' }}>
                    {ev.row_hash.slice(0, 18)}…
                  </span>
                  <span className="col-span-3 text-xs" style={{ color: 'var(--sx-ink-3)' }}>
                    {format(new Date(ev.created_at), 'dd MMM yyyy, HH:mm:ss')}
                  </span>
                  <span className="col-span-1 text-right" style={{ color: 'var(--sx-ink-3)' }}>
                    {openId === ev.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>

                {openId === ev.id && <EventDetail ev={ev} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function IntegrityCard({ verify, loading }: { verify: Verify | null; loading: boolean }) {
  const ok = verify?.isValid === true
  const broken = verify?.isValid === false
  const tone = ok ? 'mint' : broken ? 'coral' : 'slate'
  const accent = ok
    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    : broken
      ? 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)'
      : 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)'

  return (
    <div className="sx-card p-6 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: accent, opacity: 0.10 }} />
      <div className="flex items-start gap-4">
        <span className="inline-flex w-12 h-12 rounded-xl items-center justify-center text-white"
              style={{ background: accent }}>
          {ok ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-lg" style={{ color: 'var(--sx-ink)' }}>
              {loading ? 'Verifying chain…' : ok ? 'Chain intact' : broken ? 'Chain tampered' : 'Unknown'}
            </h2>
            <span className={`sx-pill sx-pill-${tone}`}>
              SHA-256
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--sx-ink-2)' }}>
            {loading
              ? 'Walking every row and recomputing hashes…'
              : ok
                ? `All ${verify?.totalEvents ?? 0} events verified. Each row's hash matches the chain.`
                : broken
                  ? `Integrity broken at row #${verify?.brokenAt}. History was modified — see audit.`
                  : verify?.error ?? '—'}
          </p>
          {verify?.headHash && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: 'var(--sx-ink-3)' }}>Head hash</span>
              <code className="text-[11px] font-mono px-2 py-1 rounded-md"
                    style={{ background: 'var(--sx-panel-2)', color: 'var(--sx-ink-2)' }}>
                {verify.headHash}
              </code>
              <CopyButton text={verify.headHash} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EventDetail({ ev }: { ev: Ev }) {
  return (
    <div className="mt-3 ml-6 mr-2 p-4 rounded-xl space-y-3"
         style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}
         onClick={(e) => e.stopPropagation()}>
      <Field label="Actor"   value={ev.actor_id ?? '—'} />
      <Field label="Target"  value={ev.target_id ?? '—'} />
      <Field label="Entity"  value={`${ev.entity ?? '—'} / ${ev.entity_id ?? '—'}`} />
      <Field label="IP"      value={ev.ip_address ?? '—'} />
      <Field label="Prev hash" value={ev.prev_hash} mono />
      <Field label="Row hash"  value={ev.row_hash}  mono accent />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--sx-ink-3)' }}>Payload</p>
        <pre className="text-[11px] p-3 rounded-lg overflow-x-auto font-mono"
             style={{ background: 'var(--sx-panel)', color: 'var(--sx-ink-2)', border: '1px solid var(--sx-line)' }}>
          {JSON.stringify(ev.payload, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function Field({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
      <span className="text-[11px] font-bold uppercase tracking-wider pt-0.5" style={{ color: 'var(--sx-ink-3)' }}>
        {label}
      </span>
      <span className={mono ? 'text-[11px] font-mono break-all' : 'text-sm'}
            style={{ color: accent ? 'var(--sx-primary)' : 'var(--sx-ink-2)' }}>
        {value}
        {mono && <CopyButton text={value} inline />}
      </span>
    </div>
  )
}

function CopyButton({ text, inline = false }: { text: string; inline?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <button onClick={(e) => {
      e.stopPropagation()
      navigator.clipboard.writeText(text)
      setDone(true); setTimeout(() => setDone(false), 1500)
    }}
      className={`${inline ? 'ml-2 align-middle' : ''} inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded`}
      style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
      {done ? <Check size={11} /> : <Copy size={11} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}
