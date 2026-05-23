import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWallet, getTransactionHistory } from '@/lib/wallet'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const view = searchParams.get('view')

  if (view === 'history') {
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const offset = parseInt(searchParams.get('offset') ?? '0')
    const { data, error } = await getTransactionHistory(user.id, limit, offset)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ transactions: data })
  }

  const wallet = await getWallet(user.id)
  return NextResponse.json({ wallet })
}
