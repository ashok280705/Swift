import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    currency,
    method,
  } = await req.json()

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 })
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    return NextResponse.json({ error: 'Razorpay is not configured on the server' }, { status: 500 })
  }

  // ── Dev-mock bypass: signed IDs are prefixed with MOCK_, and we only honour
  //    them when RAZORPAY_DEV_MOCK is explicitly enabled on the server.
  const isMock = process.env.RAZORPAY_DEV_MOCK === '1'
    && String(razorpay_order_id).startsWith('order_MOCK_')
    && String(razorpay_payment_id).startsWith('pay_MOCK_')

  if (!isMock) {
    // Verify HMAC SHA256 signature: hmac(order_id|payment_id, key_secret)
    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const expectedBuf = Buffer.from(expected, 'utf8')
    const actualBuf = Buffer.from(String(razorpay_signature), 'utf8')

    const sigOk =
      expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf)

    if (!sigOk) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
    }
  }

  // Credit the wallet
  const table = currency === 'USD' ? 'wallets_usd' : 'wallets_inr'
  const { data: wallet } = await adminClient
    .from(table)
    .select('balance')
    .eq('user_id', user.id)
    .single()

  await adminClient
    .from(table)
    .update({
      balance: Number(wallet?.balance ?? 0) + Number(amount),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  // Record the deposit
  await adminClient.from('deposits').insert({
    user_id: user.id,
    amount: Number(amount),
    currency: currency ?? 'INR',
    method: method ?? 'upi',
    razorpay_ref: razorpay_payment_id,
    status: 'completed',
  })

  await logEvent({
    eventType: 'deposit.completed',
    actorId: user.id,
    entity: 'wallets',
    entityId: razorpay_payment_id,
    payload: {
      amount: Number(amount),
      currency: currency ?? 'INR',
      method: method ?? 'upi',
      razorpay_order_id,
      razorpay_payment_id,
      // razorpay_signature deliberately excluded (sanitized)
    },
    req,
  })

  return NextResponse.json({ success: true, razorpay_ref: razorpay_payment_id })
}
