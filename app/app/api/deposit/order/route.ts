import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, currency } = await req.json()
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay is not configured on the server' }, { status: 500 })
  }

  // Razorpay accepts amount in the smallest currency unit (paise for INR, cents for USD)
  const amountInSmallestUnit = Math.round(Number(amount) * 100)

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountInSmallestUnit,
      currency: currency ?? 'INR',
      receipt: `sx_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, source: 'swiftx-deposit' },
    }),
  })

  const data = await rzpRes.json()
  if (!rzpRes.ok) {
    return NextResponse.json(
      { error: data?.error?.description ?? 'Failed to create Razorpay order' },
      { status: 400 },
    )
  }

  return NextResponse.json({
    order_id: data.id,
    amount: data.amount,
    currency: data.currency,
    key_id: keyId,
  })
}
