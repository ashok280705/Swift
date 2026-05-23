import { adminClient } from '@/lib/supabase/admin'
import { getConversionQuote } from '@/lib/forex'
import { logEvent } from '@/lib/ledger'
import type { TransferSummary } from '@/lib/types'
import type { NextRequest } from 'next/server'

export async function lookupRecipient(identifier: string) {
  const { data } = await adminClient
    .from('profiles')
    .select('id, rm_id, full_name, email, phone, kyc_status, is_frozen')
    .or(`rm_id.eq.${identifier},email.eq.${identifier},phone.eq.${identifier}`)
    .single()
  return data
}

export async function initiateTransfer({
  senderId,
  recipientIdentifier,
  sourceCurrency,
  targetCurrency,
  amount,
  note,
  req,
}: {
  senderId: string
  recipientIdentifier: string
  sourceCurrency: string
  targetCurrency: string
  amount: number
  note?: string
  req?: NextRequest
}): Promise<{ summary: TransferSummary; error?: string }> {
  // Validate sender
  const { data: sender } = await adminClient
    .from('profiles')
    .select('id, rm_id, kyc_status, is_frozen, bank_fee_rate')
    .eq('id', senderId)
    .single()

  if (!sender) return { summary: null!, error: 'Sender not found' }
  if (sender.is_frozen) return { summary: null!, error: 'Account is frozen' }

  // Validate recipient
  const recipient = await lookupRecipient(recipientIdentifier)
  if (!recipient) return { summary: null!, error: 'Recipient not found' }
  if (recipient.is_frozen) return { summary: null!, error: 'Recipient account is frozen' }
  if (sender.id === recipient.id) return { summary: null!, error: 'Cannot transfer to yourself' }

  // Get conversion quote — per-account bank fee + flat Razorpay fee
  const bankFeeRate = Number(sender.bank_fee_rate ?? 0.0035)
  const { rate, fee, converted } = await getConversionQuote(
    sourceCurrency, targetCurrency, amount, bankFeeRate,
  )

  // Execute atomic transfer via DB function
  const { data: txnId, error: txnErr } = await adminClient.rpc('execute_transfer', {
    p_sender_id: sender.id,
    p_receiver_id: recipient.id,
    p_source_currency: sourceCurrency,
    p_target_currency: targetCurrency,
    p_source_amount: amount,
    p_target_amount: converted,
    p_fx_rate: rate,
    p_fee_amount: fee,
    p_note: note ?? null,
  })

  if (txnErr) return { summary: null!, error: txnErr.message }

  // Fetch created transaction for summary
  const { data: txn } = await adminClient
    .from('transactions')
    .select('txn_ref, created_at, status')
    .eq('id', txnId)
    .single()

  // Send notifications
  await Promise.all([
    adminClient.from('notifications').insert({
      user_id: sender.id,
      title: 'Transfer Sent',
      body: `You sent ${sourceCurrency} ${amount} to ${recipient.rm_id}. Ref: ${txn?.txn_ref}`,
      type: 'success',
    }),
    adminClient.from('notifications').insert({
      user_id: recipient.id,
      title: 'Transfer Received',
      body: `You received ${targetCurrency} ${converted} from ${sender.rm_id}. Ref: ${txn?.txn_ref}`,
      type: 'success',
    }),
  ])

  // Legacy audit log (kept for compat)
  await adminClient.from('audit_logs').insert({
    actor_id: sender.id,
    action: 'transfer',
    entity: 'transactions',
    entity_id: txnId,
    meta: { amount, sourceCurrency, targetCurrency, recipientId: recipient.id },
  })

  // Tamper-evident ledger entry — hash-chained to every previous event
  await logEvent({
    eventType: 'transfer.completed',
    actorId: sender.id,
    targetId: recipient.id,
    entity: 'transactions',
    entityId: String(txnId),
    payload: {
      txn_ref: txn?.txn_ref,
      source_currency: sourceCurrency,
      target_currency: targetCurrency,
      source_amount: amount,
      target_amount: converted,
      fx_rate: rate,
      fee_amount: fee,
      bank_fee_rate: bankFeeRate,
      sender_rm_id: sender.rm_id,
      receiver_rm_id: recipient.rm_id,
      note: note ?? null,
    },
    req,
  })

  const summary: TransferSummary = {
    txn_ref: txn?.txn_ref ?? '',
    sender_rm_id: sender.rm_id,
    receiver_rm_id: recipient.rm_id,
    source_amount: amount,
    source_currency: sourceCurrency,
    target_amount: converted,
    target_currency: targetCurrency,
    fx_rate: rate,
    fee_amount: fee,
    status: 'completed',
    timestamp: txn?.created_at ?? new Date().toISOString(),
  }

  return { summary }
}
