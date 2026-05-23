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

  // ── Dev-only mock: skip the real Razorpay call for environments where
  //    outbound HTTPS is being intercepted by AV / VPN / corporate proxy.
  //    Triggered by RAZORPAY_DEV_MOCK=1 in .env.local.
  if (process.env.RAZORPAY_DEV_MOCK === '1') {
    return NextResponse.json({
      mock: true,
      order_id: `order_MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      amount: amountInSmallestUnit,
      currency: currency ?? 'INR',
      key_id: keyId,
    })
  }

  try {
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

    // Read as text first so we can return a useful message even if Razorpay
    // sends back an HTML error page (rare, but possible behind proxies).
    const bodyText = await rzpRes.text()
    let data: any = null
    try { data = bodyText ? JSON.parse(bodyText) : null } catch { /* not JSON */ }

    if (!rzpRes.ok) {
      const message =
        data?.error?.description ||
        data?.error?.reason ||
        bodyText.slice(0, 200) ||
        'Razorpay returned an unknown error'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: keyId,
    })
  } catch (err: any) {
    // Network / TLS / DNS / proxy failures land here. Surface a clean JSON
    // error so the browser doesn't see "Unexpected end of JSON input".
    const code = err?.cause?.code ?? err?.code ?? 'NETWORK_ERROR'
    const hint =
      code === 'SELF_SIGNED_CERT_IN_CHAIN'
        ? 'Your machine is intercepting TLS (antivirus / VPN / corporate proxy). For local dev, add NODE_TLS_REJECT_UNAUTHORIZED=0 to .env.local and restart the dev server.'
        : code === 'ENOTFOUND' || code === 'UND_ERR_CONNECT_TIMEOUT'
          ? 'Could not reach api.razorpay.com. Check your internet / DNS / firewall.'
          : 'Razorpay request failed. See server logs for details.'
    return NextResponse.json(
      { error: hint, code, detail: err?.message ?? String(err) },
      { status: 502 },
    )
  }
}
