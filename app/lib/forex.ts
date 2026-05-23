import axios from 'axios'
import { adminClient } from '@/lib/supabase/admin'

const CACHE_TTL_MS = 5 * 60 * 1000

// Razorpay charges a flat 2% on every payout we route through them.
export const RAZORPAY_FEE_RATE = 0.02

// Bank-processing rate is set per-account at signup (0.0025–0.0052).
// Fallback used only when an account doesn't yet have one assigned.
export const DEFAULT_BANK_FEE_RATE = 0.0035

export const CURRENCIES: Record<string, string> = {
  INR: '🇮🇳 Indian Rupee',
  USD: '🇺🇸 US Dollar',
  AED: '🇦🇪 UAE Dirham',
  EUR: '🇪🇺 Euro',
  GBP: '🇬🇧 British Pound',
  JPY: '🇯🇵 Japanese Yen',
  CAD: '🇨🇦 Canadian Dollar',
  AUD: '🇦🇺 Australian Dollar',
  CHF: '🇨🇭 Swiss Franc',
  CNY: '🇨🇳 Chinese Yuan',
  HKD: '🇭🇰 Hong Kong Dollar',
  SGD: '🇸🇬 Singapore Dollar',
  SEK: '🇸🇪 Swedish Krona',
  NOK: '🇳🇴 Norwegian Krone',
  DKK: '🇩🇰 Danish Krone',
  NZD: '🇳🇿 New Zealand Dollar',
  MXN: '🇲🇽 Mexican Peso',
  BRL: '🇧🇷 Brazilian Real',
  ZAR: '🇿🇦 South African Rand',
  RUB: '🇷🇺 Russian Ruble',
  TRY: '🇹🇷 Turkish Lira',
  KRW: '🇰🇷 South Korean Won',
  IDR: '🇮🇩 Indonesian Rupiah',
  MYR: '🇲🇾 Malaysian Ringgit',
  THB: '🇹🇭 Thai Baht',
  PHP: '🇵🇭 Philippine Peso',
  PKR: '🇵🇰 Pakistani Rupee',
  BDT: '🇧🇩 Bangladeshi Taka',
  LKR: '🇱🇰 Sri Lankan Rupee',
  NPR: '🇳🇵 Nepalese Rupee',
  EGP: '🇪🇬 Egyptian Pound',
  NGN: '🇳🇬 Nigerian Naira',
  KES: '🇰🇪 Kenyan Shilling',
  GHS: '🇬🇭 Ghanaian Cedi',
  TZS: '🇹🇿 Tanzanian Shilling',
  SAR: '🇸🇦 Saudi Riyal',
  QAR: '🇶🇦 Qatari Riyal',
  KWD: '🇰🇼 Kuwaiti Dinar',
  BHD: '🇧🇭 Bahraini Dinar',
  OMR: '🇴🇲 Omani Rial',
  JOD: '🇯🇴 Jordanian Dinar',
  ILS: '🇮🇱 Israeli Shekel',
  PLN: '🇵🇱 Polish Zloty',
  CZK: '🇨🇿 Czech Koruna',
  HUF: '🇭🇺 Hungarian Forint',
  RON: '🇷🇴 Romanian Leu',
  BGN: '🇧🇬 Bulgarian Lev',
  HRK: '🇭🇷 Croatian Kuna',
  UAH: '🇺🇦 Ukrainian Hryvnia',
  VND: '🇻🇳 Vietnamese Dong',
  TWD: '🇹🇼 Taiwan Dollar',
  CLP: '🇨🇱 Chilean Peso',
  COP: '🇨🇴 Colombian Peso',
  PEN: '🇵🇪 Peruvian Sol',
  ARS: '🇦🇷 Argentine Peso',
}

const memCache = new Map<string, { rate: number; ts: number }>()

export async function getLiveRate(base: string, target: string): Promise<number> {
  if (base === target) return 1
  const key = `${base}_${target}`
  const cached = memCache.get(key)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.rate

  const { data: dbRate } = await adminClient
    .from('exchange_rates')
    .select('rate, fetched_at')
    .eq('base_currency', base)
    .eq('target_currency', target)
    .single()

  if (dbRate && Date.now() - new Date(dbRate.fetched_at).getTime() < CACHE_TTL_MS) {
    const r = Number(dbRate.rate)
    memCache.set(key, { rate: r, ts: Date.now() })
    return r
  }

  const rate = await fetchFromApi(base, target)
  memCache.set(key, { rate, ts: Date.now() })
  await adminClient.from('exchange_rates').upsert(
    { base_currency: base, target_currency: target, rate, fetched_at: new Date().toISOString() },
    { onConflict: 'base_currency,target_currency' }
  )
  return rate
}

async function fetchFromApi(base: string, target: string): Promise<number> {
  try {
    const res = await axios.get(`https://open.er-api.com/v6/latest/${base}`, { timeout: 5000 })
    const rate = res.data?.rates?.[target]
    if (rate) return Number(rate)
  } catch { /* fallback */ }

  // Hardcoded fallback rates (USD base)
  const usdRates: Record<string, number> = {
    INR: 85.80, AED: 3.6725, EUR: 0.9210, GBP: 0.7890, JPY: 149.50,
    CAD: 1.3650, AUD: 1.5420, CHF: 0.8980, CNY: 7.2400, HKD: 7.8200,
    SGD: 1.3450, SEK: 10.420, NOK: 10.650, DKK: 6.8900, NZD: 1.6350,
    MXN: 17.150, BRL: 4.9700, ZAR: 18.650, RUB: 91.500, TRY: 32.100,
    KRW: 1325.0, IDR: 15750., MYR: 4.7200, THB: 35.200, PHP: 56.500,
    PKR: 278.50, BDT: 110.00, LKR: 305.00, NPR: 133.50, EGP: 30.900,
    NGN: 1450.0, KES: 129.50, GHS: 12.500, TZS: 2520.0, SAR: 3.7500,
    QAR: 3.6400, KWD: 0.3080, BHD: 0.3770, OMR: 0.3850, JOD: 0.7090,
    ILS: 3.7200, PLN: 4.0200, CZK: 22.800, HUF: 357.00, RON: 4.5800,
    BGN: 1.8000, HRK: 6.9800, UAH: 38.500, VND: 24350., TWD: 31.800,
    CLP: 920.00, COP: 3950.0, PEN: 3.7800, ARS: 870.00, USD: 1,
  }
  if (base === 'USD') return usdRates[target] ?? 1
  if (target === 'USD') return 1 / (usdRates[base] ?? 1)
  return (usdRates[target] ?? 1) / (usdRates[base] ?? 1)
}

function round2(n: number) { return Math.round(n * 100) / 100 }

export async function getConversionQuote(
  base: string,
  target: string,
  amount: number,
  bankFeeRate: number = DEFAULT_BANK_FEE_RATE,
) {
  const rate = await getLiveRate(base, target)

  const razorpay_fee = round2(amount * RAZORPAY_FEE_RATE)
  const bank_fee     = round2(amount * bankFeeRate)
  const fee          = round2(razorpay_fee + bank_fee)         // combined fee

  // Recipient receives the full amount converted at live rate.
  // The fees are paid by the sender on top of the send amount.
  const converted = Math.round(amount * rate * 1000000) / 1000000

  return {
    rate,
    fee,
    razorpay_fee,
    bank_fee,
    bank_fee_rate: bankFeeRate,
    converted,
    base,
    target,
    amount,
  }
}

export function getCurrencyList() {
  return Object.entries(CURRENCIES).map(([code, name]) => ({ code, name }))
}
