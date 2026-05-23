import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  ArrowUpRight, ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, PiggyBank,
  Send, Activity, Brain, ScanLine,
} from 'lucide-react'
import CopyRmId from '@/components/CopyRmId'
import WalletCards from '@/components/WalletCards'
import { Trans } from '@/lib/i18n'
import Greeting from '@/components/Greeting'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: inrWallet }, { data: usdWallet }, { data: savings }, { data: txns }] = await Promise.all([
    adminClient.from('profiles').select('rm_id, full_name').eq('id', user.id).single(),
    adminClient.from('wallets_inr').select('balance').eq('user_id', user.id).single(),
    adminClient.from('wallets_usd').select('balance').eq('user_id', user.id).single(),
    adminClient.from('savings').select('balance').eq('user_id', user.id).single(),
    adminClient
      .from('transactions')
      .select('*, sender:profiles!transactions_sender_id_fkey(rm_id), receiver:profiles!transactions_receiver_id_fkey(rm_id)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-10">
      {/* Hero banner */}
      <section className="sx-hero-gradient p-7 md:p-10 relative overflow-hidden">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-8 items-center">
          <div>
            <p className="sx-h-eyebrow" style={{ color: 'var(--sx-primary)' }}>
              <Greeting name={firstName} />
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>
              <Trans tKey="dash.hero.title1" />
              <br /><Trans tKey="dash.hero.title2" />
            </h1>
            <p className="mt-3 max-w-lg text-base" style={{ color: 'var(--sx-ink-2)' }}>
              <Trans tKey="dash.hero.desc" />
            </p>

            <div className="mt-6 flex items-center flex-wrap gap-3">
              <Link href="/dashboard/transfer" className="sx-btn sx-btn-primary">
                <Send size={15} /> <Trans tKey="dash.hero.send" />
              </Link>
              <Link href="/dashboard/deposit" className="sx-btn sx-btn-ghost">
                <ArrowDownToLine size={15} /> <Trans tKey="dash.hero.deposit" />
              </Link>
              <Link href="/dashboard/forex-predictor" className="sx-btn sx-btn-ghost">
                <Brain size={15} /> <Trans tKey="dash.hero.rateintel" />
              </Link>
            </div>
          </div>

          {/* SwiftX ID card */}
          <div className="sx-glass p-5 md:p-6 self-end relative">
            <div className="flex items-center justify-between">
              <span className="sx-pill"><Trans tKey="dash.id.label" /></span>
              <CopyRmId rmId={profile?.rm_id ?? ''} />
            </div>
            <p className="mt-4 font-mono font-extrabold text-2xl tracking-[0.18em]"
               style={{ color: 'var(--sx-primary)' }}>
              {profile?.rm_id}
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--sx-ink-3)' }}>
              <Trans tKey="dash.id.desc" />
            </p>
          </div>
        </div>
      </section>

      {/* Wallet snapshot */}
      <WalletCards
        inrBalance={Number(inrWallet?.balance ?? 0)}
        usdBalance={Number(usdWallet?.balance ?? 0)}
        savingsBalance={Number(savings?.balance ?? 0)}
      />

      {/* Quick action tiles */}
      <section>
        <p className="sx-h-eyebrow mb-3"><Trans tKey="dash.qa.title" /></p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/dashboard/pay',      titleK: 'dash.qa.scan.title',     descK: 'dash.qa.scan.desc',     icon: ScanLine,        accent: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' },
            { href: '/dashboard/transfer', titleK: 'dash.qa.send.title',     descK: 'dash.qa.send.desc',     icon: ArrowUpRight,    accent: 'linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)' },
            { href: '/dashboard/deposit',  titleK: 'dash.qa.deposit.title',  descK: 'dash.qa.deposit.desc',  icon: ArrowDownToLine, accent: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
            { href: '/dashboard/withdraw', titleK: 'dash.qa.withdraw.title', descK: 'dash.qa.withdraw.desc', icon: ArrowUpFromLine, accent: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' },
          ].map(({ href, titleK, descK, icon: Icon, accent }) => (
            <Link key={href} href={href}
              className="sx-card p-5 group flex flex-col gap-3 hover:-translate-y-0.5 transition-transform">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-white"
                    style={{ background: accent }}>
                <Icon size={18} />
              </span>
              <div>
                <p className="font-semibold text-base" style={{ color: 'var(--sx-ink)' }}><Trans tKey={titleK} /></p>
                <p className="text-xs" style={{ color: 'var(--sx-ink-3)' }}><Trans tKey={descK} /></p>
              </div>
              <span className="text-xs font-semibold inline-flex items-center gap-1 mt-auto"
                    style={{ color: 'var(--sx-primary)' }}>
                <Trans tKey="dash.qa.open" /> <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Activity + Insights split */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Activity feed */}
        <div className="sx-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 rounded-lg items-center justify-center"
                    style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
                <Activity size={15} />
              </span>
              <h3 className="font-bold text-base" style={{ color: 'var(--sx-ink)' }}><Trans tKey="dash.activity.title" /></h3>
            </div>
            <Link href="/dashboard/history" className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--sx-primary)' }}>
              <Trans tKey="dash.activity.viewall" />
            </Link>
          </div>

          {!txns?.length ? (
            <div className="text-center py-12">
              <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-3"
                   style={{ background: 'var(--sx-primary-soft)', color: 'var(--sx-primary)' }}>
                <Send size={22} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--sx-ink-2)' }}>
                <Trans tKey="dash.activity.none" />
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--sx-ink-3)' }}>
                <Trans tKey="dash.activity.cta" />
              </p>
              <Link href="/dashboard/transfer" className="sx-btn sx-btn-secondary mt-4 inline-flex">
                <Trans tKey="dash.activity.start" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--sx-line)' }}>
              {txns.map((t: any) => {
                const isSender = t.sender_id === user.id
                const srcCur = t.source_currency ?? '—'
                const tgtCur = t.target_currency ?? '—'
                const srcAmt = t.source_amount ? Number(t.source_amount).toLocaleString() : '—'
                const tgtAmt = t.target_amount ? Number(t.target_amount).toFixed(4) : null
                return (
                  <li key={t.id} className="py-3.5 flex items-center gap-4"
                      style={{ borderTopColor: 'var(--sx-line)' }}>
                    <span className="w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0"
                          style={{
                            background: isSender ? 'rgba(244,63,94,0.10)' : 'rgba(16,185,129,0.10)',
                            color: isSender ? '#e11d48' : '#047857',
                          }}>
                      {isSender ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--sx-ink)' }}>
                        {t.txn_ref ?? t.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--sx-ink-3)' }}>
                        {isSender ? `To ${t.receiver?.rm_id}` : `From ${t.sender?.rm_id}`}
                        {' · '}{format(new Date(t.created_at), 'dd MMM, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tracking-tight"
                         style={{ color: isSender ? '#e11d48' : '#047857' }}>
                        {isSender ? '-' : '+'}{srcCur} {srcAmt}
                      </p>
                      {tgtAmt && srcCur !== tgtCur && (
                        <p className="text-[11px] font-medium" style={{ color: 'var(--sx-ink-3)' }}>
                          → {tgtCur} {tgtAmt}
                        </p>
                      )}
                      <span className={`sx-pill ${t.status === 'completed' ? 'sx-pill-mint' : 'sx-pill-amber'} mt-1.5`}>
                        {t.status}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Insights stack */}
        <div className="space-y-5">
          <div className="sx-card p-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                 style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', opacity: 0.10 }} />
            <span className="sx-pill sx-pill-violet">
              <Brain size={12} /> <Trans tKey="dash.insight.smart.eyebrow" />
            </span>
            <h4 className="font-bold mt-3" style={{ color: 'var(--sx-ink)' }}>
              <Trans tKey="dash.insight.smart.title" />
            </h4>
            <p className="text-sm mt-1.5" style={{ color: 'var(--sx-ink-2)' }}>
              <Trans tKey="dash.insight.smart.body" />
            </p>
            <Link href="/dashboard/forex-predictor" className="sx-btn sx-btn-ghost mt-4 text-xs">
              <Trans tKey="dash.insight.smart.cta" /> <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="sx-card p-6">
            <span className="sx-pill sx-pill-mint">
              <PiggyBank size={12} /> <Trans tKey="dash.insight.vault.eyebrow" />
            </span>
            <h4 className="font-bold mt-3" style={{ color: 'var(--sx-ink)' }}>
              <Trans tKey="dash.insight.vault.title" />
            </h4>
            <p className="text-sm mt-1.5" style={{ color: 'var(--sx-ink-2)' }}>
              <Trans tKey="dash.insight.vault.body" />
            </p>
            <Link href="/dashboard/savings" className="sx-btn sx-btn-primary mt-4 text-xs">
              <Trans tKey="dash.insight.vault.cta" /> <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
