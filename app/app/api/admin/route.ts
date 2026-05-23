import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/ledger'

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = req.nextUrl
  const view = searchParams.get('view') ?? 'transfers'

  if (view === 'transfers') {
    const { data } = await adminClient
      .from('transactions')
      .select('*, sender:profiles!transactions_sender_id_fkey(rm_id,full_name), receiver:profiles!transactions_receiver_id_fkey(rm_id,full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ data })
  }

  if (view === 'users') {
    const { data } = await adminClient
      .from('profiles')
      .select('*, wallets(*)')
      .order('created_at', { ascending: false })
    return NextResponse.json({ data })
  }

  if (view === 'stats') {
    const [txns, users] = await Promise.all([
      adminClient.from('transactions').select('status, source_amount, source_currency'),
      adminClient.from('profiles').select('kyc_status'),
    ])
    return NextResponse.json({ txns: txns.data, users: users.data })
  }

  return NextResponse.json({ error: 'Unknown view' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, user_id, kyc_status } = await req.json()

  if (action === 'freeze') {
    await adminClient.from('profiles').update({ is_frozen: true }).eq('id', user_id)
    await logEvent({
      eventType: 'admin.freeze', actorId: admin.id, targetId: user_id,
      entity: 'profiles', entityId: user_id, payload: { user_id }, req,
    })
    return NextResponse.json({ success: true })
  }
  if (action === 'unfreeze') {
    await adminClient.from('profiles').update({ is_frozen: false }).eq('id', user_id)
    await logEvent({
      eventType: 'admin.unfreeze', actorId: admin.id, targetId: user_id,
      entity: 'profiles', entityId: user_id, payload: { user_id }, req,
    })
    return NextResponse.json({ success: true })
  }
  if (action === 'kyc') {
    await adminClient.from('profiles').update({ kyc_status }).eq('id', user_id)
    await logEvent({
      eventType: kyc_status === 'verified' ? 'admin.kyc_verify' : 'admin.kyc_reject',
      actorId: admin.id, targetId: user_id,
      entity: 'profiles', entityId: user_id, payload: { kyc_status }, req,
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
