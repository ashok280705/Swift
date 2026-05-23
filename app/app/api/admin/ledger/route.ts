import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { verifyLedger } from '@/lib/ledger'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? 200)

  const [events, verify] = await Promise.all([
    adminClient
      .from('ledger_events')
      .select('id, event_type, actor_id, target_id, entity, entity_id, payload, ip_address, prev_hash, row_hash, created_at')
      .order('id', { ascending: false })
      .limit(limit),
    verifyLedger(),
  ])

  return NextResponse.json({
    events: events.data ?? [],
    verify,
  })
}
