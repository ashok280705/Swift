import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { lookupRecipient } from '@/lib/transfer'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const recipient = await lookupRecipient(id)
  if (!recipient) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    rm_id: recipient.rm_id,
    full_name: recipient.full_name,
    kyc_status: recipient.kyc_status,
  })
}
