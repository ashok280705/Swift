import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowUpRight, ArrowDownLeft, Activity, FileSpreadsheet } from 'lucide-react'
import { Trans } from '@/lib/i18n'

const STATUS_PILL: Record<string, string> = {
  completed: 'sx-pill-mint',
  failed: 'sx-pill-coral',
  pending: 'sx-pill-amber',
  processing: 'sx-pill',
  reversed: 'sx-pill-slate',
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: txns } = await adminClient
    .from('transactions')
    .select('*, sender:profiles!transactions_sender_id_fkey(rm_id,full_name), receiver:profiles!transactions_receiver_id_fkey(rm_id,full_name)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  const sent = txns?.filter(t => t.sender_id === user.id).length ?? 0
  const received = txns?.filter(t => t.receiver_id === user.id).length ?? 0
  const completed = txns?.filter(t => t.status === 'completed').length ?? 0

  return (
    <div>
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="sx-h-eyebrow"><Trans tKey="history.eyebrow" /></p>
          <h1 className="sx-h-title mt-2"><Trans tKey="history.title" /></h1>
          <p className="sx-h-sub mt-1">{txns?.length ?? 0} most-recent transactions across your wallets.</p>
        </div>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { tKey: 'history.sent',      value: sent,      icon: ArrowUpRight,   accent: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' },
          { tKey: 'history.received',  value: received,  icon: ArrowDownLeft,  accent: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
          { tKey: 'history.completed', value: completed, icon: Activity,       accent: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' },
        ].map(({ tKey, value, icon: Icon, accent }) => (
          <div key={tKey} className="sx-card p-5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-white"
                  style={{ background: accent }}>
              <Icon size={16} />
            </span>
            <div>
              <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}><Trans tKey={tKey} /></p>
              <p className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity list — card-based, NOT a traditional table */}
      <div className="sx-card overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between"
             style={{ borderColor: 'var(--sx-line)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>Transaction stream</h3>
          <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--sx-ink-3)' }}>
            <FileSpreadsheet size={12} /> Last 50 entries
          </span>
        </div>

        {!txns?.length ? (
          <div className="text-center py-20">
            <Activity size={28} className="mx-auto opacity-30" style={{ color: 'var(--sx-ink-3)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--sx-ink-2)' }}>
              No transactions to display yet.
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--sx-line)' }}>
            {txns.map((t: any) => {
              const isSender = t.sender_id === user.id
              return (
                <li key={t.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-black/[0.015] transition"
                    style={{ borderTopColor: 'var(--sx-line)' }}>
                  <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl inline-flex items-center justify-center"
                          style={{
                            background: isSender ? 'rgba(244,63,94,0.10)' : 'rgba(16,185,129,0.10)',
                            color: isSender ? '#e11d48' : '#047857',
                          }}>
                      {isSender ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--sx-ink)' }}>
                        {isSender ? 'Sent to' : 'Received from'}{' '}
                        <span className="font-mono">{isSender ? t.receiver?.rm_id : t.sender?.rm_id}</span>
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--sx-ink-3)' }}>
                        {t.txn_ref?.slice(0, 12)}…
                      </p>
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>Amount</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--sx-ink)' }}>
                      {t.source_currency} {Number(t.source_amount).toLocaleString()}
                    </p>
                    {t.target_currency !== t.source_currency && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--sx-ink-3)' }}>
                        → {t.target_currency} {Number(t.target_amount).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="col-span-3 md:col-span-2">
                    <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}>Rate</p>
                    <p className="font-mono text-xs font-medium" style={{ color: 'var(--sx-ink-2)' }}>
                      {Number(t.fx_rate).toFixed(4)}
                    </p>
                  </div>

                  <div className="col-span-3 md:col-span-2 text-right">
                    <span className={`sx-pill ${STATUS_PILL[t.status] ?? 'sx-pill'}`}>{t.status}</span>
                    <p className="text-[11px] mt-1.5" style={{ color: 'var(--sx-ink-3)' }}>
                      {format(new Date(t.created_at), 'dd MMM, HH:mm')}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
