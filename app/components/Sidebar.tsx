'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ArrowLeftRight, History, LogOut, Shield, ArrowDownToLine, ArrowUpFromLine,
  PiggyBank, Brain, TrendingUp, Menu, X, Copy, Check, Search, Bell, ChevronDown,
} from 'lucide-react'

const PRIMARY = [
  { href: '/dashboard',                 label: 'Overview',  icon: LayoutDashboard },
  { href: '/dashboard/transfer',        label: 'Send',      icon: ArrowLeftRight  },
  { href: '/dashboard/deposit',         label: 'Deposit',   icon: ArrowDownToLine },
  { href: '/dashboard/withdraw',        label: 'Withdraw',  icon: ArrowUpFromLine },
  { href: '/dashboard/savings',         label: 'Vault',     icon: PiggyBank       },
]

const SECONDARY = [
  { href: '/dashboard/history',         label: 'Activity',         icon: History    },
  { href: '/dashboard/investments',     label: 'Markets',          icon: TrendingUp },
  { href: '/dashboard/forex-predictor', label: 'Rate Intel',       icon: Brain      },
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
            {PRIMARY.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="sx-nav-link" data-active={isActive(href)}>
                <Icon size={16} /> {label}
              </Link>
            ))}
            <span className="mx-1 h-5 w-px" style={{ background: 'var(--sx-line)' }} />
            {SECONDARY.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="sx-nav-link" data-active={isActive(href)}>
                <Icon size={16} /> {label}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <>
                <Link href="/admin" className="sx-nav-link" data-active={pathname === '/admin'}>
                  <Shield size={16} /> Admin
                </Link>
                <Link href="/admin/ledger" className="sx-nav-link" data-active={pathname.startsWith('/admin/ledger')}>
                  <Shield size={16} /> Ledger
                </Link>
              </>
            )}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            <button title="Search (coming soon)"
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: 'var(--sx-line)', color: 'var(--sx-ink-3)' }}>
              <Search size={14} /> <span className="hidden xl:inline">Quick search</span>
              <kbd className="hidden xl:inline text-[10px] px-1.5 py-0.5 rounded border"
                style={{ borderColor: 'var(--sx-line)' }}>⌘K</kbd>
            </button>
            <button className="hidden md:inline-flex relative p-2 rounded-xl border" title="Notifications"
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
                  <span className="text-xs font-semibold" style={{ color: 'var(--sx-ink) ' }}>{profile?.full_name?.split(' ')[0] ?? 'Member'}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--sx-ink-3)' }}>{profile?.rm_id}</span>
                </span>
                <ChevronDown size={14} style={{ color: 'var(--sx-ink-3)' }} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-2xl border p-2 shadow-xl z-50"
                     style={{ borderColor: 'var(--sx-line)', background: 'var(--sx-panel)' }}>
                  <div className="p-3 rounded-xl mb-2"
                       style={{ background: 'var(--sx-primary-soft)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sx-ink-3)' }}>SwiftX ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold tracking-wider" style={{ color: 'var(--sx-primary)' }}>{profile?.rm_id}</span>
                      <button onClick={copyRm} className="ml-auto p-1.5 rounded-lg hover:bg-white/40"
                        title="Copy SwiftX ID" style={{ color: 'var(--sx-primary)' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <button onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50"
                    style={{ color: '#be123c' }}>
                    <LogOut size={16} /> Sign out
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
              {[...PRIMARY, ...SECONDARY, ...(profile?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: Shield }] : [])]
                .map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="sx-nav-link" data-active={isActive(href)}>
                    <Icon size={16} />{label}
                  </Link>
                ))}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
