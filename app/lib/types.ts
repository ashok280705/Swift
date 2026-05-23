export type KycStatus = 'pending' | 'verified' | 'rejected'
export type Role = 'user' | 'admin'
export type TxnStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reversed'
export type NotifType = 'info' | 'success' | 'warning' | 'error'

export interface Profile {
  id: string
  rm_id: string
  full_name: string
  email: string
  phone?: string
  country: string
  kyc_status: KycStatus
  role: Role
  is_frozen: boolean
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  inr_balance: number
  usd_balance: number
  aed_balance: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  txn_ref: string
  sender_id: string
  receiver_id: string
  source_currency: string
  target_currency: string
  source_amount: number
  target_amount: number
  fx_rate: number
  fee_amount: number
  fee_currency: string
  status: TxnStatus
  note?: string
  locked_rate_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  sender?: Profile
  receiver?: Profile
}

export interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  fetched_at: string
}

export interface Beneficiary {
  id: string
  user_id: string
  beneficiary_id: string
  nickname?: string
  created_at: string
  beneficiary?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: NotifType
  read: boolean
  created_at: string
}

export interface TransferSummary {
  txn_ref: string
  sender_rm_id: string
  receiver_rm_id: string
  source_amount: number
  source_currency: string
  target_amount: number
  target_currency: string
  fx_rate: number
  fee_amount: number
  status: TxnStatus
  timestamp: string
}
