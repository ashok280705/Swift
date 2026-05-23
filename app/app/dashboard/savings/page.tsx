'use client'
import { useState, useEffect } from 'react'
import { PiggyBank, CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export default function SavingsPage() {
  const { t } = useLang()
  const [savingsBalance, setSavingsBalance] = useState(0)
  const [inrBalance, setInrBalance] = useState(0)
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function loadBalances() {
    const [sav, inr] = await Promise.all([
      fetch('/api/savings').then(r => r.json()),
      fetch('/api/wallet/inr').then(r => r.json()).catch(() => ({ balance: 0 })),
    ])
    setSavingsBalance(Number(sav.balance ?? 0))
    setInrBalance(Number(inr.balance ?? 0))
  }

  useEffect(() => { loadBalances() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)
    const res = await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(amount), action }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setSuccess(true)
    setAmount('')
    loadBalances()
  }

  const available = action === 'deposit' ? inrBalance : savingsBalance

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <p className="sx-h-eyebrow">{t('vault.eyebrow')}</p>
        <h1 className="sx-h-title mt-2">{t('vault.title')}</h1>
        <p className="sx-h-sub mt-1">{t('vault.desc')}</p>
      </header>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        {/* Vault hero + form */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[28px] p-7 text-white"
               style={{
                 background:
                   'radial-gradient(800px 400px at 0% 0%, rgba(139,92,246,0.65) 0%, transparent 60%),' +
                   'radial-gradient(700px 400px at 100% 100%, rgba(99,102,241,0.65) 0%, transparent 60%),' +
                   'linear-gradient(135deg, #4c1d95 0%, #312e81 100%)',
               }}>
            <div className="absolute top-4 right-4 opacity-20">
              <PiggyBank size={120} />
            </div>
            <span className="sx-pill" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
              {t('vault.balance')}
            </span>
            <p className="mt-3 text-5xl font-extrabold tracking-tight">
              ₹{Number(savingsBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-white/80 text-sm flex items-center gap-2">
              <Sparkles size={14} /> Earning <span className="font-bold">6.5% APY</span>, compounded daily.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-xs">
              <TrendingUp size={14} /> Wallet: ₹{Number(inrBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="sx-card p-6">
            {/* Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl gap-1"
                 style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
              {(['deposit', 'withdraw'] as const).map(a => (
                <button key={a} type="button"
                  onClick={() => { setAction(a); setAmount(''); setSuccess(false); setError('') }}
                  className="py-2.5 text-sm font-bold rounded-lg transition"
                  style={{
                    background: action === a ? 'var(--sx-panel)' : 'transparent',
                    color: action === a ? 'var(--sx-primary)' : 'var(--sx-ink-3)',
                    boxShadow: action === a ? 'var(--sx-shadow-1)' : 'none',
                  }}>
                  {a === 'deposit' ? t('vault.move.in') : t('vault.move.out')}
                </button>
              ))}
            </div>

            {success && (
              <div className="mt-5 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2"
                   style={{ background: 'rgba(16,185,129,0.10)', color: '#047857', border: '1px solid rgba(16,185,129,0.20)' }}>
                <CheckCircle2 size={16} />
                {action === 'deposit' ? 'Funds moved into your Vault.' : 'Funds returned to Wallet.'}
              </div>
            )}
            {error && (
              <div className="mt-5 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2"
                   style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
                <AlertTriangle size={16} />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="sx-h-eyebrow">{action === 'deposit' ? 'Move from wallet' : 'Withdraw from vault'}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--sx-ink-3)' }}>
                  Available · ₹{Number(available).toLocaleString()}
                </span>
              </div>

              <div className="flex items-end gap-3">
                <span className="text-4xl font-extrabold" style={{ color: 'var(--sx-ink-3)' }}>₹</span>
                <input type="number" min="1" step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} required placeholder="0.00"
                  className="flex-1 bg-transparent text-5xl font-extrabold tracking-tight focus:outline-none"
                  style={{ color: 'var(--sx-ink)' }} />
              </div>

              <button type="submit" disabled={loading || !amount}
                className="sx-btn sx-btn-primary w-full mt-6 py-4 text-base">
                {loading ? 'Processing…' : action === 'deposit'
                  ? `Move ₹${amount ? Number(amount).toLocaleString() : '0.00'} to Vault`
                  : `Withdraw ₹${amount ? Number(amount).toLocaleString() : '0.00'} to Wallet`}
              </button>
            </form>
          </div>
        </div>

        {/* Side card */}
        <aside className="space-y-4">
          <div className="sx-card p-6">
            <span className="sx-pill sx-pill-violet">Why SwiftX Vault?</span>
            <ul className="mt-4 space-y-3 text-sm" style={{ color: 'var(--sx-ink-2)' }}>
              {[
                ['No lock-in', 'Move funds in and out any time.'],
                ['Daily compounding', 'Your interest works while you sleep.'],
                ['Protected', 'Held in a regulated, insured account.'],
              ].map(([t, d]) => (
                <li key={t}>
                  <p className="font-semibold" style={{ color: 'var(--sx-ink)' }}>{t}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sx-ink-3)' }}>{d}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="sx-card p-6">
            <span className="sx-pill">Projection</span>
            <p className="mt-3 text-sm" style={{ color: 'var(--sx-ink-2)' }}>
              At <span className="font-bold" style={{ color: 'var(--sx-ink)' }}>6.5% APY</span>, ₹{Number(savingsBalance).toLocaleString()}
              {' '}could grow to ~<span className="font-bold" style={{ color: 'var(--sx-primary)' }}>
                ₹{Number(savingsBalance * 1.065).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span> in a year.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
