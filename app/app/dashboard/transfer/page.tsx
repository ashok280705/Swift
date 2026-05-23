'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, ArrowDown, User2, ShieldCheck, Send } from 'lucide-react'
import { useLang } from '@/lib/i18n'

type Quote = {
  rate: number
  fee: number
  razorpay_fee: number
  bank_fee: number
  bank_fee_rate: number
  converted: number
  base: string
  target: string
}
type Summary = {
  txn_ref: string; sender_rm_id: string; receiver_rm_id: string
  source_amount: number; source_currency: string
  target_amount: number; target_currency: string
  fx_rate: number; fee_amount: number; status: string; timestamp: string
}

const CURRENCIES = ['INR', 'USD', 'AED', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD', 'SAR', 'QAR', 'KWD', 'MYR', 'THB', 'PHP', 'IDR', 'PKR', 'BDT', 'LKR', 'NPR', 'EGP', 'NGN', 'KES', 'ZAR', 'BRL', 'MXN', 'TRY', 'RUB', 'KRW', 'TWD', 'VND', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'UAH', 'ILS', 'JOD', 'OMR', 'BHD', 'NZD', 'CLP', 'COP', 'PEN', 'ARS', 'GHS', 'TZS']

export default function TransferPage() {
  const { t } = useLang()
  const [form, setForm] = useState({
    recipient: '', source_currency: 'INR', target_currency: 'USD', amount: '', note: ''
  })
  const [recipient, setRecipient] = useState<{ rm_id: string; full_name: string } | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => {
    if (!form.recipient || form.recipient.length < 4) { setRecipient(null); return }
    const t = setTimeout(async () => {
      setLookingUp(true)
      const res = await fetch(`/api/recipient?id=${encodeURIComponent(form.recipient)}`)
      setLookingUp(false)
      if (res.ok) setRecipient(await res.json())
      else setRecipient(null)
    }, 500)
    return () => clearTimeout(t)
  }, [form.recipient])

  useEffect(() => {
    if (!form.amount || Number(form.amount) <= 0) { setQuote(null); return }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/forex?base=${form.source_currency}&target=${form.target_currency}&amount=${form.amount}`
      )
      if (res.ok) setQuote(await res.json())
    }, 400)
    return () => clearTimeout(t)
  }, [form.amount, form.source_currency, form.target_currency])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setSummary(data.summary)
  }

  if (summary) return <TransferReceipt summary={summary} onNew={() => {
    setSummary(null)
    setForm({ recipient: '', source_currency: 'INR', target_currency: 'USD', amount: '', note: '' })
    setQuote(null)
  }} />

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="sx-h-eyebrow">{t('transfer.eyebrow')}</p>
        <h1 className="sx-h-title mt-2">{t('transfer.title')}</h1>
        <p className="sx-h-sub mt-1">{t('transfer.desc')}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2"
               style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        {/* Recipient */}
        <div className="sx-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center"
                  style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
              <User2 size={16} />
            </span>
            <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>Who are you paying?</h3>
          </div>
          <div className="sx-field">
            <input id="sx-rcp" placeholder=" " value={form.recipient}
              onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))} required />
            <label htmlFor="sx-rcp">SwiftX ID, email, or phone</label>
          </div>
          <div className="mt-3 min-h-[1.5rem]">
            {lookingUp && <span className="text-xs sx-shimmer rounded px-2 py-0.5">Looking up…</span>}
            {recipient && (
              <span className="sx-pill sx-pill-mint">
                <CheckCircle2 size={11} /> {recipient.full_name} · {recipient.rm_id}
              </span>
            )}
          </div>
        </div>

        {/* Amount block */}
        <div className="sx-card p-6">
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--sx-ink)' }}>How much?</h3>

          <ExchangeRow
            heading="You send"
            value={form.amount}
            onChange={v => setForm(f => ({ ...f, amount: v }))}
            currency={form.source_currency}
            setCurrency={v => setForm(f => ({ ...f, source_currency: v }))}
            editable
          />

          <div className="relative h-6 my-1">
            <span className="absolute left-1/2 -translate-x-1/2 -top-1 inline-flex w-9 h-9 rounded-full items-center justify-center border-4"
                  style={{ background: 'var(--sx-primary)', borderColor: 'var(--sx-canvas)', color: 'white' }}>
              <ArrowDown size={14} />
            </span>
          </div>

          <ExchangeRow
            heading="They receive"
            value={quote ? quote.converted.toFixed(2) : '0.00'}
            currency={form.target_currency}
            setCurrency={v => setForm(f => ({ ...f, target_currency: v }))}
            readOnly
          />

          {quote && (
            <div className="mt-5 rounded-xl p-4 space-y-2"
                 style={{ background: 'var(--sx-panel-2)', border: '1px dashed var(--sx-line)' }}>
              <Row label="Live exchange rate" value={`1 ${quote.base} = ${quote.rate.toFixed(4)} ${quote.target}`} />
              <Row label="Razorpay fee (2%)" value={`${quote.base} ${quote.razorpay_fee.toFixed(2)}`} />
              <Row
                label={`Bank processing (${(quote.bank_fee_rate * 100).toFixed(2)}%)`}
                value={`${quote.base} ${quote.bank_fee.toFixed(2)}`}
              />
              <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--sx-line)' }} />
              <Row label="Total deducted from wallet" value={`${quote.base} ${(Number(form.amount) + quote.fee).toFixed(2)}`} />
              <Row label="Arrives in" value="~60 seconds" mute />
            </div>
          )}
        </div>

        <div className="sx-card p-6">
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--sx-ink)' }}>Add a note</h3>
          <div className="sx-field">
            <input id="sx-note" placeholder=" " value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            <label htmlFor="sx-note">Note (optional)</label>
          </div>
        </div>

        <button type="submit" disabled={loading || !recipient || !quote}
          className="sx-btn sx-btn-primary w-full py-4 text-base">
          {loading ? 'Processing…' : <>Send securely <Send size={16} /></>}
        </button>

        <p className="text-xs text-center flex items-center justify-center gap-2"
           style={{ color: 'var(--sx-ink-3)' }}>
          <ShieldCheck size={14} /> Protected by SwiftX trust & safety.
        </p>
      </form>
    </div>
  )
}

function ExchangeRow({
  heading, value, onChange, currency, setCurrency, editable = false, readOnly = false,
}: {
  heading: string; value: string; onChange?: (v: string) => void;
  currency: string; setCurrency: (v: string) => void;
  editable?: boolean; readOnly?: boolean;
}) {
  return (
    <div className="rounded-2xl p-5 flex items-center justify-between border"
         style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel-2)' }}>
      <div className="flex-1">
        <p className="sx-h-eyebrow">{heading}</p>
        {editable ? (
          <input type="number" min="1" step="0.01" placeholder="0.00"
            value={value} onChange={e => onChange?.(e.target.value)} required
            className="w-full bg-transparent text-3xl md:text-4xl font-extrabold tracking-tight focus:outline-none mt-1"
            style={{ color: 'var(--sx-ink)' }} />
        ) : (
          <p className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--sx-ink)' }}>
            {value}
          </p>
        )}
      </div>
      <select value={currency} onChange={e => setCurrency(e.target.value)}
        className="rounded-xl px-4 py-3 font-bold cursor-pointer border focus:outline-none"
        style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)', color: 'var(--sx-ink)' }}>
        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
      </select>
    </div>
  )
}

function Row({ label, value, mute = false }: { label: string; value: string; mute?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: 'var(--sx-ink-3)' }}>{label}</span>
      <span className="font-semibold" style={{ color: mute ? 'var(--sx-ink-2)' : 'var(--sx-ink)' }}>{value}</span>
    </div>
  )
}

function TransferReceipt({ summary, onNew }: { summary: Summary; onNew: () => void }) {
  const symbol: Record<string, string> = { INR: '₹', USD: '$', AED: 'د.إ', EUR: '€', GBP: '£' }
  const sym = (c: string) => symbol[c] ?? c + ' '

  return (
    <div className="max-w-xl mx-auto sx-fade-up">
      <div className="sx-card p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full"
             style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', opacity: 0.10 }} />

        <div className="text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center"
               style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-3" style={{ color: 'var(--sx-ink)' }}>
            Transfer complete
          </h2>
          <p className="text-sm" style={{ color: 'var(--sx-ink-3)' }}>
            {sym(summary.target_currency)}{summary.target_amount.toFixed(2)} sent to {summary.receiver_rm_id}
          </p>
        </div>

        <div className="mt-6 rounded-2xl p-5 space-y-2.5 text-sm"
             style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
          {[
            ['Transaction ID', summary.txn_ref],
            ['Sender SwiftX ID', summary.sender_rm_id],
            ['Receiver SwiftX ID', summary.receiver_rm_id],
            ['Amount sent', `${sym(summary.source_currency)}${summary.source_amount.toLocaleString()}`],
            ['Recipient gets', `${sym(summary.target_currency)}${summary.target_amount.toFixed(4)}`],
            ['Rate', `1 ${summary.source_currency} = ${summary.fx_rate.toFixed(4)} ${summary.target_currency}`],
            ['Fees (Razorpay + Bank)', `${sym(summary.source_currency)}${summary.fee_amount.toFixed(2)}`],
            ['Status', summary.status.toUpperCase()],
            ['Timestamp', new Date(summary.timestamp).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>{k}</span>
              <span className={`font-semibold ${k === 'Status' ? 'sx-pill sx-pill-mint' : ''}`}
                    style={k === 'Status' ? undefined : { color: 'var(--sx-ink)' }}>{v}</span>
            </div>
          ))}
        </div>

        <button onClick={onNew} className="sx-btn sx-btn-primary w-full mt-5">New transfer</button>
      </div>
    </div>
  )
}
