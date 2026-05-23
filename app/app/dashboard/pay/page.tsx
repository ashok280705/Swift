'use client'
import { useEffect, useRef, useState } from 'react'
import {
  ScanLine, Smartphone, Building2, ArrowRight, CheckCircle2,
  AlertTriangle, X, Camera, RefreshCw, Globe, Store, ShieldCheck,
} from 'lucide-react'
import { useLang } from '@/lib/i18n'

type Tab = 'upi' | 'bank'
type Mode = 'idle' | 'scanning' | 'confirm' | 'success'

// ── Country → rail mapping ────────────────────────────────────────────
type RailField = { key: 'merchant_handle' | 'routing_code'; label: string; placeholder?: string }
type Rail = {
  name: string
  fields: RailField[]
  beneficiary_label: string
  upi_supported: boolean
}

const COUNTRY_RAIL: Record<string, Rail> = {
  IN: { name: 'India · UPI / IMPS',  fields: [{ key: 'merchant_handle', label: 'Account number' }, { key: 'routing_code', label: 'IFSC code' }],     beneficiary_label: 'Beneficiary name', upi_supported: true  },
  US: { name: 'USA · ACH',           fields: [{ key: 'merchant_handle', label: 'Account number' }, { key: 'routing_code', label: 'Routing number' }], beneficiary_label: 'Beneficiary name', upi_supported: false },
  GB: { name: 'UK · Faster Payments',fields: [{ key: 'merchant_handle', label: 'Account number' }, { key: 'routing_code', label: 'Sort code' }],     beneficiary_label: 'Beneficiary name', upi_supported: false },
  EU: { name: 'Eurozone · SEPA',     fields: [{ key: 'merchant_handle', label: 'IBAN' },           { key: 'routing_code', label: 'BIC / SWIFT' }],   beneficiary_label: 'Beneficiary name', upi_supported: false },
  AE: { name: 'UAE · IBAN',          fields: [{ key: 'merchant_handle', label: 'IBAN' },           { key: 'routing_code', label: 'SWIFT' }],         beneficiary_label: 'Beneficiary name', upi_supported: false },
  SG: { name: 'Singapore · PayNow',  fields: [{ key: 'merchant_handle', label: 'PayNow ID / acct' }, { key: 'routing_code', label: 'Bank code' }],   beneficiary_label: 'Beneficiary name', upi_supported: false },
  AU: { name: 'Australia · BSB',     fields: [{ key: 'merchant_handle', label: 'Account number' }, { key: 'routing_code', label: 'BSB' }],           beneficiary_label: 'Beneficiary name', upi_supported: false },
  CA: { name: 'Canada · EFT',        fields: [{ key: 'merchant_handle', label: 'Account number' }, { key: 'routing_code', label: 'Transit number' }], beneficiary_label: 'Beneficiary name', upi_supported: false },
  OTHER: { name: 'International · SWIFT', fields: [{ key: 'merchant_handle', label: 'IBAN / account' }, { key: 'routing_code', label: 'SWIFT / BIC' }], beneficiary_label: 'Beneficiary name', upi_supported: false },
}

const COUNTRY_FLAG: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', GB: '🇬🇧', EU: '🇪🇺', AE: '🇦🇪',
  SG: '🇸🇬', AU: '🇦🇺', CA: '🇨🇦', OTHER: '🌍',
}

declare global {
  interface Window { BarcodeDetector?: any }
}

