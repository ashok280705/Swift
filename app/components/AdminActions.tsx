'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Unlock, ShieldCheck } from 'lucide-react'

export default function AdminActions({
  userId, isFrozen, kycStatus,
}: { userId: string; isFrozen: boolean; kycStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function act(action: string, extra?: object) {
    setLoading(true)
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, user_id: userId, ...extra }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => act(isFrozen ? 'unfreeze' : 'freeze')}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
        style={{
          background: isFrozen ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.10)',
          color: isFrozen ? '#047857' : '#be123c',
        }}>
        {isFrozen ? <Unlock size={11} /> : <Lock size={11} />}
        {isFrozen ? 'Unfreeze' : 'Freeze'}
      </button>
      {kycStatus === 'pending' && (
        <button
          onClick={() => act('kyc', { kyc_status: 'verified' })}
          disabled={loading}
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--sx-primary)' }}>
          <ShieldCheck size={11} /> Verify KYC
        </button>
      )}
    </div>
  )
}
