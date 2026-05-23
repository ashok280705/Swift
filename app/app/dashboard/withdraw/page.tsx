'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, Building2, ArrowRight } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export default function WithdrawPage() {
  const { t } = useLang()
  const [balances, setBalances] = useState({ inr: 0, usd: 0 })
  const [form, setForm] = useState({ amount: '', currency: 'INR', bank_account: '', ifsc: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/wallet').then(r => r.json()).then(d => {
      if (d.wallet) setBalances({ inr: d.wallet.inr_balance ?? 0, usd: d.wallet.usd_balance ?? 0 })
    })
    Promise.all([
      fetch('/api/wallet/inr').then(r => r.json()),
      fetch('/api/wallet/usd').then(r => r.json()),
    ]).then(([inr, usd]) => {
      setBalances({ inr: inr.balance ?? 0, usd: usd.balance ?? 0 })
    }).catch(() => {})
  }, [])

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(null)
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setSuccess(data.ref)
  }

  const available = form.currency === 'USD' ? balances.usd : balances.inr

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="sx-h-eyebrow">{t('withdraw.eyebrow')}</p>
        <h1 className="sx-h-title mt-2">{t('withdraw.title')}</h1>
        <p className="sx-h-sub mt-1">{t('withdraw.desc')}</p>
      </header>

      {success ? (
        <SuccessCard reference={success} onAgain={() => setSuccess(null)} />
      ) : (
        <form onSubmit={handleWithdraw} className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="sx-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>Withdrawal amount</h3>
                <span className="text-xs font-semibold" style={{ color: 'var(--sx-ink-3)' }}>
                  Available · <span style={{ color: 'var(--sx-ink)' }}>{form.currency} {Number(available).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </span>
              </div>

              {error && (
                <div className="text-sm font-medium rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
                     style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
                  <AlertTriangle size={16} />{error}
                </div>
              )}

              <div className="flex items-end gap-3 mt-4">
                <input type="number" min="1" max={available} step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
                  className="flex-1 text-5xl font-extrabold tracking-tight bg-transparent focus:outline-none"
                  style={{ color: 'var(--sx-ink)' }}
                />
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="rounded-xl px-4 py-3 font-semibold cursor-pointer border focus:outline-none"
                  style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)', color: 'var(--sx-ink)' }}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="flex gap-2 mt-4 flex-wrap">
                {[0.25, 0.5, 0.75, 1].map(p => (
                  <button type="button" key={p}
                    onClick={() => setForm(f => ({ ...f, amount: (available * p).toFixed(2) }))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{
                      background: 'var(--sx-panel-2)', color: 'var(--sx-ink-2)',
                      border: '1px solid var(--sx-line)',
                    }}>
                    {p === 1 ? 'Max' : `${p * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="sx-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center"
                      style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
                  <Building2 size={16} />
                </span>
                <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>Beneficiary bank</h3>
              </div>

              <div className="sx-field">
                <input id="sx-acc" type="text" placeholder=" " value={form.bank_account}
                  onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} required />
                <label htmlFor="sx-acc">Account number</label>
              </div>

              <div className="sx-field">
                <input id="sx-ifsc" type="text" placeholder=" " value={form.ifsc}
                  onChange={e => setForm(f => ({ ...f, ifsc: e.target.value.toUpperCase() }))} required />
                <label htmlFor="sx-ifsc">IFSC / SWIFT code</label>
              </div>
            </div>

            <button type="submit" disabled={loading || !form.amount}
              className="sx-btn sx-btn-primary w-full py-4 text-base">
              {loading ? 'Processing…' : <>Withdraw {form.currency} {form.amount ? Number(form.amount).toLocaleString() : '0.00'} <ArrowRight size={16} /></>}
            </button>
          </div>

          <aside className="sx-card p-6 h-fit lg:sticky lg:top-24 space-y-4">
            <span className="sx-pill">Summary</span>
            <Row label="Amount" value={`${form.currency} ${form.amount ? Number(form.amount).toLocaleString() : '0.00'}`} />
            <Row label="Fee" value="₹0.00" mute />
            <Row label="Settlement" value="1–2 business days" mute />
            <Row label="Destination" value={form.bank_account || '— · — · — ·' } mute />
            <div className="pt-4 border-t" style={{ borderColor: 'var(--sx-line)' }}>
              <p className="text-xs flex items-center gap-2" style={{ color: 'var(--sx-ink-3)' }}>
                <ShieldCheck size={14} /> Protected by 256-bit encryption.
              </p>
            </div>
          </aside>
        </form>
      )}
    </div>
  )
}

function Row({ label, value, mute = false }: { label: string; value: string; mute?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: mute ? 'var(--sx-ink-2)' : 'var(--sx-ink)' }}>{value}</span>
    </div>
  )
}

function SuccessCard({ reference, onAgain }: { reference: string; onAgain: () => void }) {
  return (
    <div className="sx-card max-w-xl mx-auto p-10 text-center sx-fade-up">
      <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
           style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}>
        <CheckCircle2 size={32} />
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
        Withdrawal initiated
      </h2>
      <p className="text-sm mt-2" style={{ color: 'var(--sx-ink-3)' }}>
        Funds will reach your bank in 1–2 business days.
      </p>
      <div className="mt-5 inline-block px-5 py-3 rounded-xl" style={{ background: 'var(--sx-primary-soft)' }}>
        <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>Reference</p>
        <p className="font-mono font-bold" style={{ color: 'var(--sx-primary)' }}>{reference}</p>
      </div>
      <button onClick={onAgain} className="sx-btn sx-btn-primary w-full mt-6">
        New withdrawal
      </button>
    </div>
  )
}
