import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await adminClient.from('savings').select('balance').eq('user_id', user.id).single()
  return NextResponse.json({ balance: data?.balance ?? 0 })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, action } = await req.json() // action: 'deposit' | 'withdraw'
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const [{ data: savings }, { data: inrWallet }] = await Promise.all([
    adminClient.from('savings').select('balance').eq('user_id', user.id).single(),
    adminClient.from('wallets_inr').select('balance').eq('user_id', user.id).single(),
  ])

  const savBal = Number(savings?.balance ?? 0)
  const inrBal = Number(inrWallet?.balance ?? 0)
  const amt = Number(amount)

  if (action === 'deposit') {
    if (inrBal < amt) return NextResponse.json({ error: 'Insufficient INR balance' }, { status: 400 })
    await Promise.all([
      adminClient.from('wallets_inr').update({ balance: inrBal - amt, updated_at: new Date().toISOString() }).eq('user_id', user.id),
      adminClient.from('savings').update({ balance: savBal + amt, updated_at: new Date().toISOString() }).eq('user_id', user.id),
    ])
  } else {
    if (savBal < amt) return NextResponse.json({ error: 'Insufficient savings balance' }, { status: 400 })
    await Promise.all([
      adminClient.from('savings').update({ balance: savBal - amt, updated_at: new Date().toISOString() }).eq('user_id', user.id),
      adminClient.from('wallets_inr').update({ balance: inrBal + amt, updated_at: new Date().toISOString() }).eq('user_id', user.id),
    ])
  }

  await logEvent({
    eventType: action === 'deposit' ? 'savings.deposit' : 'savings.withdraw',
    actorId: user.id,
    entity: 'savings',
    payload: {
      amount: amt,
      direction: action,
      inr_balance_before: inrBal,
      savings_balance_before: savBal,
    },
    req,
  })

  return NextResponse.json({ success: true })
}
