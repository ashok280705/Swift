'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Sparkles, BadgeCheck, Wallet } from 'lucide-react'
import { useLang } from '@/lib/i18n'

const FIELDS = [
  { tKey: 'auth.fullname',  key: 'full_name', type: 'text'     },
  { tKey: 'auth.email',     key: 'email',     type: 'email'    },
  { tKey: 'auth.phone',     key: 'phone',     type: 'tel'      },
  { tKey: 'auth.createpwd', key: 'password',  type: 'password' },
] as const

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useLang()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1fr_1.05fr]">
      {/* Form panel (left on desktop) */}
      <section className="flex flex-col justify-center px-6 sm:px-10 md:px-16 py-12 sx-canvas order-2 lg:order-1">
        <div className="mx-auto w-full max-w-md sx-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
              <Sparkles size={18} color="#fff" />
            </span>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--sx-ink)' }}>SwiftX</span>
          </div>

          <p className="sx-h-eyebrow">{t('auth.reg.eyebrow')}</p>
          <h1 className="sx-h-title mt-2">{t('auth.reg.title')}</h1>
          <p className="sx-h-sub mt-1.5">{t('auth.reg.desc')}</p>

          <form onSubmit={handleRegister} className="mt-8 space-y-4">
            {error && (
              <div className="text-sm font-medium rounded-xl px-4 py-3"
                   style={{ background: 'rgba(244,63,94,0.08)', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)' }}>
                {error}
              </div>
            )}

            {FIELDS.map(({ tKey, key, type }) => {
              const isPwd = key === 'password'
              const inputType = isPwd ? (showPwd ? 'text' : 'password') : type
              return (
                <div key={key} className="sx-field">
                  <input
                    id={`sx-${key}`} type={inputType} placeholder=" "
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={key !== 'phone'}
                  />
                  <label htmlFor={`sx-${key}`}>{t(tKey)}</label>
                  {isPwd && (
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/5"
                      style={{ color: 'var(--sx-ink-3)' }} aria-label="Toggle password">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              )
            })}

            <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--sx-ink-3)' }}>
              {t('auth.terms')}
            </p>

            <button type="submit" disabled={loading} className="sx-btn sx-btn-primary w-full py-3.5 text-[15px]">
              {loading ? t('auth.creating') : <>{t('auth.createbtn')} <ArrowRight size={16} /></>}
            </button>

            <p className="text-center text-sm pt-2" style={{ color: 'var(--sx-ink-3)' }}>
              {t('auth.alreadyhave')}{' '}
              <Link href="/login" className="font-semibold" style={{ color: 'var(--sx-primary)' }}>
                {t('auth.signinhere')}
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* Branding panel (right on desktop) */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 text-white order-1 lg:order-2">
        <div className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(900px 600px at 90% 10%, rgba(99,102,241,0.95) 0%, transparent 60%),' +
              'radial-gradient(800px 500px at 10% 90%, rgba(6,182,212,0.85) 0%, transparent 60%),' +
              'linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #1e3a8a 100%)',
          }}
        />
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xl font-extrabold tracking-tight">SwiftX</span>
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <Sparkles size={18} />
          </span>
        </div>

        <div className="space-y-6 max-w-md ml-auto text-right">
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight">
            {t('auth.reg.h1')}<br />{t('auth.reg.h2')}<br />{t('auth.reg.h3')}
          </h2>
          <p className="text-white/75 text-base leading-relaxed">
            {t('auth.reg.sub')}
          </p>

          <div className="grid grid-cols-1 gap-3 pt-4">
            {[
              { icon: Wallet,     line: 'Multi-currency wallets out of the box' },
              { icon: BadgeCheck, line: 'Verified SwiftX ID for instant peer payouts' },
              { icon: Sparkles,   line: 'Live forex rates & smart rate intel' },
            ].map(({ icon: Icon, line }) => (
              <div key={line} className="flex items-center gap-3 p-3 rounded-2xl bg-white/8 border border-white/10 ml-auto">
                <div className="p-2 rounded-xl bg-white/15"><Icon size={16} /></div>
                <p className="text-sm font-medium">{line}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/60 text-right">
          Trusted by builders & savers across 40+ countries.
        </div>
      </aside>
    </div>
  )
}
