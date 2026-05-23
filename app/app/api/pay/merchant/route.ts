import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

/**
 * POST /api/pay/merchant
 *
 * Pay an external merchant from a SwiftX wallet.
 * Supports UPI (India), bank transfer (intl), and card-on-file (placeholder).
 * The wallet is debited and a row is appended to merchant_payments + the
 * tamper-evident ledger.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    method,
    merchant_name,
    merchant_handle,
    routing_code,
    country,
    amount,
    currency,
    note,
  } = body

  if (!method || !merchant_handle || !amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['upi', 'bank', 'card', 'wallet'].includes(method)) {
    return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 })
  }

  // Soft sanity checks on the merchant handle by method
  const handle = String(merchant_handle).trim()
  if (method === 'upi' && !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(handle)) {
    return NextResponse.json({ error: 'Invalid UPI ID (expected name@bank)' }, { status: 400 })
  }
  if (method === 'bank' && handle.length < 6) {
    return NextResponse.json({ error: 'Account number looks too short' }, { status: 400 })
  }

  // Pick wallet by currency
  const table = currency === 'USD' ? 'wallets_usd' : 'wallets_inr'
  const { data: wallet } = await adminClient
    .from(table).select('balance').eq('user_id', user.id).single()

  if (!wallet || Number(wallet.balance) < Number(amount)) {
    return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 })
  }

  // Debit wallet
  await adminClient.from(table).update({
    balance: Number(wallet.balance) - Number(amount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  // Record the payment
  const payment_ref = `MP_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  await adminClient.from('merchant_payments').insert({
    user_id: user.id,
    method,
    merchant_name: merchant_name ?? null,
    merchant_handle: handle,
    routing_code: routing_code ?? null,
    country: country ?? 'IN',
    amount: Number(amount),
    currency: currency ?? 'INR',
    note: note ?? null,
    status: 'completed',
    payment_ref,
  })

  // Tamper-evident ledger entry — mask the merchant handle to last 4
  const handleLast4 = handle.includes('@')
    ? handle  // UPI IDs are public-shareable; keep full
    : handle.slice(-4)

  await logEvent({
    eventType: 'merchant.payment',
    actorId: user.id,
    entity: 'merchant_payments',
    entityId: payment_ref,
    payload: {
      method,
      merchant_name: merchant_name ?? null,
      merchant_handle: handleLast4,
      country: country ?? 'IN',
      amount: Number(amount),
      currency: currency ?? 'INR',
      ref: payment_ref,
    },
    req,
  })

  return NextResponse.json({ success: true, payment_ref })
}
