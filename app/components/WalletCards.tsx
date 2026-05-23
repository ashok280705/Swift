'use client'
import { useState, useEffect } from 'react'
import { PiggyBank, RefreshCw, Globe, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/lib/i18n'

const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string; flag: string; name: string }> = {
  US: { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'United States' },
  GB: { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'United Kingdom' },
  EU: { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Europe' },
  AE: { code: 'AED', symbol: 'د.إ', flag: '🇦🇪', name: 'UAE' },
  JP: { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japan' },
  CA: { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canada' },
  AU: { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australia' },
  CH: { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Switzerland' },
  CN: { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'China' },
  SG: { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore' },
  SA: { code: 'SAR', symbol: '﷼', flag: '🇸🇦', name: 'Saudi Arabia' },
  QA: { code: 'QAR', symbol: '﷼', flag: '🇶🇦', name: 'Qatar' },
  KW: { code: 'KWD', symbol: 'KD', flag: '🇰🇼', name: 'Kuwait' },
  MY: { code: 'MYR', symbol: 'RM', flag: '🇲🇾', name: 'Malaysia' },
  TH: { code: 'THB', symbol: '฿', flag: '🇹🇭', name: 'Thailand' },
  PH: { code: 'PHP', symbol: '₱', flag: '🇵🇭', name: 'Philippines' },
  PK: { code: 'PKR', symbol: '₨', flag: '🇵🇰', name: 'Pakistan' },
  BD: { code: 'BDT', symbol: '৳', flag: '🇧🇩', name: 'Bangladesh' },
  NP: { code: 'NPR', symbol: '₨', flag: '🇳🇵', name: 'Nepal' },
  ZA: { code: 'ZAR', symbol: 'R', flag: '🇿🇦', name: 'South Africa' },
  NG: { code: 'NGN', symbol: '₦', flag: '🇳🇬', name: 'Nigeria' },
  KE: { code: 'KES', symbol: 'KSh', flag: '🇰🇪', name: 'Kenya' },
  BR: { code: 'BRL', symbol: 'R$', flag: '🇧🇷', name: 'Brazil' },
  MX: { code: 'MXN', symbol: '$', flag: '🇲🇽', name: 'Mexico' },
  KR: { code: 'KRW', symbol: '₩', flag: '🇰🇷', name: 'South Korea' },
  NZ: { code: 'NZD', symbol: 'NZ$', flag: '🇳🇿', name: 'New Zealand' },
  SE: { code: 'SEK', symbol: 'kr', flag: '🇸🇪', name: 'Sweden' },
  NO: { code: 'NOK', symbol: 'kr', flag: '🇳🇴', name: 'Norway' },
  PL: { code: 'PLN', symbol: 'zł', flag: '🇵🇱', name: 'Poland' },
  IL: { code: 'ILS', symbol: '₪', flag: '🇮🇱', name: 'Israel' },
}

interface Props { inrBalance: number; usdBalance: number; savingsBalance: number }

export default function WalletCards({ inrBalance, usdBalance, savingsBalance }: Props) {
  const { t } = useLang()
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const country = COUNTRY_CURRENCY[selectedCountry]

  useEffect(() => {
    setLoading(true)
    fetch(`/api/forex?base=INR&target=${country.code}`)
      .then(r => r.json())
      .then(d => { setRate(d.rate ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedCountry, country.code])

  const wallets = [
    { key: 'inr', title: t('wallets.inr'),     flag: '🇮🇳', symbol: '₹', amount: inrBalance,     base: 'INR', tone: 'indigo', accent: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)' },
    { key: 'usd', title: t('wallets.usd'),     flag: '🇺🇸', symbol: '$', amount: usdBalance,     base: 'USD', tone: 'cyan',   accent: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)' },
    { key: 'sav', title: t('wallets.savings'), flag: '💎', symbol: '₹', amount: savingsBalance, base: 'INR', tone: 'violet', accent: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' },
  ]

  return (
    <div className="space-y-5">
      {/* Currency selector strip */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="sx-h-eyebrow">{t('wallets.eyebrow')}</span>
          <span className="sx-pill sx-pill-mint">
            <span className="sx-pulse-dot" style={{ width: 6, height: 6 }} /> {t('common.live')}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
             style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)' }}>
          <Globe size={14} style={{ color: 'var(--sx-ink-3)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--sx-ink-3)' }}>{t('wallets.showin')}</span>
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            className="bg-transparent text-sm font-semibold focus:outline-none"
            style={{ color: 'var(--sx-ink)' }}>
            {Object.entries(COUNTRY_CURRENCY).map(([code, c]) => (
              <option key={code} value={code}>{c.flag} {c.code}</option>
            ))}
          </select>
          {loading && <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--sx-ink-3)' }} />}
        </div>
      </div>

      {/* Asymmetric wallet grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {wallets.map((w, i) => {
          const { key, ...rest } = w
          return <WalletTile key={key} {...rest} country={country} rate={rate} elevated={i === 0} />
        })}
      </div>
    </div>
  )
}

function WalletTile({
  title, flag, symbol, amount, base, accent, country, rate, elevated,
}: any) {
  const [crossRate, setCrossRate] = useState<number | null>(null)

  useEffect(() => {
    if (base === country.code) { setCrossRate(null); return }
    if (base === 'INR') { setCrossRate(rate); return }
    fetch(`/api/forex?base=${base}&target=${country.code}`)
      .then(r => r.json())
      .then(d => setCrossRate(d.rate ?? null))
      .catch(() => setCrossRate(null))
  }, [base, country.code, rate])

  const converted = crossRate != null ? amount * crossRate : null

  return (
    <div className={`sx-card relative overflow-hidden p-6 ${elevated ? 'md:row-span-1' : ''}`}>
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-[0.07]"
           style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="sx-h-eyebrow" style={{ color: 'var(--sx-ink-3)' }}>{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl">{flag}</span>
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
              {symbol}{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {converted != null && country.code !== base && (
            <p className="text-xs font-medium mt-2" style={{ color: 'var(--sx-ink-3)' }}>
              ≈ {country.symbol}{converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} {country.code}
            </p>
          )}
        </div>
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-white"
              style={{ background: accent }}>
          {title.includes('Savings') ? <PiggyBank size={16} /> : <ArrowUpRight size={16} />}
        </span>
      </div>

      {/* Mini "trend" bars (decorative) */}
      <div className="mt-5 flex items-end gap-1 h-10">
        {[35, 55, 42, 70, 60, 80, 65, 90, 72, 95].map((h, i) => (
          <span key={i} className="flex-1 rounded-sm" style={{
            background: accent, opacity: 0.18 + (i / 24),
            height: `${h}%`,
          }} />
        ))}
      </div>
    </div>
  )
}
