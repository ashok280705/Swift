import { NextRequest, NextResponse } from 'next/server'

const COUNTRY_QUERIES: Record<string, string> = {
  IN: 'best investment plans India 2026 government schemes returns',
  US: 'best investment plans USA 2026 401k IRA bonds ETF',
  GB: 'best investment plans UK 2026 ISA pension bonds',
  AE: 'best investment plans UAE 2026 fixed deposit bonds real estate',
  SG: 'best investment plans Singapore 2026 CPF SSB REITs',
  AU: 'best investment plans Australia 2026 superannuation ETF bonds',
  CA: 'best investment plans Canada 2026 RRSP TFSA bonds',
  JP: 'best investment plans Japan 2026 NISA bonds funds',
}

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') ?? 'IN'
  const search = req.nextUrl.searchParams.get('q')

  const query = search
    ? `${search} investment plan ${country} 2026`
    : (COUNTRY_QUERIES[country] ?? `best investment plans ${country} 2026`)

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 9 }),
      next: { revalidate: 3600 },
    })

    const data = await res.json()
    const plans = (data.organic ?? []).slice(0, 9).map((r: any) => ({
      title: r.title ?? '',
      link: r.link ?? '#',
      snippet: r.snippet ?? '',
      source: r.displayLink ?? new URL(r.link ?? 'https://example.com').hostname,
      sitelinks: r.sitelinks?.slice(0, 2) ?? [],
    }))

    return NextResponse.json({ plans, query })
  } catch (err: any) {
    return NextResponse.json({ plans: [], error: err.message }, { status: 500 })
  }
}
