'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Globe2, ShieldCheck, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.05fr_1fr]">
      {/* Branding panel */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(900px 600px at 10% 10%, rgba(99,102,241,0.95) 0%, transparent 60%),' +
              'radial-gradient(800px 500px at 90% 90%, rgba(6,182,212,0.85) 0%, transparent 60%),' +
              'linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #6d28d9 100%)',
          }}
        />
        <div className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />

        <div className="flex items-center gap-2">
          <SwiftXMark />
          <span className="text-xl font-extrabold tracking-tight">SwiftX</span>
        </div>

        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">
            Money that crosses borders<br />as fast as a message.
          </h2>
          <p className="text-white/75 text-base leading-relaxed">
            Move funds across 50+ currencies, lock in real-time forex rates, and grow what you keep — all from one borderless workspace.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-4">
            {[
              { icon: Globe2,      title: 'Global reach',  body: 'Pay anyone in 180+ countries instantly.' },
              { icon: Zap,         title: 'Lightning fast', body: 'Settle most transfers in under 60 seconds.' },
              { icon: ShieldCheck, title: 'Bank-grade trust', body: 'Encryption, KYC, and 24/7 fraud watch.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-xl bg-white/15"><Icon size={18} /></div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-white/65">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} SwiftX Inc. · Borderless finance for everyone.
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col justify-center px-6 sm:px-10 md:px-16 py-12 sx-canvas">
        <div className="mx-auto w-full max-w-md sx-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <SwiftXMark dark />
            <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>SwiftX</span>
          </div>

          <p className="sx-h-eyebrow">Welcome back</p>
          <h1 className="sx-h-title mt-2">Sign in to your workspace</h1>
          <p className="sx-h-sub mt-1.5">Pick up exactly where you left off.</p>

          <form onSubmit={handleLogin} className="mt-10 space-y-4">
            {error && (
              <div className="text-sm font-medium rounded-xl px-4 py-3"
                   style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
                {error}
              </div>
            )}

            <div className="sx-field">
              <input
                id="sx-email" type="email" required
                placeholder=" "
                value={email} onChange={e => setEmail(e.target.value)}
              />
              <label htmlFor="sx-email">Email address</label>
            </div>

            <div className="sx-field">
              <input
                id="sx-pass" type={showPwd ? 'text' : 'password'} required
                placeholder=" "
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <label htmlFor="sx-pass">Password</label>
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5"
                style={{ color: 'var(--sx-ink-3)' }} aria-label="Toggle password">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" disabled={loading} className="sx-btn sx-btn-primary w-full py-3.5 text-[15px]">
              {loading ? 'Signing you in…' : <>Continue to SwiftX <ArrowRight size={16} /></>}
            </button>

            <p className="text-center text-sm pt-2" style={{ color: 'var(--sx-ink-3)' }}>
              New to SwiftX?{' '}
              <Link href="/register" className="font-semibold" style={{ color: 'var(--sx-primary)' }}>
                Create an account
              </Link>
            </p>
          </form>

          <div className="mt-12 pt-6 border-t flex items-center justify-between text-xs"
               style={{ borderColor: 'var(--sx-line)', color: 'var(--sx-ink-3)' }}>
            <span>Need help signing in?</span>
            <span className="flex items-center gap-1.5"><span className="sx-pulse-dot" /> All systems normal</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function SwiftXMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
      style={{
        background: dark
          ? 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'
          : 'rgba(255,255,255,0.18)',
        border: dark ? 'none' : '1px solid rgba(255,255,255,0.25)',
      }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 7L12 3L20 7V17L12 21L4 17V7Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 10L14 14M14 10L8 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  )
}
