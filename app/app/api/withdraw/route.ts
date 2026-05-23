import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, currency, bank_account, ifsc } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!bank_account || !ifsc) return NextResponse.json({ error: 'Bank details required' }, { status: 400 })

  const table = currency === 'USD' ? 'wallets_usd' : 'wallets_inr'
  const { data: wallet } = await adminClient.from(table).select('balance').eq('user_id', user.id).single()

  if (!wallet || Number(wallet.balance) < Number(amount)) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  await adminClient.from(table).update({
    balance: Number(wallet.balance) - Number(amount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  const ref = `WD_${Date.now()}`

  await logEvent({
    eventType: 'withdraw.requested',
    actorId: user.id,
    entity: table,
    entityId: ref,
    payload: {
      amount: Number(amount),
      currency: currency ?? 'INR',
      bank_account_last4: String(bank_account).slice(-4),
      ifsc,
      ref,
    },
    req,
  })

  return NextResponse.json({ success: true, ref })
}
