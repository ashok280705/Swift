'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ArrowLeftRight, History, LogOut, Shield, ArrowDownToLine, ArrowUpFromLine,
  PiggyBank, Brain, TrendingUp, Menu, X, Copy, Check, Bell, ChevronDown, ScanLine,
  FileSearch, Languages,
} from 'lucide-react'
import { useLang } from '@/lib/i18n'

const PRIMARY = [
  { href: '/dashboard',                 tKey: 'nav.overview',  icon: LayoutDashboard },
  { href: '/dashboard/pay',             tKey: 'nav.pay',       icon: ScanLine        },
  { href: '/dashboard/transfer',        tKey: 'nav.send',      icon: ArrowLeftRight  },
  { href: '/dashboard/deposit',         tKey: 'nav.deposit',   icon: ArrowDownToLine },
  { href: '/dashboard/withdraw',        tKey: 'nav.withdraw',  icon: ArrowUpFromLine },
  { href: '/dashboard/savings',         tKey: 'nav.vault',     icon: PiggyBank       },
]

const SECONDARY = [
  { href: '/dashboard/history',         tKey: 'nav.activity',   icon: History    },
  { href: '/dashboard/investments',     tKey: 'nav.markets',    icon: TrendingUp },
  { href: '/dashboard/forex-predictor', tKey: 'nav.rateintel',  icon: Brain      },
]

/**
 * TopNav — SwiftX's primary topbar navigation.
 * (Filename retained for compatibility.)
 */
export default function Sidebar({
  profile, mobileOpen = false, setMobileOpen,
}: { profile: any; mobileOpen?: boolean; setMobileOpen?: (v: boolean) => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { lang, setLang, t } = useLang()
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function copyRm() {
    if (!profile?.rm_id) return
    navigator.clipboard.writeText(profile.rm_id)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  useEffect(() => {
    setMobileOpen?.(false)
    setMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const isActive = (href: string) => href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname === href || pathname.startsWith(href + '/')

  const initials = (profile?.full_name ?? 'SX').split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ borderColor: 'var(--sx-line)', background: 'rgba(255,255,255,0.78)' }}>
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 h-16 flex items-center gap-4">
          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 7L12 3L20 7V17L12 21L4 17V7Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8 10L14 14M14 10L8 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight hidden sm:inline" style={{ color: 'var(--sx-ink)' }}>
              SwiftX
            </span>
          </Link>

          {/* Primary nav */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4">
            {PRIMARY.map(({ href, tKey, icon: Icon }) => (
              <Link key={href} href={href} className="sx-nav-link" data-active={isActive(href)}>
                <Icon size={16} /> {t(tKey)}
              </Link>
            ))}
            <span className="mx-1 h-5 w-px" style={{ background: 'var(--sx-line)' }} />
            {SECONDARY.map(({ href, tKey, icon: Icon }) => (
              <Link key={href} href={href} className="sx-nav-link" data-active={isActive(href)}>
                <Icon size={16} /> {t(tKey)}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <>
                <Link href="/admin" className="sx-nav-link" data-active={pathname === '/admin'}>
                  <Shield size={16} /> {t('nav.admin')}
                </Link>
                <Link href="/admin/ledger" className="sx-nav-link" data-active={pathname.startsWith('/admin/ledger')}>
                  <FileSearch size={16} /> {t('nav.ledger')}
                </Link>
              </>
            )}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            {/* Language toggle (replaces the old Quick-search button) */}
            <div className="hidden md:inline-flex items-center gap-1 p-1 rounded-xl border"
                 style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)' }}
                 role="group" aria-label="Language">
              <Languages size={13} style={{ color: 'var(--sx-ink-3)', marginLeft: 4 }} />
              {(['en', 'hi'] as const).map(l => {
                const active = lang === l
                return (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    aria-pressed={active}
                    title={l === 'en' ? 'English' : 'हिन्दी'}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg transition"
                    style={{
                      background: active ? 'var(--sx-primary-soft)' : 'transparent',
                      color: active ? 'var(--sx-primary)' : 'var(--sx-ink-3)',
                    }}>
                    {l === 'en' ? 'EN' : 'हिं'}
                  </button>
                )
              })}
            </div>

            <button className="hidden md:inline-flex relative p-2 rounded-xl border" title={t('nav.notifications')}
              style={{ borderColor: 'var(--sx-line)', color: 'var(--sx-ink-2)' }}>
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--sx-coral)' }} />
            </button>

            {/* Profile chip */}
            <div className="relative">
              <button onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl border hover:shadow-sm transition"
                style={{ borderColor: 'var(--sx-line)' }}>
                <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)' }}>{initials}</span>
                <span className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold" style={{ color: 'var(--sx-ink) ' }}>{profile?.full_name?.split(' ')[0] ?? t('nav.member')}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--sx-ink-3)' }}>{profile?.rm_id}</span>
                </span>
                <ChevronDown size={14} style={{ color: 'var(--sx-ink-3)' }} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-2xl border p-2 shadow-xl z-50"
                     style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)' }}>
                  <div className="p-3 rounded-xl mb-2"
                       style={{ background: 'var(--sx-primary-soft)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sx-ink-3)' }}>{t('nav.swiftxid')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold tracking-wider" style={{ color: 'var(--sx-primary)' }}>{profile?.rm_id}</span>
                      <button onClick={copyRm} className="ml-auto p-1.5 rounded-lg hover:bg-white/40"
                        title={t('nav.copyid')} style={{ color: 'var(--sx-primary)' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile-only language toggle inside the menu */}
                  <div className="md:hidden flex items-center gap-1 p-1 rounded-xl border mb-1"
                       style={{ borderColor: 'var(--sx-line)' }}>
                    <Languages size={13} style={{ color: 'var(--sx-ink-3)', marginLeft: 4 }} />
                    {(['en', 'hi'] as const).map(l => {
                      const active = lang === l
                      return (
                        <button key={l} onClick={() => setLang(l)}
                          className="flex-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                          style={{
                            background: active ? 'var(--sx-primary-soft)' : 'transparent',
                            color: active ? 'var(--sx-primary)' : 'var(--sx-ink-3)',
                          }}>
                          {l === 'en' ? 'English' : 'हिन्दी'}
                        </button>
                      )
                    })}
                  </div>

                  <button onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50"
                    style={{ color: '#be123c' }}>
                    <LogOut size={16} /> {t('nav.signout')}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button className="lg:hidden p-2 rounded-xl border"
              style={{ borderColor: 'var(--sx-line)', color: 'var(--sx-ink-2)' }}
              onClick={() => setMobileOpen?.(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)' }}>
            <nav className="px-4 py-3 grid grid-cols-2 gap-1.5">
              {[
                ...PRIMARY,
                ...SECONDARY,
                ...(profile?.role === 'admin'
                  ? [{ href: '/admin', tKey: 'nav.admin', icon: Shield }, { href: '/admin/ledger', tKey: 'nav.ledger', icon: FileSearch }]
                  : []),
              ].map(({ href, tKey, icon: Icon }) => (
                <Link key={href} href={href} className="sx-nav-link" data-active={isActive(href)}>
                  <Icon size={16} />{t(tKey)}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
