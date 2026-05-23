import { adminClient } from '@/lib/supabase/admin'
import type { Wallet } from '@/lib/types'

export async function getWallet(userId: string): Promise<Wallet | null> {
  const { data } = await adminClient
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

export async function getTransactionHistory(userId: string, limit = 20, offset = 0) {
  const { data, error } = await adminClient
    .from('transactions')
    .select(`
      *,
      sender:profiles!transactions_sender_id_fkey(rm_id, full_name),
      receiver:profiles!transactions_receiver_id_fkey(rm_id, full_name)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return { data, error }
}