export default function PayPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('upi')
  const [mode, setMode] = useState<Mode>('idle')
  const [country, setCountry] = useState<string>('IN')

  // Form state
  const [merchant_handle, setHandle] = useState('')
  const [merchant_name, setName] = useState('')
  const [routing_code, setRouting] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [note, setNote] = useState('')

  const [walletBalance, setWalletBalance] = useState({ inr: 0, usd: 0 })
  const [error, setError] = useState('')
  const [scanError, setScanError] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Refs for camera
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorIntervalRef = useRef<any>(null)

  // Load wallet balances + user country
  useEffect(() => {
    Promise.all([
      fetch('/api/wallet/inr').then(r => r.json()).catch(() => ({ balance: 0 })),
      fetch('/api/wallet/usd').then(r => r.json()).catch(() => ({ balance: 0 })),
    ]).then(([inr, usd]) => setWalletBalance({ inr: Number(inr?.balance ?? 0), usd: Number(usd?.balance ?? 0) }))
  }, [])

  // Camera lifecycle
  useEffect(() => {
    if (mode !== 'scanning') return
    let cancelled = false

    async function start() {
      setScanError('')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }

        if (!('BarcodeDetector' in window)) {
          setScanError(
            "Your browser doesn't support QR scanning. Enter the UPI ID manually below.",
          )
          return
        }

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        detectorIntervalRef.current = setInterval(async () => {
          if (!videoRef.current) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes && barcodes.length > 0) {
              handleScan(barcodes[0].rawValue)
            }
          } catch { /* ignore frame errors */ }
        }, 400)
      } catch (err: any) {
        setScanError(
          err?.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow access in browser settings and try again.'
            : 'Could not start the camera. Enter the UPI ID manually below.',
        )
      }
    }
    start()

    return () => {
      cancelled = true
      if (detectorIntervalRef.current) clearInterval(detectorIntervalRef.current)
      detectorIntervalRef.current = null
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function handleScan(raw: string) {
    // Parse a UPI deep-link: upi://pay?pa=...&pn=...&am=...&cu=...
    try {
      if (raw.startsWith('upi://') || raw.startsWith('UPI://')) {
        const q = raw.split('?')[1] ?? ''
        const params = new URLSearchParams(q)
        const pa = params.get('pa')
        if (!pa) throw new Error('UPI QR is missing the merchant ID')
        setHandle(pa)
        const pn = params.get('pn'); if (pn) setName(decodeURIComponent(pn))
        const am = params.get('am'); if (am) setAmount(am)
        const cu = params.get('cu'); if (cu === 'USD') setCurrency('USD')
        setMode('confirm')
        return
      }
      // Fallback: bare VPA (something@bank)
      if (/^[\w.\-]+@[\w.\-]+$/.test(raw)) {
        setHandle(raw)
        setMode('confirm')
        return
      }
      setScanError(`That QR doesn't look like a UPI code: "${raw.slice(0, 40)}…"`)
    } catch (e: any) {
      setScanError(e?.message ?? 'Could not parse QR')
    }
  }

  async function submitPayment() {
    setError('')
    setPaying(true)
    try {
      const res = await fetch('/api/pay/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: tab === 'upi' ? 'upi' : 'bank',
          merchant_name: merchant_name || null,
          merchant_handle,
          routing_code: tab === 'bank' ? routing_code : null,
          country: tab === 'upi' ? 'IN' : country,
          amount: Number(amount),
          currency,
          note: note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed')
      setSuccess(data.payment_ref)
      setMode('success')
    } catch (e: any) {
      setError(e.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  function resetAll() {
    setHandle(''); setName(''); setRouting(''); setAmount(''); setNote('')
    setError(''); setScanError(''); setSuccess(null); setMode('idle')
  }

  // ── render ──────────────────────────────────────────────────────────
  if (mode === 'success' && success) return <SuccessCard reference={success} amount={amount} currency={currency} onAgain={resetAll} />
  if (mode === 'scanning') return (
    <ScanOverlay
      onClose={() => setMode('idle')}
      videoRef={videoRef}
      scanError={scanError}
    />
  )
  if (mode === 'confirm') return (
    <ConfirmCard
      tab={tab}
      handle={merchant_handle}
      name={merchant_name}
      routing={routing_code}
      country={country}
      amount={amount}
      currency={currency}
      note={note}
      onAmountChange={setAmount}
      onNoteChange={setNote}
      onBack={() => setMode('idle')}
      onPay={submitPayment}
      paying={paying}
      error={error}
      balance={currency === 'USD' ? walletBalance.usd : walletBalance.inr}
    />
  )

  const rail = COUNTRY_RAIL[country] ?? COUNTRY_RAIL.OTHER
  const balance = currency === 'USD' ? walletBalance.usd : walletBalance.inr

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="sx-h-eyebrow"><Store size={12} className="inline -mt-0.5 mr-1" /> {t('pay.eyebrow')}</p>
        <h1 className="sx-h-title mt-2">{t('pay.title')}</h1>
        <p className="sx-h-sub mt-1">{t('pay.desc')}</p>
      </header>

      {/* Wallet strip */}
      <div className="sx-card p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center"
                style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
            <ShieldCheck size={16} />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>{t('pay.payingfrom')}</p>
            <p className="text-sm font-bold" style={{ color: 'var(--sx-ink)' }}>
              SwiftX {currency} wallet · <span style={{ color: 'var(--sx-primary)' }}>
                {currency === 'USD' ? '$' : '₹'}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl border" style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel-2)' }}>
          {(['INR','USD'] as const).map(c => {
            const active = currency === c
            return (
              <button key={c} onClick={() => setCurrency(c)} className="text-xs font-bold px-3 py-1.5 rounded-lg transition"
                style={{ background: active ? 'var(--sx-panel)' : 'transparent', color: active ? 'var(--sx-primary)' : 'var(--sx-ink-3)' }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-2xl gap-1 mb-6"
           style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
        {([
          ['upi',  t('pay.upitab'),  Smartphone],
          ['bank', t('pay.banktab'), Building2],
        ] as const).map(([val, label, Icon]) => {
          const active = tab === val
          return (
            <button key={val} onClick={() => setTab(val)}
              className="flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition"
              style={{
                background: active ? 'var(--sx-panel)' : 'transparent',
                color: active ? 'var(--sx-primary)' : 'var(--sx-ink-3)',
                boxShadow: active ? 'var(--sx-shadow-1)' : 'none',
              }}>
              <Icon size={15} />{label}
            </button>
          )
        })}
      </div>

      {tab === 'upi' ? (
        <UpiPanel
          handle={merchant_handle}
          setHandle={setHandle}
          name={merchant_name}
          setName={setName}
          amount={amount}
          setAmount={setAmount}
          note={note}
          setNote={setNote}
          currency={currency}
          onScan={() => setMode('scanning')}
          onPay={() => setMode('confirm')}
        />
      ) : (
        <BankPanel
          country={country}
          setCountry={setCountry}
          rail={rail}
          handle={merchant_handle}
          setHandle={setHandle}
          routing={routing_code}
          setRouting={setRouting}
          name={merchant_name}
          setName={setName}
          amount={amount}
          setAmount={setAmount}
          note={note}
          setNote={setNote}
          currency={currency}
          onPay={() => setMode('confirm')}
        />
      )}
    </div>
  )
}

// ── UPI panel ──────────────────────────────────────────────────────────
function UpiPanel(props: any) {
  const { handle, setHandle, name, setName, amount, setAmount, note, setNote, currency, onScan, onPay } = props
  const canContinue = handle.trim().length > 3 && Number(amount) > 0

  return (
    <div className="space-y-5">
      {/* Hero "Scan & Pay" */}
      <button onClick={onScan} type="button"
        className="w-full relative overflow-hidden rounded-3xl p-7 text-left text-white group"
        style={{
          background:
            'radial-gradient(800px 400px at 0% 0%, rgba(99,102,241,0.55) 0%, transparent 60%),' +
            'radial-gradient(700px 400px at 100% 100%, rgba(6,182,212,0.50) 0%, transparent 60%),' +
            'linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)',
        }}>
        <div className="flex items-center gap-5">
          <span className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md inline-flex items-center justify-center group-hover:scale-105 transition">
            <ScanLine size={30} />
          </span>
          <div>
            <p className="sx-h-eyebrow" style={{ color: 'rgba(255,255,255,0.78)' }}>UPI India</p>
            <h3 className="text-2xl font-extrabold tracking-tight">Scan & Pay</h3>
            <p className="text-sm text-white/80 mt-1">Tap to point your camera at any UPI QR.</p>
          </div>
          <ArrowRight size={22} className="ml-auto opacity-80 group-hover:translate-x-1 transition" />
        </div>
        <div className="absolute -bottom-6 -right-6 opacity-15">
          <ScanLine size={140} />
        </div>
      </button>

      {/* OR divider */}
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px" style={{ background: 'var(--sx-line)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--sx-ink-3)' }}>or enter manually</span>
        <span className="flex-1 h-px" style={{ background: 'var(--sx-line)' }} />
      </div>

      <div className="sx-card p-6 space-y-4">
        <div className="sx-field">
          <input id="pay-vpa" placeholder=" " value={handle} onChange={e => setHandle(e.target.value)} />
          <label htmlFor="pay-vpa">UPI ID (e.g. merchant@okhdfc)</label>
        </div>
        <div className="sx-field">
          <input id="pay-name" placeholder=" " value={name} onChange={e => setName(e.target.value)} />
          <label htmlFor="pay-name">Merchant / payee name (optional)</label>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <div className="sx-field">
            <input id="pay-amt" type="number" min="1" step="0.01" placeholder=" "
                   value={amount} onChange={e => setAmount(e.target.value)} />
            <label htmlFor="pay-amt">Amount ({currency})</label>
          </div>
        </div>
        <div className="sx-field">
          <input id="pay-note" placeholder=" " value={note} onChange={e => setNote(e.target.value)} />
          <label htmlFor="pay-note">Note (optional)</label>
        </div>

        <button onClick={onPay} disabled={!canContinue}
          className="sx-btn sx-btn-primary w-full py-3.5 text-base">
          Continue <ArrowRight size={16} />
        </button>

        <p className="text-[11px] text-center" style={{ color: 'var(--sx-ink-3)' }}>
          Test mode — any VPA format like <span className="font-mono">test@upi</span> works.
        </p>
      </div>
    </div>
  )
}

// ── Bank panel (intl) ─────────────────────────────────────────────────
function BankPanel(props: any) {
  const {
    country, setCountry, rail,
    handle, setHandle, routing, setRouting,
    name, setName, amount, setAmount, note, setNote,
    currency, onPay,
  } = props

  const canContinue = handle.trim().length > 3 && routing.trim().length >= 2 && Number(amount) > 0

  return (
    <div className="sx-card p-6 space-y-5">
      {/* Country picker */}
      <div className="rounded-2xl p-4 flex items-center gap-3 flex-wrap"
           style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
        <Globe size={16} style={{ color: 'var(--sx-ink-3)' }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sx-ink-3)' }}>Destination country</span>
        <select value={country} onChange={e => setCountry(e.target.value)}
          className="bg-transparent text-sm font-bold focus:outline-none ml-auto"
          style={{ color: 'var(--sx-ink)' }}>
          {Object.keys(COUNTRY_RAIL).map(c => (
            <option key={c} value={c}>{COUNTRY_FLAG[c]} {COUNTRY_RAIL[c].name}</option>
          ))}
        </select>
      </div>

      <div className="sx-field">
        <input id="pay-bank-acc" placeholder=" " value={handle} onChange={(e: any) => setHandle(e.target.value)} />
        <label htmlFor="pay-bank-acc">{rail.fields[0].label}</label>
      </div>
      <div className="sx-field">
        <input id="pay-bank-rt" placeholder=" " value={routing} onChange={(e: any) => setRouting(e.target.value.toUpperCase())} />
        <label htmlFor="pay-bank-rt">{rail.fields[1].label}</label>
      </div>
      <div className="sx-field">
        <input id="pay-bank-name" placeholder=" " value={name} onChange={(e: any) => setName(e.target.value)} />
        <label htmlFor="pay-bank-name">{rail.beneficiary_label}</label>
      </div>
      <div className="sx-field">
        <input id="pay-bank-amt" type="number" min="1" step="0.01" placeholder=" "
               value={amount} onChange={(e: any) => setAmount(e.target.value)} />
        <label htmlFor="pay-bank-amt">Amount ({currency})</label>
      </div>
      <div className="sx-field">
        <input id="pay-bank-note" placeholder=" " value={note} onChange={(e: any) => setNote(e.target.value)} />
        <label htmlFor="pay-bank-note">Note (optional)</label>
      </div>

      <button onClick={onPay} disabled={!canContinue}
        className="sx-btn sx-btn-primary w-full py-3.5 text-base">
        Continue <ArrowRight size={16} />
      </button>

      <p className="text-[11px] text-center" style={{ color: 'var(--sx-ink-3)' }}>
        Test mode — any account / routing format is accepted.
      </p>
    </div>
  )
}

// ── Camera overlay ─────────────────────────────────────────────────────
function ScanOverlay({
  onClose, videoRef, scanError,
}: { onClose: () => void; videoRef: React.RefObject<HTMLVideoElement | null>; scanError: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-bold opacity-75">UPI scan</p>
          <h3 className="font-bold text-base">Point at the merchant's QR</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {/* Frame guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-72 max-w-[70vw] max-h-[70vw]">
            <span className="absolute top-0 left-0 w-10 h-10 border-l-4 border-t-4 rounded-tl-2xl" style={{ borderColor: '#fff' }} />
            <span className="absolute top-0 right-0 w-10 h-10 border-r-4 border-t-4 rounded-tr-2xl" style={{ borderColor: '#fff' }} />
            <span className="absolute bottom-0 left-0 w-10 h-10 border-l-4 border-b-4 rounded-bl-2xl" style={{ borderColor: '#fff' }} />
            <span className="absolute bottom-0 right-0 w-10 h-10 border-r-4 border-b-4 rounded-br-2xl" style={{ borderColor: '#fff' }} />
            <span className="absolute inset-x-0 top-1/2 h-px" style={{ background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4 text-white text-center">
        {scanError ? (
          <p className="text-sm bg-red-600/20 border border-red-500/40 rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <AlertTriangle size={14} />{scanError}
          </p>
        ) : (
          <p className="text-xs opacity-75 flex items-center justify-center gap-2">
            <Camera size={12} /> Hold steady — auto-detects in a second.
          </p>
        )}
        <button onClick={onClose} className="mt-3 text-xs font-semibold opacity-80 hover:opacity-100 underline">
          Cancel & enter manually
        </button>
      </div>
    </div>
  )
}

// ── Confirm card ───────────────────────────────────────────────────────
function ConfirmCard(props: any) {
  const { tab, handle, name, routing, country, amount, currency, note, onAmountChange, onNoteChange, onBack, onPay, paying, error, balance } = props
  const sym = currency === 'USD' ? '$' : '₹'
  const railName = COUNTRY_RAIL[country]?.name ?? ''

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="text-xs font-semibold mb-4 hover:underline" style={{ color: 'var(--sx-primary)' }}>
        ← Back
      </button>

      <div className="sx-card p-7 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full"
             style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', opacity: 0.10 }} />

        <span className="sx-pill sx-pill-violet">
          {tab === 'upi' ? '🇮🇳 UPI payment' : `${railName}`}
        </span>

        {/* Merchant card */}
        <div className="mt-4 rounded-2xl p-4"
             style={{ background: 'var(--sx-panel-2)', border: '1px solid var(--sx-line)' }}>
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl inline-flex items-center justify-center text-white font-extrabold text-base"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}>
              {(name || handle).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: 'var(--sx-ink)' }}>{name || 'Merchant'}</p>
              <p className="text-xs font-mono truncate" style={{ color: 'var(--sx-ink-3)' }}>
                {handle}{routing ? ` · ${routing}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-6 text-center">
          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>You'll pay</span>
          <div className="flex items-baseline justify-center gap-1 mt-1">
            <span className="text-3xl font-extrabold" style={{ color: 'var(--sx-ink-3)' }}>{sym}</span>
            <input
              type="number" min="1" step="0.01" value={amount} onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0.00"
              className="text-5xl font-extrabold tracking-tight bg-transparent focus:outline-none text-center w-3/4"
              style={{ color: 'var(--sx-ink)' }}
            />
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--sx-ink-3)' }}>
            Available · {sym}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-6 sx-field">
          <input id="confirm-note" placeholder=" " value={note} onChange={(e) => onNoteChange(e.target.value)} />
          <label htmlFor="confirm-note">Note (optional)</label>
        </div>

        {error && (
          <div className="mt-4 text-sm font-medium rounded-xl px-4 py-3 flex items-center gap-2"
               style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        <button onClick={onPay} disabled={paying || !amount || Number(amount) <= 0}
          className="sx-btn sx-btn-primary w-full mt-5 py-4 text-base">
          {paying
            ? <><RefreshCw size={16} className="animate-spin" /> Paying…</>
            : <>Pay {sym}{amount ? Number(amount).toLocaleString() : '0.00'} <ArrowRight size={16} /></>}
        </button>

        <p className="text-[11px] mt-3 text-center flex items-center justify-center gap-1.5" style={{ color: 'var(--sx-ink-3)' }}>
          <ShieldCheck size={11} /> Hash-chained to your tamper-evident ledger.
        </p>
      </div>
    </div>
  )
}

// ── Success card ───────────────────────────────────────────────────────
function SuccessCard({ reference, amount, currency, onAgain }: { reference: string; amount: string; currency: string; onAgain: () => void }) {
  const sym = currency === 'USD' ? '$' : '₹'
  return (
    <div className="sx-card max-w-md mx-auto p-10 text-center sx-fade-up">
      <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
           style={{ background: 'rgba(16,185,129,0.12)', color: '#047857' }}>
        <CheckCircle2 size={32} />
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
        Payment sent
      </h2>
      <p className="text-sm mt-2" style={{ color: 'var(--sx-ink-3)' }}>
        {sym}{Number(amount || 0).toLocaleString()} debited from your SwiftX wallet.
      </p>
      <div className="mt-5 inline-block px-5 py-3 rounded-xl"
           style={{ background: 'var(--sx-primary-soft)' }}>
        <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--sx-ink-3)' }}>Payment ref</p>
        <p className="font-mono font-bold" style={{ color: 'var(--sx-primary)' }}>{reference}</p>
      </div>
      <button onClick={onAgain} className="sx-btn sx-btn-primary w-full mt-6">
        Make another payment
      </button>
    </div>
  )
}
