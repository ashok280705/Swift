'use client'
import { useState } from 'react'
import {
  CheckCircle2, QrCode, Smartphone, ShieldCheck, ArrowRight, AlertTriangle, X,
} from 'lucide-react'
import { useLang } from '@/lib/i18n'

const QUICK_AMOUNTS = [500, 1000, 5000, 10000]
const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

declare global {
  interface Window {
    Razorpay?: any
  }
}

/** Reads a Response and returns JSON if possible, else `{ error: <text> }`. */
async function safeJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => '')
  if (!text) return null
  try { return JSON.parse(text) } catch { return { error: text.slice(0, 200) } }
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if (window.Razorpay) return resolve()
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = RAZORPAY_SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(s)
  })
}

type MockOrder = { mock: true; order_id: string; amount: number; currency: string; key_id: string }

export default function DepositPage() {
  const { t } = useLang()
  const [method, setMethod] = useState<'upi' | 'qr'>('upi')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [mockOrder, setMockOrder] = useState<MockOrder | null>(null)
  const [mockPaying, setMockPaying] = useState(false)

  async function completeMockPayment() {
    if (!mockOrder) return
    setMockPaying(true)
    const payment_id = `pay_MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const vRes = await fetch('/api/deposit/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: mockOrder.order_id,
        razorpay_payment_id: payment_id,
        razorpay_signature: 'mock',
        amount: Number(amount),
        currency,
        method,
      }),
    })
    const vData = await safeJson(vRes)
    setMockPaying(false)
    if (!vRes.ok) { setError(vData?.error || 'Mock payment failed'); setMockOrder(null); return }
    setSuccess(vData.razorpay_ref)
    setMockOrder(null)
    setAmount('')
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)

    try {
      // 1. Create a Razorpay order on the server
      const orderRes = await fetch('/api/deposit/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), currency }),
      })
      const order = await safeJson(orderRes)
      if (!orderRes.ok) throw new Error(order?.error || `Could not create order (HTTP ${orderRes.status})`)

      // Dev-mock branch: server told us to skip Razorpay entirely.
      if (order?.mock) {
        setMockOrder(order)
        setLoading(false)
        return
      }

      // 2. Load the Razorpay checkout SDK
      await loadRazorpay()
      if (!window.Razorpay) throw new Error('Razorpay SDK not available')

      // 3. Open checkout
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'SwiftX',
        description: 'Wallet top-up',
        order_id: order.order_id,
        prefill: {},
        notes: { method },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (resp: any) => {
          // 4. Verify the payment server-side and credit the wallet
          const vRes = await fetch('/api/deposit/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              amount: Number(amount),
              currency,
              method,
            }),
          })
          const vData = await safeJson(vRes)
          if (!vRes.ok) {
            setError(vData?.error || `Payment verification failed (HTTP ${vRes.status})`)
            setLoading(false)
            return
          }
          setSuccess(vData.razorpay_ref)
          setAmount('')
          setLoading(false)
        },
      })

      rzp.on('payment.failed', (resp: any) => {
        setError(resp?.error?.description || 'Payment failed')
        setLoading(false)
      })

      rzp.open()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {mockOrder && (
        <MockCheckoutModal
          orderId={mockOrder.order_id}
          amount={Number(amount)}
          currency={currency}
          method={method}
          paying={mockPaying}
          onPay={completeMockPayment}
          onClose={() => setMockOrder(null)}
        />
      )}

      <header className="mb-8">
        <p className="sx-h-eyebrow">{t('deposit.eyebrow')}</p>
        <h1 className="sx-h-title mt-2">{t('deposit.title')}</h1>
        <p className="sx-h-sub mt-1">{t('deposit.desc')}</p>
      </header>

      {success ? (
        <SuccessCard reference={success} onAgain={() => setSuccess(null)} />
      ) : (
        <form onSubmit={handleDeposit} className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          {/* Left: amount + payment method */}
          <div className="space-y-6">
            <div className="sx-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>{t('common.amount')}</h3>
                <span className="sx-pill">{currency}</span>
              </div>

              {error && (
                <div className="text-sm font-medium rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
                     style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <input
                    type="number" min="1" step="0.01" placeholder="0.00"
                    value={amount} onChange={e => setAmount(e.target.value)} required
                    className="w-full text-5xl font-extrabold tracking-tight bg-transparent focus:outline-none"
                    style={{ color: 'var(--sx-ink)' }}
                  />
                </div>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="rounded-xl px-4 py-3 font-semibold cursor-pointer border focus:outline-none"
                  style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)', color: 'var(--sx-ink)' }}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_AMOUNTS.map(q => (
                  <button type="button" key={q} onClick={() => setAmount(String(q))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{
                      background: amount === String(q) ? 'var(--sx-primary-soft)' : 'var(--sx-panel-2)',
                      color: amount === String(q) ? 'var(--sx-primary)' : 'var(--sx-ink-2)',
                      border: '1px solid ' + (amount === String(q) ? 'transparent' : 'var(--sx-line)'),
                    }}>
                    + {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="sx-card p-6">
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--sx-ink)' }}>{t('deposit.method')}</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--sx-ink-3)' }}>
                {t('deposit.methodhint')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([['upi', 'UPI', Smartphone], ['qr', 'QR / cards / netbanking', QrCode]] as const).map(([val, label, Icon]) => {
                  const active = method === val
                  return (
                    <button key={val} type="button" onClick={() => setMethod(val)}
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 transition text-left"
                      style={{
                        borderColor: active ? 'var(--sx-primary)' : 'var(--sx-line)',
                        background: active ? 'var(--sx-primary-soft)' : 'var(--sx-panel-2)',
                        color: active ? 'var(--sx-primary)' : 'var(--sx-ink-2)',
                      }}>
                      <div className="w-10 h-10 rounded-xl inline-flex items-center justify-center"
                        style={{ background: active ? 'rgba(99,102,241,0.18)' : 'var(--sx-panel)', color: active ? 'var(--sx-primary)' : 'var(--sx-ink-3)' }}>
                        <Icon size={18} />
                      </div>
                      <span className="font-bold text-sm">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <button type="submit" disabled={loading || !amount}
              className="sx-btn sx-btn-primary w-full py-4 text-base">
              {loading
                ? 'Opening secure checkout…'
                : <>Pay {currency} {amount ? Number(amount).toLocaleString() : '0.00'} <ArrowRight size={16} /></>}
            </button>
          </div>

          {/* Right: secure-checkout summary */}
          <aside className="sx-card p-6 relative overflow-hidden h-fit lg:sticky lg:top-24">
            <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full"
                 style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', opacity: 0.07 }} />

            <div className="flex items-center justify-between mb-5">
              <span className="sx-pill">Secure checkout</span>
              <span className="sx-pill sx-pill-mint"><ShieldCheck size={11} /> PCI-DSS</span>
            </div>

            <ul className="space-y-3 text-sm" style={{ color: 'var(--sx-ink-2)' }}>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
                Payment is processed by Razorpay — your card details never touch SwiftX servers.
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
                The signature of every payment is verified server-side before your wallet is credited.
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#10b981' }} />
                Funds arrive in your SwiftX wallet within seconds of payment success.
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--sx-line)' }}>
              <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>Processor</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-7 h-7 rounded-md inline-flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: '#0258A6' }}>R</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--sx-ink)' }}>Razorpay Checkout · Test mode</span>
              </div>
              <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--sx-ink-3)' }}>
                Use Razorpay's test cards in checkout — e.g. <span className="font-mono">4111 1111 1111 1111</span>, any future expiry, any CVV.
              </p>
            </div>
          </aside>
        </form>
      )}
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
        Payment received
      </h2>
      <p className="text-sm mt-2" style={{ color: 'var(--sx-ink-3)' }}>
        Funds have been added to your SwiftX wallet.
      </p>
      <div className="mt-5 inline-block px-5 py-3 rounded-xl"
           style={{ background: 'var(--sx-primary-soft)' }}>
        <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>Razorpay payment ID</p>
        <p className="font-mono font-bold" style={{ color: 'var(--sx-primary)' }}>{reference}</p>
      </div>
      <button onClick={onAgain} className="sx-btn sx-btn-primary w-full mt-6">
        Make another deposit
      </button>
    </div>
  )
}

function MockCheckoutModal({
  orderId, amount, currency, method, paying, onPay, onClose,
}: {
  orderId: string; amount: number; currency: string; method: string;
  paying: boolean; onPay: () => void; onClose: () => void;
}) {
  const sym = currency === 'USD' ? '$' : '₹'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(8px)' }}>
      <div className="sx-card max-w-md w-full p-7 relative sx-fade-up">
        <button onClick={onClose} disabled={paying}
          className="absolute right-3 top-3 p-2 rounded-lg hover:bg-black/5 disabled:opacity-40"
          style={{ color: 'var(--sx-ink-3)' }} aria-label="Close">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-md inline-flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#0258A6' }}>R</span>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--sx-ink)' }}>Razorpay Checkout</p>
            <span className="sx-pill sx-pill-amber">Dev mock</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>Pay to SwiftX</p>
          <p className="text-5xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--sx-ink)' }}>
            {sym}{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-6 rounded-xl p-3 text-xs space-y-1.5"
             style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--sx-ink-3)' }}>Order ID</span>          <span className="font-mono" style={{ color: 'var(--sx-ink-2)' }}>{orderId.slice(0, 28)}…</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--sx-ink-3)' }}>Method</span>            <span className="font-semibold capitalize" style={{ color: 'var(--sx-ink-2)' }}>{method}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--sx-ink-3)' }}>Currency</span>          <span className="font-semibold" style={{ color: 'var(--sx-ink-2)' }}>{currency}</span></div>
        </div>

        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: 'var(--sx-ink-3)' }}>
          The real Razorpay popup couldn't open from this network (TLS interception by AV / proxy).
          This mock confirms the rest of the flow — server-side verify, wallet credit, ledger entry — so you can demo end-to-end.
        </p>

        <button onClick={onPay} disabled={paying}
          className="sx-btn sx-btn-primary w-full mt-5 py-4 text-base">
          {paying ? 'Confirming…' : <>Simulate successful payment <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}
