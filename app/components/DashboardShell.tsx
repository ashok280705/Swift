'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

/**
 * AppFrame — top-nav + content workspace for SwiftX.
 * (Filename retained for import compatibility; structure is brand-new.)
 */
export default function DashboardShell({ profile, children }: { profile: any; children: React.ReactNode }) {
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileMenu(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sx-canvas)' }}>
      <Sidebar profile={profile} mobileOpen={mobileMenu} setMobileOpen={setMobileMenu} />

      <main className="flex-1 w-full">
        <div className="mx-auto w-full max-w-[1380px] px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-16">
          <div className="sx-fade-up">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t mt-auto" style={{ borderColor: 'var(--sx-line)' }}>
        <div className="mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-3 text-xs"
             style={{ color: 'var(--sx-ink-3)' }}>
          <span>© {new Date().getFullYear()} SwiftX — Borderless money movement.</span>
          <span className="flex items-center gap-2"><span className="sx-pulse-dot" /> Network healthy · v1.0</span>
        </div>
      </footer>
    </div>
  )
}
