import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import AdminActions from '@/components/AdminActions'
import { Users, BadgeCheck, Activity, CheckCircle2 } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: users }, { data: txns }] = await Promise.all([
    adminClient.from('profiles').select('*, wallets(inr_balance,usd_balance,aed_balance)').order('created_at', { ascending: false }),
    adminClient
      .from('transactions')
      .select('*, sender:profiles!transactions_sender_id_fkey(rm_id), receiver:profiles!transactions_receiver_id_fkey(rm_id)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const stats = {
    totalUsers: users?.length ?? 0,
    verifiedKyc: users?.filter((u: any) => u.kyc_status === 'verified').length ?? 0,
    totalTxns: txns?.length ?? 0,
    completedTxns: txns?.filter((t: any) => t.status === 'completed').length ?? 0,
  }

  const STAT_CARDS = [
    { label: 'Total members',  value: stats.totalUsers,    icon: Users,        accent: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)' },
    { label: 'KYC verified',   value: stats.verifiedKyc,   icon: BadgeCheck,   accent: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    { label: 'Total transfers', value: stats.totalTxns,    icon: Activity,     accent: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)' },
    { label: 'Completed',      value: stats.completedTxns, icon: CheckCircle2, accent: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' },
  ]

  return (
    <div className="space-y-8">
      <header>
        <p className="sx-h-eyebrow">Admin console</p>
        <h1 className="sx-h-title mt-2">Platform health & operations</h1>
        <p className="sx-h-sub mt-1">Monitor members, verifications, and the global transfer pipeline.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="sx-card p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.10]" style={{ background: accent }} />
            <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center text-white"
                  style={{ background: accent }}>
              <Icon size={16} />
            </span>
            <p className="text-xs font-semibold mt-3" style={{ color: 'var(--sx-ink-3)' }}>{label}</p>
            <p className="text-3xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--sx-ink)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Users */}
      <section className="sx-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between"
             style={{ borderColor: 'var(--sx-line)' }}>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--sx-ink)' }}>Members</h3>
            <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>Manage KYC, freezes, and balances</p>
          </div>
          <span className="sx-pill">{users?.length ?? 0} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead style={{ background: 'var(--sx-panel-2)' }}>
              <tr>
                {['SwiftX ID', 'Name', 'Email', 'KYC', 'INR Balance', 'State', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--sx-ink-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--sx-line)' }}>
              {users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-black/[0.015] transition" style={{ borderTopColor: 'var(--sx-line)' }}>
                  <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: 'var(--sx-primary)' }}>{u.rm_id}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: 'var(--sx-ink)' }}>{u.full_name}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--sx-ink-3)' }}>{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`sx-pill ${
                      u.kyc_status === 'verified' ? 'sx-pill-mint' :
                      u.kyc_status === 'rejected' ? 'sx-pill-coral' : 'sx-pill-amber'
                    }`}>{u.kyc_status}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold" style={{ color: 'var(--sx-ink-2)' }}>
                    ₹{Number(u.wallets?.inr_balance ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`sx-pill ${u.is_frozen ? 'sx-pill-coral' : 'sx-pill-mint'}`}>
                      {u.is_frozen ? 'Frozen' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <AdminActions userId={u.id} isFrozen={u.is_frozen} kycStatus={u.kyc_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions */}
      <section className="sx-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between"
             style={{ borderColor: 'var(--sx-line)' }}>
          <div>
            <h3 className="font-bold" style={{ color: 'var(--sx-ink)' }}>Recent transfers</h3>
            <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>Last 50 transfers across the platform</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead style={{ background: 'var(--sx-panel-2)' }}>
              <tr>
                {['Ref', 'From', 'To', 'Amount', 'Converted', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'var(--sx-ink-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--sx-line)' }}>
              {txns?.map((t: any) => (
                <tr key={t.id} className="hover:bg-black/[0.015] transition" style={{ borderTopColor: 'var(--sx-line)' }}>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--sx-ink-2)' }}>{t.txn_ref}</td>
                  <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: 'var(--sx-primary)' }}>{t.sender?.rm_id}</td>
                  <td className="px-5 py-3 font-mono text-xs font-bold" style={{ color: '#0891b2' }}>{t.receiver?.rm_id}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: 'var(--sx-ink)' }}>
                    {t.source_currency} {Number(t.source_amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--sx-ink-2)' }}>
                    {t.target_currency} {Number(t.target_amount).toFixed(4)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`sx-pill ${
                      t.status === 'completed' ? 'sx-pill-mint' :
                      t.status === 'failed' ? 'sx-pill-coral' : 'sx-pill-amber'
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--sx-ink-3)' }}>
                    {format(new Date(t.created_at), 'dd MMM, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
