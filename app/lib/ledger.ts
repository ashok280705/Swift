/**
 * SwiftX tamper-evident ledger client.
 *
 * Every meaningful state change in the platform (registration, deposit,
 * withdrawal, transfer, savings move, admin action) is appended here as
 * an immutable, hash-chained event row in Postgres. To rewrite history
 * an attacker would have to recompute every hash from the tampered row
 * onwards AND defeat the BEFORE INSERT trigger that locks the chain head.
 */
import { adminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export type LedgerEvent =
  | 'auth.register'
  | 'auth.login'
  | 'deposit.completed'
  | 'withdraw.requested'
  | 'transfer.completed'
  | 'merchant.payment'
  | 'savings.deposit'
  | 'savings.withdraw'
  | 'admin.freeze'
  | 'admin.unfreeze'
  | 'admin.kyc_verify'
  | 'admin.kyc_reject'

interface LogParams {
  eventType: LedgerEvent
  actorId?: string | null
  targetId?: string | null
  entity?: string
  entityId?: string
  payload?: Record<string, any>
  req?: NextRequest
}

/**
 * Append a single tamper-evident event. Failures are logged but never thrown —
 * we don't want the ledger going down to block a payment from completing.
 */
export async function logEvent(p: LogParams): Promise<void> {
  try {
    await adminClient.from('ledger_events').insert({
      event_type: p.eventType,
      actor_id: p.actorId ?? null,
      target_id: p.targetId ?? null,
      entity: p.entity ?? null,
      entity_id: p.entityId ?? null,
      payload: sanitizePayload(p.payload ?? {}),
      ip_address: p.req ? requestIp(p.req) : null,
      user_agent: p.req?.headers.get('user-agent') ?? null,
    })
  } catch (err) {
    // Never throw — ledger must never block business logic.
    console.error('[ledger] failed to append event', p.eventType, err)
  }
}

/**
 * Walk the chain on the database side and confirm every hash matches.
 * Returns the chain length, the head hash (for off-site comparison),
 * and the first broken row id if integrity has failed.
 */
export async function verifyLedger() {
  const { data, error } = await adminClient.rpc('ledger_verify')
  if (error) return { ok: false as const, error: error.message }
  // RPCs returning TABLE(...) come back as an array of one row.
  const row = Array.isArray(data) ? data[0] : data
  return {
    ok: true as const,
    isValid: row?.is_valid as boolean,
    brokenAt: row?.broken_at as number | null,
    totalEvents: Number(row?.total_events ?? 0),
    headHash: row?.head_hash as string,
  }
}

// ── helpers ────────────────────────────────────────────────────────────
function requestIp(req: NextRequest): string | null {
  // Best-effort: respect common proxy headers first
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() ?? null
  const real = req.headers.get('x-real-ip')
  if (real) return real
  // @ts-expect-error — Next 16 may attach an ip property to the request
  return req.ip ?? null
}

/**
 * Strip obvious secrets before hashing them into the ledger.
 * Anyone with admin read access could otherwise see plaintext tokens.
 */
const SECRET_KEYS = new Set([
  'password', 'token', 'razorpay_signature', 'access_token', 'refresh_token',
  'secret', 'key_secret', 'service_role_key',
])
function sanitizePayload(p: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(p)) {
    if (SECRET_KEYS.has(k.toLowerCase())) { out[k] = '[redacted]'; continue }
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = sanitizePayload(v)
    else out[k] = v
  }
  return out
}
