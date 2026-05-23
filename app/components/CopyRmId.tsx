'use client'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function CopyRmId({ rmId }: { rmId: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(rmId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="Copy SwiftX ID"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
      style={{
        background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.55)',
        color: copied ? '#047857' : 'var(--sx-primary)',
        border: '1px solid ' + (copied ? 'rgba(16,185,129,0.30)' : 'rgba(99,102,241,0.25)'),
      }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
