import { NextRequest, NextResponse } from 'next/server'
import { getLiveRate, getConversionQuote, DEFAULT_BANK_FEE_RATE } from '@/lib/forex'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const base = searchParams.get('base') ?? 'INR'
  const target = searchParams.get('target') ?? 'USD'
  const amount = parseFloat(searchParams.get('amount') ?? '0')

  if (amount > 0) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('bank_fee_rate')
      .eq('id', user.id)
      .single()

    const bankFeeRate = Number(profile?.bank_fee_rate ?? DEFAULT_BANK_FEE_RATE)
    const quote = await getConversionQuote(base, target, amount, bankFeeRate)
    return NextResponse.json(quote)
  }

  const rate = await getLiveRate(base, target)
  return NextResponse.json({ base, target, rate })
}
