import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initiateTransfer } from '@/lib/transfer'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { recipient, source_currency, target_currency, amount, note } = body

  if (!recipient || !source_currency || !target_currency || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { summary, error } = await initiateTransfer({
    senderId: user.id,
    recipientIdentifier: recipient,
    sourceCurrency: source_currency,
    targetCurrency: target_currency,
    amount: Number(amount),
    note,
    req,
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ summary }, { status: 201 })
}
